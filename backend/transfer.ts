/**
 * transfer.ts
 * Transfers your ERC-8004 agent NFT from Synthesis custody to your own wallet.
 * Run this ONCE before submitting your project.
 *
 * Run: npx tsx transfer.ts
 */

import * as fs   from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env') })

const SYNTHESIS_API = 'https://synthesis.devfolio.co'
const AGENT_LOG_FILE    = join(__dirname, 'agent_log.json')
const TRANSFER_LOG_FILE = join(__dirname, 'transfer_log.json')

interface TransferLog {
    status:       string | null
    txHash:       string | null
    ownerAddress: string | null
    custodyType:  string | null
    completedAt:  string | null
    basescanUrl:  string | null
}

function readAgentLog() {
    if (fs.existsSync(AGENT_LOG_FILE)) return JSON.parse(fs.readFileSync(AGENT_LOG_FILE, 'utf-8'))
    throw new Error('agent_log.json not found. Run register.ts first.')
}

function readTransferLog(): TransferLog {
    if (fs.existsSync(TRANSFER_LOG_FILE)) return JSON.parse(fs.readFileSync(TRANSFER_LOG_FILE, 'utf-8'))
    return { status: null, txHash: null, ownerAddress: null, custodyType: null, completedAt: null, basescanUrl: null }
}

function writeTransferLog(log: TransferLog) {
    fs.writeFileSync(TRANSFER_LOG_FILE, JSON.stringify(log, null, 2))
}

async function run() {
    console.log('\n═══════════════════════════════════════════')
    console.log('  DataForge Agent — Self-Custody Transfer')
    console.log('═══════════════════════════════════════════\n')

    const agentLog = readAgentLog()
    const transferLog = readTransferLog()

    // Check already registered
    if (!agentLog.synthesisApiKey) {
        console.error('❌ No API key found. Run register.ts first.')
        process.exit(1)
    }

    // Check already transferred
    if (transferLog.txHash) {
        console.log('✅ Already self-custody!')
        console.log(`   Owner address: ${transferLog.ownerAddress}`)
        console.log(`   Transfer tx:   ${transferLog.txHash}`)
        console.log(`   Completed at:  ${transferLog.completedAt}`)
        return
    }

    const apiKey          = agentLog.synthesisApiKey
    const targetAddress   = process.env.AGENT_PRIVATE_KEY
        ? (await import('viem/accounts')).privateKeyToAccount(process.env.AGENT_PRIVATE_KEY as `0x${string}`).address
        : process.env.AGENT_ADDRESS

    if (!targetAddress) {
        console.error('❌ Could not determine agent wallet address. Set AGENT_PRIVATE_KEY in .env')
        process.exit(1)
    }

    console.log(`🔑 API Key:         ${apiKey.slice(0, 12)}...`)
    console.log(`📬 Target Address:  ${targetAddress}`)
    console.log(`👤 Participant ID:  ${agentLog.participantId}\n`)

    // ─── STEP 1: Initiate transfer ────────────────
    console.log('📋 Step 1: Initiating transfer...')

    const initRes = await fetch(`${SYNTHESIS_API}/participants/me/transfer/init`, {
        method:  'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type':  'application/json',
        },
        body: JSON.stringify({ targetOwnerAddress: targetAddress }),
    })

    if (!initRes.ok) {
        const err = await initRes.text()
        // Handle already self-custody
        if (initRes.status === 409) {
            console.log('✅ Already self-custody — no transfer needed.')
            transferLog.status      = 'already_self_custody'
            transferLog.completedAt = new Date().toISOString()
            transferLog.ownerAddress = targetAddress as string
            writeTransferLog(transferLog)
            return
        }
        throw new Error(`Transfer init failed: ${initRes.status} — ${err}`)
    }

    const initData = await initRes.json()
    console.log(`✅ Transfer initiated!`)
    console.log(`   Transfer Token: ${initData.transferToken}`)
    console.log(`   Agent ID:       ${initData.agentId}`)
    console.log(`   Target:         ${initData.targetOwnerAddress}`)
    console.log(`   Expires in:     ${initData.expiresInSeconds}s\n`)

    // Verify address matches
    if (initData.targetOwnerAddress.toLowerCase() !== targetAddress.toLowerCase()) {
        console.error('❌ Address mismatch! Aborting for safety.')
        process.exit(1)
    }

    // ─── STEP 2: Confirm transfer ─────────────────
    console.log('🔗 Step 2: Confirming transfer (ERC-8004 NFT → your wallet)...')

    const confirmRes = await fetch(`${SYNTHESIS_API}/participants/me/transfer/confirm`, {
        method:  'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type':  'application/json',
        },
        body: JSON.stringify({
            transferToken:      initData.transferToken,
            targetOwnerAddress: targetAddress,
        }),
    })

    if (!confirmRes.ok) {
        const err = await confirmRes.text()
        throw new Error(`Transfer confirm failed: ${confirmRes.status} — ${err}`)
    }

    const confirmData = await confirmRes.json()

    console.log(`\n✅ Transfer complete!`)
    console.log(`   Status:   ${confirmData.status}`)
    console.log(`   Tx Hash:  ${confirmData.txHash}`)
    console.log(`   Owner:    ${confirmData.ownerAddress}`)
    console.log(`   Custody:  ${confirmData.custodyType}`)
    console.log(`\n🔍 View on Basescan: https://basescan.org/tx/${confirmData.txHash}\n`)

    // Save to transfer_log.json
    transferLog.status       = confirmData.status
    transferLog.txHash       = confirmData.txHash
    transferLog.ownerAddress = confirmData.ownerAddress
    transferLog.custodyType  = confirmData.custodyType
    transferLog.completedAt  = confirmData.selfCustodyVerifiedAt || new Date().toISOString()
    transferLog.basescanUrl  = `https://basescan.org/tx/${confirmData.txHash}`
    writeTransferLog(transferLog)

    console.log('✅ Saved to transfer_log.json')
    console.log('\nYour ERC-8004 NFT is now fully in your wallet.')
    console.log('You can now publish your project submission.\n')
}

run().catch(err => {
    console.error('❌ Transfer failed:', err.message)
    process.exit(1)
})