/**
 * lit-server.ts
 * Server-side Lit Protocol v8 decryption for the DataForge platform agent.
 * Uses a private key wallet — no MetaMask, no browser required.
 */

import { createLitClient } from '@lit-protocol/lit-client'
import { createAuthManager, storagePlugins } from '@lit-protocol/auth'
import { nagaDev } from '@lit-protocol/networks'
import { privateKeyToAccount } from 'viem/accounts'

// ─────────────────────────────────────────────
// SINGLETON LIT CLIENT
// ─────────────────────────────────────────────
let litClientInstance: any = null

async function getLitClient() {
    if (!litClientInstance) {
        litClientInstance = await createLitClient({ network: nagaDev })
    }
    return litClientInstance
}

// ─────────────────────────────────────────────
// AUTH MANAGER — Node.js version uses localStorageNode
// not localStorage (which requires a browser)
// ─────────────────────────────────────────────
function getAuthManager() {
    return createAuthManager({
        storage: storagePlugins.localStorageNode({   // ← Node.js specific
            appName: 'DataForge',
            networkName: 'naga-dev',
            storagePath: './lit-auth-storage',        // persisted to disk
        }),
    })
}

// ─────────────────────────────────────────────
// SERVER-SIDE DECRYPT
// Uses a viem Account (from private key) directly —
// no MetaMask popup, signs programmatically.
// ─────────────────────────────────────────────
export async function serverDecrypt(
    ciphertext: string,
    dataToEncryptHash: string,
    accessControlConditions: any[],
    agentPrivateKey: `0x${string}`
): Promise<Uint8Array> {

    const client = await getLitClient()
    const authManager = getAuthManager()

    // privateKeyToAccount gives us a viem Account — 
    // Lit v8 accepts this directly without MetaMask
    const agentAccount = privateKeyToAccount(agentPrivateKey)

    const authContext = await authManager.createEoaAuthContext({
        config: {
            account: agentAccount,  // ← plain viem Account, no WalletClient needed
        },
        authConfig: {
            domain: 'dataforge-agent',
            statement: 'DataForge Platform Agent decrypting dataset',
            expiration: new Date(Date.now() + 1000 * 60 * 60).toISOString(), // 1h
            resources: [
                ['access-control-condition-decryption', '*'],
                ['lit-action-execution', '*'],
            ],
        },
        litClient: client,
    })

    const result = await client.decrypt({
        ciphertext,
        dataToEncryptHash,
        unifiedAccessControlConditions: accessControlConditions,
        authContext,
        chain: 'filecoinCalibrationTestnet',
    })

    return result.decryptedData
}