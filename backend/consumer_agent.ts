/**
 * consumer-agent.ts
 * Demo external consumer agent for DataForge.
 * For demo purposes only — in production, external agents
 * plug into the platform agent independently.
 *
 * Run: ts-node consumer-agent.ts
 */

import dotenv from 'dotenv'

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import * as fs           from 'fs'

import { privateKeyToAccount } from 'viem/accounts'
import { wrapFetchWithPaymentFromConfig } from '@x402/fetch'
import { ExactEvmScheme } from '@x402/evm'
import axios from 'axios'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env') })

const CONSUMER_PRIVATE_KEY = process.env.CONSUMER_PRIVATE_KEY as `0x${string}`
const PLATFORM_AGENT_URL = process.env.PLATFORM_AGENT_URL || 'https://dataforge.prodigal.sbs'
const NEAR_AI_API_KEY = process.env.NEAR_AI_API_KEY as string
const BUDGET_USDC = parseFloat(process.env.BUDGET_USDC || '0.10')
const GOAL = process.env.AGENT_GOAL || 'Find the most valuable financial or AI training dataset'

// Optional: if this consumer agent is registered with ERC-8004,
// set its agentId here to pass the trust gate
const CONSUMER_AGENT_ID = process.env.CONSUMER_AGENT_ID
    ? parseInt(process.env.CONSUMER_AGENT_ID)
    : null

if (!CONSUMER_PRIVATE_KEY || !NEAR_AI_API_KEY) {
    console.error('❌ Missing CONSUMER_PRIVATE_KEY or NEAR_AI_API_KEY in .env')
    process.exit(1)
}

const consumerAccount = privateKeyToAccount(CONSUMER_PRIVATE_KEY)
console.log(`🤖 Consumer Agent: ${consumerAccount.address}`)
if (CONSUMER_AGENT_ID) console.log(`🪪  ERC-8004 Agent ID: ${CONSUMER_AGENT_ID}`)

// x402: automatically pays USDC on Base Sepolia when server returns 402
const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
    schemes: [{
        network: 'eip155:84532',
        client: new ExactEvmScheme(consumerAccount),
    }],
})

const LOG_FILE = join(__dirname, 'consumer_log.json')

function readLog() {
    if (fs.existsSync(LOG_FILE)) return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'))
    return { runs: [] }
}
function writeLog(log: any) {
    fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2))
}

// ─────────────────────────────────────────────
// STEP 1: Discover listings
// ─────────────────────────────────────────────
async function discoverListings() {
    console.log(`\n🔍 Discovering datasets at ${PLATFORM_AGENT_URL}/listings...`)
    const res = await fetch(`${PLATFORM_AGENT_URL}/listings`)
    if (!res.ok) throw new Error(`Discovery failed: ${res.statusText}`)
    const data = await res.json()
    console.log(`📋 Found ${data.listings.length} listing(s). Agent ID: ${data.agent.id}`)
    return data
}

// ─────────────────────────────────────────────
// STEP 2: Ask Claude which dataset to buy
// ─────────────────────────────────────────────
async function decideWithLLM(listings: any[]) {
    if (!listings.length) return null
    console.log('\n🧠 NEAR AI evaluating listings...')

    const prompt = `You are an autonomous AI agent with a budget of $${BUDGET_USDC} USDC.
Goal: ${GOAL}

Available datasets:
${JSON.stringify(listings, null, 2)}

Pick ONE dataset to purchase, or null if none are worth it.
Respond ONLY with valid JSON (no markdown):
{
  "reasoning": "step-by-step evaluation",
  "decision": { "listingId": <number or null>, "name": "<name or null>", "reason": "<one sentence>" }
}`

    try {
        const response = await axios.post(
            "https://cloud-api.near.ai/v1/chat/completions",
            {
                model: "openai/gpt-5.2",
                temperature: 0.2,
                messages: [
                    {
                        role: "system",
                        content: "You are a strict JSON API. Only output valid JSON per the schema.",
                    },
                    { role: "user", content: prompt },
                ],
            },
            {
                headers: {
                    Authorization: `Bearer ${NEAR_AI_API_KEY}`,
                    "Content-Type": "application/json",
                },
                timeout: 90000,
            },
        );

        const content = response.data?.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error("No content returned from AI");
        }

        const parsed = JSON.parse(content);
        console.log('\n💭 Reasoning:', parsed.reasoning);
        console.log('🎯 Decision:', parsed.decision);
        return parsed;
    } catch (error: any) {
        if (error.response) {
            console.error("AI API Error Details:", JSON.stringify(error.response.data, null, 2));
        }
        console.error("Failed to generate decision:", error.message);
        return null;
    }
}

// ─────────────────────────────────────────────
// STEP 3: Pay via x402 and fetch dataset
// ─────────────────────────────────────────────
async function purchaseDataset(listingId: number) {
    console.log(`\n💳 Paying for dataset ${listingId} via x402...`)

    const headers: Record<string, string> = {}
    if (CONSUMER_AGENT_ID) {
        headers['X-Buyer-Agent-Id'] = String(CONSUMER_AGENT_ID)
        console.log(`   Including ERC-8004 Agent ID ${CONSUMER_AGENT_ID} for trust gate`)
    }

    const res = await fetchWithPayment(
        `${PLATFORM_AGENT_URL}/dataset/${listingId}`,
        { headers }
    )

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Purchase failed: ${res.status} — ${err}`)
    }

    const buffer = await res.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // Extract x402 settlement tx from response headers
    let x402TxHash = ''
    const paymentResponse = res.headers.get('PAYMENT-RESPONSE') || ''
    if (paymentResponse) {
        try {
            x402TxHash = JSON.parse(Buffer.from(paymentResponse, 'base64').toString()).txHash || ''
        } catch { /* non-critical */ }
    }

    console.log(`✅ Payment settled. Tx: ${x402TxHash}`)
    console.log(`📦 Received ${bytes.length} decrypted bytes`)
    console.log(`🏷️  Dataset: ${res.headers.get('X-Dataset-Name')}`)

    return {
        bytes, x402TxHash,
        name: res.headers.get('X-Dataset-Name') || '',
        seller: res.headers.get('X-Seller') || '',
    }
}

// ─────────────────────────────────────────────
// STEP 4: Claude analyses the received data
// ─────────────────────────────────────────────
async function analyseData(bytes: Uint8Array, name: string): Promise<string> {
    console.log('\n📊 Analysing data with NEAR AI...')
    let contentBytes = ''
    try {
        contentBytes = new TextDecoder().decode(bytes)
        if (contentBytes.length > 8000) contentBytes = contentBytes.slice(0, 8000) + '\n...(truncated)'
    } catch {
        return 'Binary data — cannot parse as text.'
    }

    const prompt = `I purchased the dataset "${name}". Here is its content:\n\n${contentBytes}\n\nBriefly (3-5 sentences): what does it contain, quality assessment, and how I can use it.`;

    try {
        const response = await axios.post(
            "https://cloud-api.near.ai/v1/chat/completions",
            {
                model: "openai/gpt-5.2",
                temperature: 0.2,
                messages: [
                    {
                        role: "system",
                        content: "You are a data analysis assistant. Provide a brief and clear response.",
                    },
                    { role: "user", content: prompt },
                ],
            },
            {
                headers: {
                    Authorization: `Bearer ${NEAR_AI_API_KEY}`,
                    "Content-Type": "application/json",
                },
                timeout: 90000,
            },
        );

        const content = response.data?.choices?.[0]?.message?.content;
        if (!content) throw new Error("No content returned from AI");

        console.log('\n📈 Analysis:', content);
        return content;
    } catch (error: any) {
        if (error.response) {
            console.error("AI API Error Details:", JSON.stringify(error.response.data, null, 2));
        }
        const msg = "Failed to analyse data: " + error.message;
        console.error(msg);
        return msg;
    }
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function run() {
    console.log('═══════════════════════════════════════════')
    console.log('  DataForge Consumer Agent (Demo)')
    console.log(`  Goal:   ${GOAL}`)
    console.log(`  Budget: $${BUDGET_USDC} USDC`)
    console.log('═══════════════════════════════════════════')

    const log = readLog()
    const runEntry: any = {
        timestamp: new Date().toISOString(),
        goal: GOAL, listingsFound: 0,
        reasoning: '', decision: null,
        purchased: false, x402TxHash: '',
        dataReceived: 0, analysis: '',
    }

    try {
        const discovery = await discoverListings()
        runEntry.listingsFound = discovery.listings.length

        const result = await decideWithLLM(discovery.listings)
        runEntry.reasoning = result?.reasoning || ''

        if (!result?.decision?.listingId) {
            console.log('\n🤷 Agent decided not to purchase anything this run.')
        } else {
            runEntry.decision = result.decision

            const { bytes, x402TxHash, name } = await purchaseDataset(result.decision.listingId)
            runEntry.purchased = true
            runEntry.x402TxHash = x402TxHash
            runEntry.dataReceived = bytes.length

            const filename = `dataset_${result.decision.listingId}_${Date.now()}.bin`
            fs.writeFileSync(join(__dirname, filename), Buffer.from(bytes))
            console.log(`💾 Saved: ${filename}`)

            runEntry.analysis = await analyseData(bytes, name)
        }
    } catch (err: any) {
        console.error('\n❌ Run failed:', err.message)
        runEntry.analysis = `Error: ${err.message}`
    }

    log.runs.push(runEntry)
    writeLog(log)
    console.log('\n✅ Run complete. Log saved to consumer_log.json')
}

run()