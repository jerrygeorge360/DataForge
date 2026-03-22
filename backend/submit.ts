/**
 * submit.ts
 * Submits DataForge to the Synthesis hackathon.
 * Run AFTER register.ts and transfer.ts are complete.
 *
 * Run: npx tsx submit.ts
 */

import * as fs   from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env') })

const SYNTHESIS_API     = 'https://synthesis.devfolio.co'
const AGENT_LOG_FILE    = join(__dirname, 'agent_log.json')
const SUBMIT_LOG_FILE   = join(__dirname, 'submit_log.json')

// ─────────────────────────────────────────────
// CONFIG — fill these in before running
// ─────────────────────────────────────────────
const CONFIG = {
    repoURL:      'https://github.com/YOUR_USERNAME/dataforge',    // ← your public GitHub repo
    deployedURL:  'http://YOUR_VM_IP:80',                          // ← your deployed frontend URL
    videoURL:     '',                                               // ← YouTube/Loom demo video URL
    moltbookURL:  '',                                               // ← your Moltbook post URL (optional)
    coverImageURL: '',                                              // ← cover image URL (optional)
}

// ─────────────────────────────────────────────
// CONVERSATION LOG
// Summarise the human-agent collaboration journey
// ─────────────────────────────────────────────
const CONVERSATION_LOG = `
# DataForge — Human-Agent Collaboration Log

## Project Overview
DataForge is a dual-layer decentralized data marketplace built collaboratively between a human developer and Claude (claude-sonnet-4-6) over multiple sessions.

## Key Milestones

### Session 1 — Encryption Pipeline
- Debugged Lit Protocol v8 ACC validation errors (missing conditionType, returnValueTest.key)
- Fixed Synapse SDK upload/download API breaking changes between versions
- Confirmed end-to-end encrypt → upload → download → decrypt working on Filecoin Calibration

### Session 2 — Platform Agent Architecture
- Designed the dual-layer architecture: human marketplace + passive agent layer
- Built ERC-8004 registration flow via Synthesis API
- Integrated x402 payment middleware with dynamic CoinGecko FIL→USDC pricing
- Solved server-side Lit decryption (no MetaMask — private key signing via localStorageNode)

### Session 3 — Synapse Transport Fix
- Debugged eth_signTypedData_v4 failure on public RPC endpoints
- Built custom transport interceptor to sign locally and forward other calls to RPC
- Fixed Synapse download API (pieceCid must be wrapped in options object)

### Session 4 — Consumer Agent + Testing
- Built NEAR AI powered consumer agent for end-to-end demo
- Confirmed full autonomous flow: discover → reason → pay x402 → purchase FIL → decrypt → receive bytes
- Completed ERC-8004 self-custody transfer to operator wallet

### Key Pivots
- Moved from browser-only to server-side Lit decryption to support autonomous agents
- Switched from static x402 pricing to dynamic CoinGecko oracle pricing
- Chose passive infrastructure model over active LLM-powered platform agent

## Technical Challenges Solved
1. Lit Protocol v8 ACC shape validation — evmContract conditionType requires explicit key field
2. Synapse SDK server-side signing — custom transport intercepting eth_signTypedData_v4
3. ERC-8004 registration — Synthesis API 3-step flow with email OTP verification
4. Cross-chain architecture — ERC-8004 on Base Mainnet, x402 on Base Sepolia, marketplace on Filecoin Calibration
`.trim()

// ─────────────────────────────────────────────
// SUBMISSION DATA
// ─────────────────────────────────────────────
const PROJECT_DATA = {
    name: 'DataForge',

    description: `DataForge is a dual-layer decentralized data marketplace where every dataset is backed by a verifiable Filecoin CID and cryptographically protected by Lit Protocol v8 (Naga).

**Human Layer**: A React marketplace where sellers upload Lit-encrypted datasets to Filecoin via Synapse SDK. Buyers purchase access using FIL; Lit Protocol enforces decryption access onchain via EVM contract conditions.

**Agent Layer**: A passive ERC-8004 registered platform agent that external AI agents can discover, pay via x402 USDC microtransactions (dynamically priced against FIL via CoinGecko oracle), and receive decrypted datasets — fully autonomously.

DataForge is the first encrypted data marketplace compatible with both human buyers and autonomous AI agents using the same underlying infrastructure. Any ERC-8004 and x402 compatible agent can plug in with zero custom integration.`,

    problemStatement: `AI agents increasingly need access to external datasets to complete tasks, but existing data marketplaces are built exclusively for human users — requiring browser wallets, manual payment flows, and UI interactions that autonomous agents cannot perform.

Meanwhile, data sellers have no way to monetize their datasets to the growing agent economy without building custom APIs and integrations for each agent framework.

DataForge solves both sides: sellers list once and earn from both human and agent buyers automatically, while any standards-compliant agent can discover, pay for, and consume encrypted data without human intervention.`,

    submissionMetadata: {
        agentFramework:      'other',
        agentFrameworkOther: 'Custom Node.js platform agent with Express + x402 + Lit Protocol + Synapse SDK',
        agentHarness:        'claude-code',
        model:               'claude-sonnet-4-6',
        skills: [
            'web-search',
            'frontend-design',
            'docx',
        ],
        tools: [
            'Lit Protocol v8 (Naga)',
            '@filoz/synapse-sdk',
            '@x402/express',
            '@x402/fetch',
            'viem',
            'Hardhat',
            'Solidity',
            'React',
            'Vite',
            'TypeScript',
            'Express',
            'Docker',
            'Nginx',
            'NEAR AI',
            'CoinGecko API',
        ],
        helpfulResources: [
            'https://developer.litprotocol.com/sdk/introduction',
            'https://litprotocol.mintlify.app/sdk/sdk-reference/auth/functions/createAuthManager',
            'https://github.com/FilOzone/synapse-sdk',
            'https://x402.org/',
            'https://eips.ethereum.org/EIPS/eip-8004',
            'https://synthesis.md/skill.md',
        ],
        helpfulSkills: [
            {
                name:   'web-search',
                reason: 'Critical for verifying Lit Protocol v8 API changes, Synapse SDK download options, and ERC-8004 contract addresses — training data was outdated for all three',
            },
            {
                name:   'frontend-design',
                reason: 'Generated the Bloomberg Terminal-inspired dark UI for the marketplace and agent access page',
            },
        ],
        intention:      'continuing',
        intentionNotes: 'Planning to deploy to mainnet, add dynamic reputation scoring via ERC-8004 reputation registry, and integrate with more agent networks as the ERC-8004 ecosystem grows.',
        moltbookPostURL: CONFIG.moltbookURL || undefined,
    },

    conversationLog: CONVERSATION_LOG,
    repoURL:         CONFIG.repoURL,
    deployedURL:     CONFIG.deployedURL || undefined,
    videoURL:        CONFIG.videoURL    || undefined,
    coverImageURL:   CONFIG.coverImageURL || undefined,
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function readAgentLog() {
    if (!fs.existsSync(AGENT_LOG_FILE)) throw new Error('agent_log.json not found. Run register.ts first.')
    return JSON.parse(fs.readFileSync(AGENT_LOG_FILE, 'utf-8'))
}

function readSubmitLog() {
    if (fs.existsSync(SUBMIT_LOG_FILE)) return JSON.parse(fs.readFileSync(SUBMIT_LOG_FILE, 'utf-8'))
    return { projectUUID: null, status: null, trackUUIDs: [] }
}

function writeSubmitLog(log: any) {
    fs.writeFileSync(SUBMIT_LOG_FILE, JSON.stringify(log, null, 2))
}

function authHeader(apiKey: string) {
    return { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
}

// ─────────────────────────────────────────────
// STEP 1: Browse tracks and find matching UUIDs
// ─────────────────────────────────────────────
async function getTrackUUIDs(apiKey: string): Promise<string[]> {
    console.log('\n📋 Fetching available tracks...')
    const res = await fetch(`${SYNTHESIS_API}/catalog?page=1&limit=50`)
    const data = await res.json()

    const targetKeywords = ['filecoin', 'lit', 'erc-8004', '8004', 'agent', 'data', 'storage', 'synthesis']
    const matched: { uuid: string; name: string; company: string }[] = []

    for (const track of data.items || []) {
        const trackText = `${track.name} ${track.company} ${track.description}`.toLowerCase()
        const isMatch = targetKeywords.some(kw => trackText.includes(kw))
        if (isMatch) {
            matched.push({ uuid: track.uuid, name: track.name, company: track.company })
            console.log(`   ✅ Matched: "${track.name}" by ${track.company} (${track.uuid})`)
        }
    }

    if (matched.length === 0) {
        console.log('   No keyword matches. Listing all tracks:')
        for (const track of data.items || []) {
            console.log(`   - "${track.name}" by ${track.company}: ${track.uuid}`)
        }
        throw new Error('No matching tracks found. Update targetKeywords or manually set trackUUIDs.')
    }

    return matched.map(t => t.uuid).slice(0, 10) // max 10
}

// ─────────────────────────────────────────────
// STEP 2: Create draft project
// ─────────────────────────────────────────────
async function createProject(apiKey: string, teamUUID: string, trackUUIDs: string[]): Promise<string> {
    console.log('\n📝 Creating draft project...')

    const body = {
        teamUUID,
        trackUUIDs,
        ...PROJECT_DATA,
    }

    const res = await fetch(`${SYNTHESIS_API}/projects`, {
        method:  'POST',
        headers: authHeader(apiKey),
        body:    JSON.stringify(body),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Create project failed: ${res.status} — ${err}`)
    }

    const data = await res.json()
    console.log(`✅ Draft created! Project UUID: ${data.uuid}`)
    console.log(`   Name:   ${data.name}`)
    console.log(`   Status: ${data.status}`)
    return data.uuid
}

// ─────────────────────────────────────────────
// STEP 3: Publish project
// ─────────────────────────────────────────────
async function publishProject(apiKey: string, projectUUID: string) {
    console.log('\n🚀 Publishing project...')

    const res = await fetch(`${SYNTHESIS_API}/projects/${projectUUID}/publish`, {
        method:  'POST',
        headers: authHeader(apiKey),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Publish failed: ${res.status} — ${err}`)
    }

    const data = await res.json()
    console.log(`✅ Published!`)
    console.log(`   Status: ${data.status}`)
    console.log(`   Slug:   ${data.slug}`)
    console.log(`   URL:    https://synthesis.devfolio.co/projects/${data.slug}`)
    return data
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function run() {
    console.log('\n═══════════════════════════════════════════')
    console.log('  DataForge — Synthesis Submission')
    console.log('═══════════════════════════════════════════')

    // Validate config
    if (CONFIG.repoURL.includes('YOUR_USERNAME')) {
        console.error('❌ Update CONFIG.repoURL with your actual GitHub repo URL')
        process.exit(1)
    }

    const agentLog  = readAgentLog()
    const submitLog = readSubmitLog()

    if (!agentLog.synthesisApiKey) {
        console.error('❌ No API key. Run register.ts first.')
        process.exit(1)
    }

    const apiKey   = agentLog.synthesisApiKey
    const teamUUID = agentLog.teamId

    console.log(`\n🔑 API Key:   ${apiKey.slice(0, 12)}...`)
    console.log(`👥 Team UUID: ${teamUUID}`)

    // Already submitted
    if (submitLog.projectUUID && submitLog.status === 'publish') {
        console.log(`\n✅ Already published! Project UUID: ${submitLog.projectUUID}`)
        return
    }

    try {
        // Get track UUIDs
        const trackUUIDs = submitLog.trackUUIDs?.length
            ? submitLog.trackUUIDs
            : await getTrackUUIDs(apiKey)

        // Create or reuse draft
        let projectUUID = submitLog.projectUUID
        if (!projectUUID) {
            projectUUID = await createProject(apiKey, teamUUID, trackUUIDs)
            writeSubmitLog({ projectUUID, status: 'draft', trackUUIDs })
        } else {
            console.log(`\n♻️  Reusing existing draft: ${projectUUID}`)
        }

        // Ask before publishing
        console.log('\n⚠️  Review your project before publishing:')
        console.log(`   GET ${SYNTHESIS_API}/projects/${projectUUID}`)
        console.log('\n   Press Ctrl+C to cancel, or wait 10 seconds to publish...')
        await new Promise(resolve => setTimeout(resolve, 10000))

        // Publish
        const published = await publishProject(apiKey, projectUUID)
        writeSubmitLog({ projectUUID, status: 'publish', trackUUIDs, slug: published.slug })

        console.log('\n═══════════════════════════════════════════')
        console.log('  ✅ Submission complete!')
        console.log(`  Saved to submit_log.json`)
        console.log('\n  Next steps:')
        console.log('  1. Tweet about your project tagging @synthesis_md')
        console.log('  2. Post on Moltbook: https://www.moltbook.com/skill.md')
        console.log('═══════════════════════════════════════════\n')

    } catch (err: any) {
        console.error('\n❌ Submission failed:', err.message)
        process.exit(1)
    }
}

run()