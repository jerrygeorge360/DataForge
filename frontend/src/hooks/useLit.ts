import { createLitClient } from '@lit-protocol/lit-client'
import { createAuthManager, storagePlugins } from '@lit-protocol/auth'
import { nagaDev } from '@lit-protocol/networks'
import { createWalletClient, custom ,getAddress} from 'viem'
import { filecoinCalibration } from 'viem/chains'
import { VITE_CONTRACT_ADDRESS } from '../hooks/useMarketplace'

const authManager = createAuthManager({
    storage: storagePlugins.localStorage({
        appName: 'DataForge',
        networkName: 'naga-dev',
    }),
})

let litClientInstance: any = null
async function getLitClient() {
    if (!litClientInstance) {
        litClientInstance = await createLitClient({
            network: nagaDev
        })
    }
    return litClientInstance
}

export function useLit() {

    async function encryptAndUpload(
        file: File,
        listingId: number,
        uploadToSynapse: (data: Uint8Array) => Promise<string | null>
    ) {
        const client = await getLitClient()

        const accs = [
            {
                conditionType: 'evmContract' as const,
                contractAddress: VITE_CONTRACT_ADDRESS,
                functionName: 'isAuthorized',
                functionParams: [listingId.toString(), ':userAddress'],
                functionAbi: {
                    name: 'isAuthorized',
                    inputs: [
                        { name: 'listingId', type: 'uint256' },
                        { name: 'user',      type: 'address' }
                    ],
                    outputs: [{ name: '', type: 'bool' }],
                    stateMutability: 'view',
                    type: 'function',
                },
                chain: 'filecoinCalibrationTestnet',
                returnValueTest: {
                    key:        '',
                    comparator: '=',
                    value:      'true',
                },
            },
        ]
        // Convert File to Uint8Array first
        const arrayBuffer = await file.arrayBuffer()
        const fileBytes = new Uint8Array(arrayBuffer)

        const { ciphertext, dataToEncryptHash } = await client.encrypt({
            dataToEncrypt: fileBytes,   // ← now passes actual bytes
            unifiedAccessControlConditions: accs,
            chain: 'filecoinCalibrationTestnet'
        })

        const payload = JSON.stringify({
            ciphertext,
            dataToEncryptHash,
            accessControlConditions: accs
        })
        const encoder = new TextEncoder()
        const cid = await uploadToSynapse(encoder.encode(payload))

        if (!cid) throw new Error('UPLOAD_TO_SYNAPSE_FAILED')
        return cid
    }

    async function downloadAndDecrypt(
        cid: string,
        account: string,  // ← added: the connected wallet address
        downloadFromSynapse: (cid: string) => Promise<Uint8Array | ArrayBuffer | null>
    ) {
        const client = await getLitClient()
        const encryptedData = await downloadFromSynapse(cid)
        if (!encryptedData) throw new Error('DOWNLOAD_FROM_SYNAPSE_FAILED')

        const bytes = encryptedData instanceof Uint8Array ? encryptedData : new Uint8Array(encryptedData)
        const decoder = new TextDecoder()
        const { ciphertext, dataToEncryptHash, accessControlConditions } = JSON.parse(decoder.decode(bytes))

        const walletClient = createWalletClient({
            account: getAddress(account),  
            chain: filecoinCalibration,
            transport: custom((window as any).ethereum),
        })

        const authContext = await authManager.createEoaAuthContext({
            config: { account: walletClient as any },
            authConfig: {
                domain: window.location.hostname,
                statement: 'Decrypt DataForge dataset',
                expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
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

    return { encryptAndUpload, downloadAndDecrypt }
}