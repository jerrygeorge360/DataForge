/**
 * register.ts
 * Run this ONCE to register with Synthesis and get your apiKey.
 * Requires human interaction for email OTP verification.
 *
 * Run: npx tsx register.ts
 */

import * as readline from 'readline'
import * as fs       from 'fs'
import * as path     from 'path'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env') })

const SYNTHESIS_API = 'https://synthesis.devfolio.co'
const LOG_FILE      = join(__dirname, 'agent_log.json')

interface AgentLog {
    participantId:   string | null
    teamId:          string | null
    synthesisApiKey: string | null
    registrationTxn: string | null
    registeredAt:    string | null
    transactions:    any[]
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

function prompt(question: string): Promise<string> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close()
            resolve(answer.trim())
        })
    })
}

async function run() {
    const log = readLog()

    // Already registered
    if (log.participantId && log.synthesisApiKey) {
        console.log(`✅ Already registered!`)
        console.log(`   Participant ID: ${log.participantId}`)
        console.log(`   ERC-8004 Tx:    ${log.registrationTxn}`)
        return
    }

    console.log('\n═══════════════════════════════════════════')
    console.log('  DataForge Platform Agent — Registration')
    console.log('═══════════════════════════════════════════\n')

    // Collect human info
    const humanName   = process.env.HUMAN_NAME   || await prompt('Your full name: ')
    const humanEmail  = process.env.HUMAN_EMAIL  || await prompt('Your email: ')
    const humanSocial = process.env.HUMAN_SOCIAL || await prompt('Your Twitter/X handle (optional, press enter to skip): ')
    const humanProblem = process.env.HUMAN_PROBLEM || await prompt('What problem are you solving? ')

    // ─── STEP 1: Init ─────────────────────────────
    console.log('\n📋 Step 1: Initiating registration...')

    const initBody: any = {
        name:         'DataForge Platform Agent',
        description:  'Autonomous broker for Lit-encrypted datasets. External agents discover, pay via x402, and receive decrypted Filecoin-stored data.',
        image:        'https://dataforge.app/logo.png',
        agentHarness: 'claude-code',
        model:        'claude-sonnet-4-6',
        humanInfo: {
            name:              humanName,
            email:             humanEmail,
            socialMediaHandle: humanSocial || undefined,
            background:        (process.env.HUMAN_BACKGROUND || 'builder').toLowerCase(),
            cryptoExperience:  'yes',
            aiAgentExperience: 'yes',
            codingComfort:     8,
            problemToSolve:    humanProblem,
        },
    }

    if (process.env.SYNTHESIS_TEAM_CODE) {
        initBody.teamCode = process.env.SYNTHESIS_TEAM_CODE
    }

    const initRes = await fetch(`${SYNTHESIS_API}/register/init`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(initBody),
    })

    if (!initRes.ok) {
        const err = await initRes.text()
        throw new Error(`Init failed: ${initRes.status} — ${err}`)
    }

    const { pendingId } = await initRes.json()
    console.log(`✅ Registration initiated. Pending ID: ${pendingId}`)

    // ─── STEP 2: Email OTP ────────────────────────
    console.log('\n📧 Step 2: Sending OTP to your email...')

    const sendRes = await fetch(`${SYNTHESIS_API}/register/verify/email/send`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ pendingId }),
    })

    if (!sendRes.ok) {
        const err = await sendRes.text()
        throw new Error(`OTP send failed: ${sendRes.status} — ${err}`)
    }

    console.log(`✅ OTP sent to ${humanEmail}`)
    const otp = await prompt('\nEnter the 6-digit OTP from your email: ')

    const confirmRes = await fetch(`${SYNTHESIS_API}/register/verify/email/confirm`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ pendingId, otp }),
    })

    if (!confirmRes.ok) {
        const err = await confirmRes.text()
        throw new Error(`OTP confirm failed: ${confirmRes.status} — ${err}`)
    }

    console.log('✅ Email verified!')

    // ─── STEP 3: Complete ─────────────────────────
    console.log('\n🔗 Step 3: Completing registration (ERC-8004 on Base Mainnet)...')

    const completeRes = await fetch(`${SYNTHESIS_API}/register/complete`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ pendingId }),
    })

    if (!completeRes.ok) {
        const err = await completeRes.text()
        throw new Error(`Complete failed: ${completeRes.status} — ${err}`)
    }

    const data = await completeRes.json()

    console.log(`\n✅ Registered with Synthesis!`)
    console.log(`   ERC-8004 Tx: ${data.registrationTxn}`)
    console.log(`\n⚠️  SAVE YOUR API KEY — shown only once:`)
    console.log(`   ${data.apiKey}\n`)

    // Save to agent_log.json
    log.participantId    = data.participantId
    log.teamId           = data.teamId
    log.synthesisApiKey  = data.apiKey
    log.registrationTxn  = data.registrationTxn
    log.registeredAt     = new Date().toISOString()
    writeLog(log)

    console.log('✅ Saved to agent_log.json')
    console.log('\nNow run: npm run dev\n')
}

run().catch(err => {
    console.error('❌ Registration failed:', err.message)
    process.exit(1)
})