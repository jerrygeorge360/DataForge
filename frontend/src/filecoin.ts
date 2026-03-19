import { Synapse } from '@filoz/synapse-sdk'
import { calibration } from '@filoz/synapse-sdk'
import { custom } from 'viem'

let synapseCache = new Map<string, Synapse>()

/**
 * Get a Synapse instance for a specific address.
 * Uses window.ethereum as the transport.
 */
export async function getSynapse(address: string) {
  const lowerAddress = address.toLowerCase()
  if (!synapseCache.has(lowerAddress)) {
    const synapse = Synapse.create({
      transport: custom((window as any).ethereum),
      chain: calibration,
      account: lowerAddress as `0x${string}`,
      source: 'dataforge'
    })
    synapseCache.set(lowerAddress, synapse)
  }
  return synapseCache.get(lowerAddress)!
}

/**
 * Check if the user's wallet is set up for storage.
 * New API: Uses storage.getStorageInfo().allowances.
 */
export async function isStorageSetup(address: string): Promise<boolean> {
  try {
    const synapse = await getSynapse(address)
    const info = await synapse.storage.getStorageInfo()
    return info.allowances?.isApproved ?? false
  } catch (err) {
    console.error('Error checking storage setup:', err)
    return false
  }
}

/**
 * Perform storage setup (deposit + approval) in one transaction.
 * New API: Uses storage.prepare().
 */
export async function setupStorage(address: string, dataSize: bigint = 1024n * 1024n): Promise<string | null> {
  const synapse = await getSynapse(address)

  console.log('Preparing storage setup for size:', dataSize.toString())
  const prep = await synapse.storage.prepare({ dataSize })

  if (prep.transaction) {
    console.log('Executing setup transaction...')
    const { hash } = await prep.transaction.execute()
    console.log('✅ Setup transaction confirmed:', hash)
    return hash
  }

  console.log('Storage already prepared, no transaction needed.')
  return null
}

/**
 * Upload a dataset to Filecoin.
 * New API: Uses storage.upload().
 */
export async function uploadDataset(
  address: string,
  data: Uint8Array
): Promise<string> {
  const synapse = await getSynapse(address)

  console.log('Uploading to Filecoin via Synapse Storage (single copy)...')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120000) // 2-minute timeout

  try {
    const result = await synapse.storage.upload(data, {
      count: 1, // Minimize transactions and complexity
      signal: controller.signal,
      callbacks: {
        onProgress: (bytes) => {
          console.log(`Upload Progress: ${Math.round(bytes / 1024)} KB`)
        },
        onStored: (providerId, _pieceCid) => {
          console.log(`✅ Data stored on provider ${providerId}.`)
        },
        onPiecesAdded: (txHash, providerId) => {
          console.log(`⛓️ Pieces added to on-chain record. Tx: ${txHash}, Provider: ${providerId}`)
        },
        onPiecesConfirmed: (dataSetId, providerId) => {
          console.log(`🎉 Pieces confirmed on-chain! DataSet: ${dataSetId}, Provider: ${providerId}`)
        },
        onCopyFailed: (providerId, _pieceCid, error) => {
          console.warn(`❌ Storage attempt failed on provider ${providerId}:`, error)
        }
      }
    })

    clearTimeout(timeoutId)

    if (result.copies.length === 0) {
      throw new Error('Upload failed: No storage copies were successfully confirmed on-chain.')
    }

    const cid = result.pieceCid.toString()
    const providers = result.copies.map(c => `ID ${c.providerId}`).join(', ')
    console.log(`✅ Upload complete! CID: ${cid} (Stored on providers: ${providers})`)

    return cid
  } catch (err: any) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new Error('Upload timed out after 2 minutes. Please try again with a different provider.')
    }
    throw err
  }
}

/**
 * Download a dataset from Filecoin.
 * New API: Uses storage.download().
 */
export async function downloadDataset(
  address: string,
  cid: string
): Promise<ArrayBuffer> {
  const synapse = await getSynapse(address)

  console.log('Downloading CID:', cid)

  const maxRetries = 2
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      console.log(`Global retry ${attempt}/${maxRetries} for CID: ${cid}... waiting 5s`)
      await new Promise(resolve => setTimeout(resolve, 5000))
    }

    // Strategy 1: CDN (Fastest gateway)
    try {
      console.log('Trying Strategy 1: CDN Gateway...')
      const bytes = await synapse.storage.download({ pieceCid: cid, withCDN: true })
      console.log('✅ Download successful via CDN')
      return bytes.buffer as ArrayBuffer
    } catch (err: any) {
      console.warn('CDN download failed:', err.message)
    }

    // Strategy 2: Direct Chain Discovery (Bypass CDN gateway)
    try {
      console.log('Trying Strategy 2: Direct Chain Discovery...')
      const bytes = await synapse.storage.download({ pieceCid: cid, withCDN: false })
      console.log('✅ Download successful via Chain Discovery')
      return bytes.buffer as ArrayBuffer
    } catch (err: any) {
      console.warn('Chain Discovery failed:', err.message)
    }

    // Strategy 3: Brute-force approved providers (Bypass discovery indexers entirely)
    try {
      console.log('Trying Strategy 3: Provider Brute Force...')
      const info = await synapse.storage.getStorageInfo()
      for (const provider of info.providers) {
        try {
          console.log(`Checking provider ${provider.id} (${provider.serviceProvider})...`)
          const bytes = await synapse.storage.download({
            pieceCid: cid,
            providerAddress: provider.serviceProvider as `0x${string}`
          })
          console.log(`✅ Download successful via provider ${provider.id}`)
          return bytes.buffer as ArrayBuffer
        } catch (pErr) {
          // Continue to next provider
        }
      }
    } catch (infoErr: any) {
      console.warn('Failed to fetch provider list for brute force:', infoErr.message)
    }
  }

  throw new Error(`All retrieval attempts failed for CID ${cid}. The Filecoin indexer may still be processing, or the piece may not have been fully established on the network yet. Please wait 2-5 minutes and try again.`)
}

/**
 * Get balances for display.
 * Uses the payments service which remains similar but viem-based.
 */
export async function getUSDFCBalances(address: string) {
  const synapse = await getSynapse(address)

  // Explicitly request USDFC balances
  const wallet = await synapse.payments.walletBalance({ token: 'USDFC' })
  const synapseAccount = await synapse.payments.balance({ token: 'USDFC' })

  return { wallet, synapse: synapseAccount }
}
