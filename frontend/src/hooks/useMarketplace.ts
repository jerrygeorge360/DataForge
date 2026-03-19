import { useCallback, useMemo } from 'react'
import { BrowserProvider, Contract, JsonRpcProvider } from 'ethers'

export const MARKETPLACE_ABI = [
  'function listDataset(string calldata cid, string calldata previewCid, string calldata name, string calldata description, string calldata category, string calldata fileFormat, uint256 rowCount, uint256 fileSizeBytes, uint256 price, uint8 listingType) external returns (uint256 listingId)',
  'function purchaseDataset(uint256 listingId) external payable',
  'function cancelListing(uint256 listingId) external',
  'function getCID(uint256 listingId) external view returns (string memory)',
  'function getActiveListings() external view returns (uint256[] memory)',
  'function listings(uint256) external view returns (address seller, string cid, string previewCid, string name, string description, string category, string fileFormat, uint256 rowCount, uint256 fileSizeBytes, uint256 price, bool sold, bool active, uint8 listingType)',
  'function listingCount() external view returns (uint256)',
  'function purchasedBy(uint256) external view returns (address)',
  'function hasPurchased(uint256, address) external view returns (bool)',
  'function createBounty(string calldata description) external payable returns (uint256)',
  'function fulfillBounty(uint256 bountyId, string calldata cid, string calldata previewCid, string calldata name, string calldata description) external',
  'function rateListing(uint256 listingId, bool positive) external',
  'function reputationScore(address) external view returns (uint256)',
  'function getActiveBounties() external view returns (uint256[] memory)',
  'function bounties(uint256) external view returns (address buyer, uint256 reward, string description, bool fulfilled, address fulfiller, bool active)',
  'function bountyCount() external view returns (uint256)',
  'function hasRatedListing(uint256, address) external view returns (bool)',
  'function isAuthorized(uint256 listingId, address user) external view returns (bool)',
  'function cancelBounty(uint256 bountyId) external',
  'function platformFeeBps() external view returns (uint256)',
  'function setPlatformFee(uint256 newFeeBps) external',
  'event DatasetListed(uint256 indexed listingId, address indexed seller, string cid, uint256 price)',
  'event DatasetPurchased(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 price)',
  'event BountyCreated(uint256 indexed bountyId, address indexed buyer, uint256 reward, string description)',
  'event BountyFulfilled(uint256 indexed bountyId, address indexed fulfiller, string cid)'
]

// Get contract address from environment variable
export const VITE_CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS
const CONTRACT_ADDRESS = VITE_CONTRACT_ADDRESS || ''

export function useMarketplace(provider: BrowserProvider | JsonRpcProvider | undefined | null) {
  const contract = useMemo(() => {
    if (!CONTRACT_ADDRESS || !provider) return null
    return new Contract(CONTRACT_ADDRESS, MARKETPLACE_ABI, provider) as any
  }, [provider])

  const listDataset = useCallback(async (
    cid: string,
    previewCid: string,
    name: string,
    description: string,
    category: string,
    fileFormat: string,
    rowCount: number,
    fileSizeBytes: number,
    price: bigint,
    listingType: number
  ): Promise<string> => {
    if (!contract || !provider) throw new Error('Contract or provider not initialized')
    const signer = await provider.getSigner()
    const connectedContract = contract.connect(signer)

    const tx = await connectedContract.listDataset(
      cid,
      previewCid,
      name,
      description,
      category,
      fileFormat,
      rowCount,
      fileSizeBytes,
      price,
      listingType
    )
    await tx.wait()

    return tx.hash
  }, [contract, provider])

  const purchaseDataset = useCallback(async (listingId: bigint, price: bigint): Promise<string> => {
    if (!contract || !provider) throw new Error('Contract or provider not initialized')
    const signer = await provider.getSigner()
    const connectedContract = contract.connect(signer)

    const tx = await connectedContract.purchaseDataset(listingId, { value: price })
    await tx.wait()

    return tx.hash
  }, [contract, provider])

  const cancelListing = useCallback(async (listingId: bigint): Promise<string> => {
    if (!contract || !provider) throw new Error('Contract or provider not initialized')
    const signer = await provider.getSigner()
    const connectedContract = contract.connect(signer)

    const tx = await connectedContract.cancelListing(listingId)
    await tx.wait()

    return tx.hash
  }, [contract, provider])

  const getCID = useCallback(async (listingId: bigint): Promise<string> => {
    if (!contract) throw new Error('Contract not initialized')
    return await contract.getCID(listingId)
  }, [contract])

  const getActiveListings = useCallback(async (): Promise<bigint[]> => {
    if (!contract) return []
    return await contract.getActiveListings()
  }, [contract])

  const getListingDetails = useCallback(async (listingId: bigint) => {
    if (!contract) return null
    const listing = await contract.listings(listingId)

    return {
      seller: listing[0],
      cid: listing[1],
      previewCid: listing[2],
      name: listing[3],
      description: listing[4],
      category: listing[5],
      fileFormat: listing[6],
      rowCount: Number(listing[7]),
      fileSizeBytes: Number(listing[8]),
      price: listing[9],
      sold: listing[10],
      active: listing[11],
      listingType: Number(listing[12])
    }
  }, [contract])

  const getListingCount = useCallback(async (): Promise<bigint> => {
    if (!contract) return 0n
    return await contract.listingCount()
  }, [contract])

  const checkPurchaseState = useCallback(async (listingId: bigint, account: string): Promise<boolean> => {
    if (!contract) return false
    const listing = await contract.listings(listingId)
    const type = Number(listing[12]) // Corrected index for listingType

    if (type === 0) { // SINGLE
      const buyer = await contract.purchasedBy(listingId)
      return buyer.toLowerCase() === account.toLowerCase()
    } else { // CONTINUOUS
      return await contract.hasPurchased(listingId, account)
    }
  }, [contract])

  const getPurchasedListings = useCallback(async (address: string) => {
    if (!contract) return []
    const count = await contract.listingCount()
    const listingIds = Array.from({ length: Number(count) }, (_, i) => BigInt(i))

    // Parallel check for ownership
    const ownershipResults = await Promise.all(
      listingIds.map(async (id) => {
        const isOwner = await checkPurchaseState(id, address)
        return { id, isOwner }
      })
    )

    const ownedIds = ownershipResults.filter(r => r.isOwner).map(r => r.id)

    // Parallel fetch metadata for owned listings
    return await Promise.all(
      ownedIds.map(async (id) => {
        const details = await contract.listings(id)
        return {
          listingId: id,
          seller: details[0],
          cid: details[1],
          previewCid: details[2],
          name: details[3],
          description: details[4],
          category: details[5],
          fileFormat: details[6],
          rowCount: Number(details[7]),
          fileSizeBytes: Number(details[8]),
          price: details[9],
          sold: details[10],
          active: details[11],
          listingType: Number(details[12])
        }
      })
    )
  }, [contract, checkPurchaseState])

  const createBounty = useCallback(async (description: string, reward: bigint): Promise<string> => {
    if (!contract || !provider) throw new Error('Contract or provider not initialized')
    const signer = await provider.getSigner()
    const connectedContract = contract.connect(signer)
    const tx = await connectedContract.createBounty(description, { value: reward })
    await tx.wait()
    return tx.hash
  }, [contract, provider])

  const fulfillBounty = useCallback(async (
    bountyId: bigint,
    cid: string,
    previewCid: string,
    name: string,
    description: string
  ): Promise<string> => {
    if (!contract || !provider) throw new Error('Contract or provider not initialized')
    const signer = await provider.getSigner()
    const connectedContract = contract.connect(signer)
    const tx = await connectedContract.fulfillBounty(bountyId, cid, previewCid, name, description)
    await tx.wait()
    return tx.hash
  }, [contract, provider])

  const rateListing = useCallback(async (listingId: bigint, positive: boolean): Promise<string> => {
    if (!contract || !provider) throw new Error('Contract or provider not initialized')
    const signer = await provider.getSigner()
    const connectedContract = contract.connect(signer)
    const tx = await connectedContract.rateListing(listingId, positive)
    await tx.wait()
    return tx.hash
  }, [contract, provider])

  const getActiveBounties = useCallback(async (): Promise<bigint[]> => {
    if (!contract) return []
    return await contract.getActiveBounties()
  }, [contract])

  const getBountyDetails = useCallback(async (bountyId: bigint) => {
    if (!contract) return null
    const bounty = await contract.bounties(bountyId)
    return {
      buyer: bounty[0],
      reward: bounty[1],
      description: bounty[2],
      fulfilled: bounty[3],
      fulfiller: bounty[4],
      active: bounty[5]
    }
  }, [contract])

  const getReputation = useCallback(async (address: string): Promise<bigint> => {
    if (!contract) return 0n
    return await contract.reputationScore(address)
  }, [contract])

  const getBountyCount = useCallback(async (): Promise<bigint> => {
    if (!contract) return 0n
    return await contract.bountyCount()
  }, [contract])

  const hasRated = useCallback(async (listingId: bigint, account: string): Promise<boolean> => {
    if (!contract) return false
    return await contract.hasRatedListing(listingId, account)
  }, [contract])

  const isAuthorized = useCallback(async (listingId: bigint, user: string): Promise<boolean> => {
    if (!contract) return false
    return await contract.isAuthorized(listingId, user)
  }, [contract])

  const cancelBounty = useCallback(async (bountyId: bigint): Promise<string> => {
    if (!contract || !provider) throw new Error('Contract or provider not initialized')
    const signer = await provider.getSigner()
    const connectedContract = contract.connect(signer)
    const tx = await connectedContract.cancelBounty(bountyId)
    await tx.wait()
    return tx.hash
  }, [contract, provider])

  return {
    listDataset,
    purchaseDataset,
    cancelListing,
    getCID,
    getActiveListings,
    getListingDetails,
    getListingCount,
    checkPurchaseState,
    getPurchasedListings,
    createBounty,
    fulfillBounty,
    rateListing,
    getActiveBounties,
    getBountyDetails,
    getBountyCount,
    getReputation,
    hasRated,
    isAuthorized,
    cancelBounty,
    contract
  }
}
