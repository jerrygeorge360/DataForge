import { useState, useCallback } from 'react'
import { isStorageSetup, setupStorage, uploadDataset, downloadDataset, getUSDFCBalances } from '../filecoin'

export function useFilecoin() {
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [loadingSetup, setLoadingSetup] = useState(false)
  const [isSetup, setIsSetup] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkSetup = useCallback(async (account: string) => {
    try {
      const setup = await isStorageSetup(account)
      setIsSetup(setup)
      return setup
    } catch (err: any) {
      console.error('Failed to check setup:', err)
      return false
    }
  }, [])

  const setup = useCallback(async (account: string) => {
    setLoadingSetup(true)
    setError(null)
    try {
      await setupStorage(account)
      setIsSetup(true)
    } catch (err: any) {
      setError(err.message || 'Setup failed')
      throw err
    } finally {
      setLoadingSetup(false)
    }
  }, [])

  const upload = useCallback(async (account: string, data: Uint8Array): Promise<string | null> => {
    setUploading(true)
    setError(null)
    try {
      const cid = await uploadDataset(account, data)
      return cid
    } catch (err: any) {
      setError(err.message || 'Upload failed')
      return null
    } finally {
      setUploading(false)
    }
  }, [])

  const download = useCallback(async (account: string, cid: string): Promise<ArrayBuffer | null> => {
    setDownloading(true)
    setError(null)
    try {
      const data = await downloadDataset(account, cid)
      return data
    } catch (err: any) {
      setError(err.message || 'Download failed')
      return null
    } finally {
      setDownloading(false)
    }
  }, [])

  const fetchBalances = useCallback(async (account: string) => {
    try {
      return await getUSDFCBalances(account)
    } catch (err: any) {
      console.error('Failed to fetch balances:', err)
      return { wallet: 0n, synapse: 0n }
    }
  }, [])

  return {
    upload,
    download,
    setup,
    checkSetup,
    getUSDFCBalances: fetchBalances,
    uploading,
    downloading,
    loadingSetup,
    isSetup,
    error
  }
}
