import { Synapse, calibration } from '@filoz/synapse-sdk'
import { custom, createWalletClient, http, getAddress } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { filecoinCalibration } from 'viem/chains'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env') })

const FILECOIN_RPC  = 'https://api.calibration.node.glif.io/rpc/v1'
const agentAccount  = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY as `0x${string}`)
const agentAddress  = getAddress(agentAccount.address)

const filecoinWallet = createWalletClient({
    account:   agentAccount,
    chain:     filecoinCalibration,
    transport: http(FILECOIN_RPC),
})

const synapse = Synapse.create({
    transport: custom({
        async request({ method, params }: { method: string; params: any[] }) {
            // Sign locally
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
            // Send transactions via wallet client so they get properly signed + sent
            if (method === 'eth_sendTransaction') {
                const [tx] = params
                const hash = await filecoinWallet.sendTransaction({
                    to:    tx.to,
                    data:  tx.data,
                    value: tx.value ? BigInt(tx.value) : undefined,
                })
                return hash
            }
            // Everything else to RPC
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

console.log('Setting up Synapse storage...')
const prep = await synapse.storage.prepare({ dataSize: BigInt(1024 * 1024) })
if (prep.transaction) {
    const { hash } = await prep.transaction.execute()
    console.log('✅ Storage setup done:', hash)
} else {
    console.log('✅ Already set up')
}