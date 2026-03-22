/**
 * agent_server.ts
 * DataForge Platform Agent
 *
 * Run register.ts FIRST to get your apiKey and participantId.
 * This server reads from agent_log.json and starts serving.
 *
 * Chain layout:
 *   ERC-8004 Identity → Base Mainnet (via Synthesis, done in register.ts)
 *   x402 payments     → Base Sepolia (USDC)
 *   Marketplace       → Filecoin Calibration (existing contract)
 */

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import * as fs           from 'fs'

import express           from 'express'
import dotenv            from 'dotenv'

import {
    createWalletClient,
    createPublicClient,
    http,
    custom,
    formatEther,
    getAddress,
} from 'viem'
import { privateKeyToAccount }         from 'viem/accounts'
import { filecoinCalibration }         from 'viem/chains'
import { Synapse, calibration }        from '@filoz/synapse-sdk'
import { paymentMiddleware }           from '@x402/express'
import { x402ResourceServer }          from '@x402/core/server'
import { ExactEvmScheme }              from '@x402/evm/exact/server'
import { HTTPFacilitatorClient }       from '@x402/core/server'
import { serverDecrypt }               from './lit_server'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env') })

// ─────────────────────────────────────────────
// ENV
// ─────────────────────────────────────────────
const AGENT_PRIVATE_KEY   = process.env.AGENT_PRIVATE_KEY   as `0x${string}`
const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS as `0x${string}`
const PORT                = parseInt(process.env.PORT || '4000')
const FILECOIN_RPC        = process.env.FILECOIN_RPC || 'https://api.calibration.node.glif.io/rpc/v1'

if (!AGENT_PRIVATE_KEY || !MARKETPLACE_ADDRESS) {
    console.error('❌ Missing AGENT_PRIVATE_KEY or MARKETPLACE_ADDRESS in .env')
    process.exit(1)
}

// ─────────────────────────────────────────────
// ACCOUNTS & CLIENTS
// ─────────────────────────────────────────────
const agentAccount = privateKeyToAccount(AGENT_PRIVATE_KEY)
const agentAddress = getAddress(agentAccount.address)
console.log(`Platform Agent: ${agentAddress}`)

const filecoinWallet = createWalletClient({
    account:   agentAccount,
    chain:     filecoinCalibration,
    transport: http(FILECOIN_RPC),
})
const filecoinPublic = createPublicClient({
    chain:     filecoinCalibration,
    transport: http(FILECOIN_RPC),
})

// ─────────────────────────────────────────────
// SYNAPSE — server-side with private key
// Uses the official pattern from the docs:
// Synapse.create({ rpcURL, privateKey })
// No custom transport needed.
// ─────────────────────────────────────────────
async function getSynapse() {
    return Synapse.create({
        transport: custom({
            async request({ method, params }: { method: string; params: any[] }) {
                if (method === 'eth_signTypedData_v4') {
                    const [, typedDataStr] = params
                    const parsed = JSON.parse(typedDataStr)
                    return await filecoinWallet.signTypedData({
                        account:     agentAccount,
                        domain:      parsed.domain,
                        types:       parsed.types,
                        primaryType: parsed.primaryType as any,
                        message:     parsed.message,
                    })
                }
                if (method === 'eth_sendTransaction') {
                    const [tx] = params
                    return await filecoinWallet.sendTransaction({
                        to:    tx.to,
                        data:  tx.data,
                        value: tx.value ? BigInt(tx.value) : undefined,
                    })
                }
                const res = await fetch(FILECOIN_RPC, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
                })
                const data = await res.json()
                if (data.error) throw new Error(data.error.message)
                return data.result
            }
        }),
        chain:   calibration,
        account: agentAddress,
        source:  'dataforge-agent',
    })
}

// ─────────────────────────────────────────────
// MARKETPLACE ABI
// ─────────────────────────────────────────────
const marketplaceAbi = [
    {
        name: 'listings', type: 'function',
        inputs:  [{ name: '', type: 'uint256' }],
        outputs: [
            { name: 'seller',        type: 'address' },
            { name: 'cid',           type: 'string'  },
            { name: 'previewCid',    type: 'string'  },
            { name: 'name',          type: 'string'  },
            { name: 'description',   type: 'string'  },
            { name: 'category',      type: 'string'  },
            { name: 'fileFormat',    type: 'string'  },
            { name: 'rowCount',      type: 'uint256' },
            { name: 'fileSizeBytes', type: 'uint256' },
            { name: 'price',         type: 'uint256' },
            { name: 'sold',          type: 'bool'    },
            { name: 'active',        type: 'bool'    },
            { name: 'listingType',   type: 'uint8'   },
        ],
        stateMutability: 'view',
    },
    {
        name: 'getActiveListings', type: 'function',
        inputs:  [],
        outputs: [{ name: '', type: 'uint256[]' }],
        stateMutability: 'view',
    },
    {
        name: 'purchaseDataset', type: 'function',
        inputs:  [{ name: 'listingId', type: 'uint256' }],
        outputs: [],
        stateMutability: 'payable',
    },
    {
        name: 'isAuthorized', type: 'function',
        inputs:  [
            { name: 'listingId', type: 'uint256' },
            { name: 'user',      type: 'address' },
        ],
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view',
    },
] as const

// ─────────────────────────────────────────────
// AGENT LOG
// ─────────────────────────────────────────────
const LOG_FILE = join(__dirname, 'agent_log.json')

interface AgentLog {
    participantId:   string | null
    teamId:          string | null
    synthesisApiKey: string | null
    registrationTxn: string | null
    registeredAt:    string | null
    transactions: {
        listingId:  number
        buyer:      string
        purchaseTx: string
        x402TxHash: string
        timestamp:  string
        filPaid:    string
    }[]
}

function readLog(): AgentLog {
    if (fs.existsSync(LOG_FILE)) return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'))
    return {
        participantId: null, teamId: null,
        synthesisApiKey: null, registrationTxn: null,
        registeredAt: null, transactions: [],
    }
}
function writeLog(log: AgentLog) {
    fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2))
}

// ─────────────────────────────────────────────
// UPLOAD agent.json TO FILECOIN VIA SYNAPSE
// ─────────────────────────────────────────────
async function uploadAgentCard(): Promise<string> {
    const agentCard = {
        type:         'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
        name:         'DataForge Platform Agent',
        description:  'Autonomous broker for Lit-encrypted datasets on DataForge. External agents discover datasets, pay via x402 (USDC on Base Sepolia), and receive decrypted data. Sellers earn FIL automatically via the onchain marketplace.',
        version:      '1.0.0',
        image:        'https://dataforge.app/logo.png',
        operator:     agentAddress,
        capabilities: ['dataset.discover', 'dataset.broker', 'dataset.decrypt'],
        services: [
            { name: 'discovery', endpoint: '/listings'    },
            { name: 'purchase',  endpoint: '/dataset/:id' },
            { name: 'health',    endpoint: '/health'      },
        ],
        payment: {
            protocol: 'x402',
            network:  'base-sepolia',
            token:    'USDC',
            payTo:    agentAddress,
        },
        storage: {
            network:    'filecoin-calibration',
            sdk:        '@filoz/synapse-sdk',
            encryption: 'lit-protocol-v8-naga',
        },
        identity: {
            standard: 'ERC-8004',
            chain:    'base-mainnet',
        },
        marketplace: MARKETPLACE_ADDRESS,
    }

    fs.writeFileSync(join(__dirname, 'agent.json'), JSON.stringify(agentCard, null, 2))
    console.log('agent.json written')

    const synapse = await getSynapse()
    const bytes   = new TextEncoder().encode(JSON.stringify(agentCard))
    const result  = await synapse.storage.upload(bytes)
    const cid     = result.pieceCid.toString()
    console.log(`agent.json stored on Filecoin. CID: ${cid}`)
    return cid
}

// ─────────────────────────────────────────────
// STARTUP — check registration, then start server
// ─────────────────────────────────────────────
function startup() {
    const log = readLog()
    if (!log.participantId || !log.synthesisApiKey) {
        console.error('❌ Not registered yet. Run: npx tsx register.ts')
        process.exit(1)
    }
    console.log(`✅ Registered. Participant ID: ${log.participantId}`)
    console.log(`🔗 ERC-8004 Tx: ${log.registrationTxn}`)
}

// ─────────────────────────────────────────────
// PRICE ORACLE
// ─────────────────────────────────────────────
const CACHE_DURATION = 60000
let cachedFilPrice = 0
let lastFilPriceFetch = 0

async function getFilPriceInUsd(): Promise<number> {
    if (Date.now() - lastFilPriceFetch < CACHE_DURATION && cachedFilPrice > 0) {
        return cachedFilPrice
    }
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=filecoin&vs_currencies=usd')
        const data = await res.json()
        cachedFilPrice = data.filecoin.usd
        lastFilPriceFetch = Date.now()
    } catch (err) {
        console.warn('Failed to fetch FIL price:', err)
        if (cachedFilPrice === 0) throw new Error("Price oracle unavailable")
    }
    return cachedFilPrice
}

// ─────────────────────────────────────────────
// EXPRESS + x402
// ─────────────────────────────────────────────
const app = express()
app.use(express.json())

const facilitator = new HTTPFacilitatorClient({ url: 'https://x402.org/facilitator' })
const resourceSrv = new x402ResourceServer(facilitator)
resourceSrv.register('eip155:84532', new ExactEvmScheme())

app.use(paymentMiddleware(
    {
        'GET /dataset/:id': {
            accepts: [{
                scheme:  'exact',
                network: 'eip155:84532',
                payTo:   agentAddress,
                price:   async (ctx: any) => {
                    const match = ctx.path.match(/\/dataset\/(\d+)/)
                    if (!match) throw new Error("Invalid id")
                    const listingId = BigInt(match[1])

                    const raw = await filecoinPublic.readContract({
                        address:      MARKETPLACE_ADDRESS,
                        abi:          marketplaceAbi,
                        functionName: 'listings',
                        args:         [listingId],
                    }) as unknown as any[]

                    const filPriceFormat = formatEther(raw[9])
                    const filUsdRate = await getFilPriceInUsd()
                    
                    const usdRequired = (parseFloat(filPriceFormat) * filUsdRate).toFixed(6)
                    return `$${usdRequired}`
                },
            }],
            description: 'Access Lit-encrypted dataset from DataForge marketplace',
        },
    },
    resourceSrv,
))

// ─────────────────────────────────────────────
// GET /dataset/:id
// ─────────────────────────────────────────────
app.get('/dataset/:id', async (req, res) => {
    const listingId = parseInt(req.params.id)
    const log       = readLog()

    try {
        // 1. Fetch listing
        const raw = await filecoinPublic.readContract({
            address:      MARKETPLACE_ADDRESS,
            abi:          marketplaceAbi,
            functionName: 'listings',
            args:         [BigInt(listingId)],
        }) as unknown as any[]
        const [seller, cid, , name, , , , , , price, , active] = raw
        const listing = { seller, cid, name, price, active }

        if (!listing.active) return res.status(404).json({ error: 'Listing not active' })

        // 2. Purchase if not already authorized
        const authorized = await filecoinPublic.readContract({
            address:      MARKETPLACE_ADDRESS,
            abi:          marketplaceAbi,
            functionName: 'isAuthorized',
            args:         [BigInt(listingId), agentAddress],
        })

        let purchaseTx = ''
        if (!authorized) {
            console.log(`💳 Purchasing listing ${listingId} (${formatEther(listing.price)} FIL)...`)
            purchaseTx = await filecoinWallet.writeContract({
                address:      MARKETPLACE_ADDRESS,
                abi:          marketplaceAbi,
                functionName: 'purchaseDataset',
                args:         [BigInt(listingId)],
                value:        listing.price,
            })
            console.log(`✅ Purchase tx: ${purchaseTx}`)
        }

        // 3. Download from Filecoin via Synapse SDK (server-side with private key)
        console.log(`Downloading CID: ${listing.cid}`)
        const synapse       = await getSynapse()
        const encryptedBytes = await synapse.storage.download({ pieceCid: listing.cid })
        console.log(`✅ Downloaded ${encryptedBytes.length} bytes`)

        // 4. Decrypt via Lit Protocol
        const { ciphertext, dataToEncryptHash, accessControlConditions } = JSON.parse(
            new TextDecoder().decode(encryptedBytes)
        )
        console.log('Decrypting via Lit Protocol...')
        const decryptedBytes = await serverDecrypt(
            ciphertext, dataToEncryptHash, accessControlConditions, AGENT_PRIVATE_KEY
        )
        console.log('✅ Decryption successful')

        // 5. Log
        const x402TxHash = (req as any).x402?.txHash || ''
        const buyer       = (req as any).x402?.from   || 'unknown'
        log.transactions.push({
            listingId, buyer, purchaseTx, x402TxHash,
            timestamp: new Date().toISOString(),
            filPaid:   formatEther(listing.price) + ' FIL',
        })
        writeLog(log)

        // 6. Return decrypted bytes
        res.setHeader('Content-Type',   'application/octet-stream')
        res.setHeader('X-Participant',  log.participantId || '')
        res.setHeader('X-Listing-Id',   String(listingId))
        res.setHeader('X-Dataset-Name', listing.name)
        res.setHeader('X-Seller',       listing.seller)
        res.setHeader('X-Purchase-Tx',  purchaseTx)
        return res.send(Buffer.from(decryptedBytes))

    } catch (err: any) {
        console.error('Error:', err)
        return res.status(500).json({ error: err.message })
    }
})

// ─────────────────────────────────────────────
// GET /listings
// ─────────────────────────────────────────────
app.get('/listings', async (_req, res) => {
    const log = readLog()
    try {
        const activeIds = await filecoinPublic.readContract({
            address:      MARKETPLACE_ADDRESS,
            abi:          marketplaceAbi,
            functionName: 'getActiveListings',
        }) as bigint[]

        const listings = await Promise.all(activeIds.map(async (id) => {
            const raw = await filecoinPublic.readContract({
                address:      MARKETPLACE_ADDRESS,
                abi:          marketplaceAbi,
                functionName: 'listings',
                args:         [id],
            }) as unknown as any[]
            const [seller, cid, previewCid, name, description, category, fileFormat, rowCount, fileSizeBytes, price, sold, active, listingType] = raw
            const filUsdRate = await getFilPriceInUsd().catch(() => 0)
            const usdVal = (parseFloat(formatEther(price)) * filUsdRate).toFixed(6)

            return {
                id:               Number(id),
                name,
                description,
                category,
                fileFormat,
                rowCount:         Number(rowCount),
                fileSizeBytes:    Number(fileSizeBytes),
                price:            formatEther(price) + ' FIL',
                listingType:      listingType === 0 ? 'SINGLE' : 'CONTINUOUS',
                seller,
                purchaseEndpoint: `/dataset/${Number(id)}`,
                paymentProtocol:  'x402',
                paymentNetwork:   'base-sepolia',
                paymentToken:     'USDC',
                paymentPrice:     `$${usdVal}`,
            }
        }))

        return res.json({
            agent: {
                participantId:   log.participantId,
                address:         agentAddress,
                registrationTxn: log.registrationTxn,
                identity:        'ERC-8004 on Base Mainnet (via Synthesis)',
            },
            marketplace:  MARKETPLACE_ADDRESS,
            chain:        'filecoin-calibration',
            totalActive:  listings.length,
            instructions: 'GET /dataset/:id requires x402 USDC payment on Base Sepolia',
            listings,
        })
    } catch (err: any) {
        return res.status(500).json({ error: err.message })
    }
})

// ─────────────────────────────────────────────
// GET /health
// ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
    const log = readLog()
    res.json({
        status:          'ok',
        participantId:   log.participantId,
        address:         agentAddress,
        registeredAt:    log.registeredAt,
        registrationTxn: log.registrationTxn,
        transactions:    log.transactions.length,
        networks: {
            identity:    'base-mainnet (ERC-8004 via Synthesis)',
            payments:    'base-sepolia (x402 USDC)',
            marketplace: 'filecoin-calibration (existing contract)',
            storage:     'filecoin-calibration (Synapse)',
            encryption:  'lit-protocol-v8 naga',
        },
        timestamp: new Date().toISOString(),
    })
})

// ─────────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────────
startup()
app.listen(PORT, () => {
    console.log(`\n🚀 DataForge Platform Agent on http://localhost:${PORT}`)
    console.log(`📡 GET /listings      — discover datasets`)
    console.log(`💰 GET /dataset/:id   — x402 payment required`)
    console.log(`❤️  GET /health        — status\n`)
})