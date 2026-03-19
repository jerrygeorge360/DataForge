import { ethers } from "hardhat"
import { expect } from "chai"
import { DataMarketplace } from "../typechain-types"
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"

describe("DataMarketplace", () => {
  let marketplace: DataMarketplace
  let owner: SignerWithAddress
  let seller: SignerWithAddress
  let buyer: SignerWithAddress
  let otherBuyer: SignerWithAddress

  const TEST_CID = "baga6ea4seaqao7s73y24kcutaosvacpdjgfe5pw76ooefnyqw4ynr3d2y6x2mpq"
  const TEST_PREVIEW_CID = "baga6ea4seaqpreview"
  const DATASET_NAME = "Weather Dataset Q1 2025"
  const DATASET_DESC = "Hourly temperature readings across 50 cities"
  const PRICE = ethers.parseEther("0.1")

  enum ListingType { SINGLE, CONTINUOUS }

  beforeEach(async () => {
    ;[owner, seller, buyer, otherBuyer] = await ethers.getSigners()
    const DataMarketplace = await ethers.getContractFactory("DataMarketplace")
    marketplace = await DataMarketplace.deploy() // owner deploys
    await marketplace.waitForDeployment()
  })

  describe("Listing datasets", () => {
    it("should allow producer to list a dataset (SINGLE)", async () => {
      const tx = await marketplace.connect(seller).listDataset(
        TEST_CID,
        TEST_PREVIEW_CID,
        DATASET_NAME,
        DATASET_DESC,
        "Finance",
        "CSV",
        1000,
        500000,
        PRICE,
        ListingType.SINGLE
      )

      await expect(tx)
        .to.emit(marketplace, "DatasetListed")
        .withArgs(0, seller.address, TEST_CID, TEST_PREVIEW_CID, DATASET_NAME, "Finance", "CSV", PRICE, ListingType.SINGLE)

      const listing = await marketplace.listings(0)
      expect(listing.seller).to.equal(seller.address)
      expect(listing.category).to.equal("Finance")
      expect(listing.fileFormat).to.equal("CSV")
      expect(listing.rowCount).to.equal(1000)
      expect(listing.fileSizeBytes).to.equal(500000)
    })

    it("should reject listing with empty CID", async () => {
      await expect(
        marketplace.connect(seller).listDataset("", TEST_PREVIEW_CID, DATASET_NAME, DATASET_DESC, "F", "C", 0, 0, PRICE, ListingType.SINGLE)
      ).to.be.revertedWith("CID required")
    })
  })

  describe("Platform Fee", () => {
    it("should default to 250 bps", async () => {
      expect(await marketplace.platformFeeBps()).to.equal(250)
    })

    it("should allow owner to update fee", async () => {
      await expect(marketplace.setPlatformFee(500))
        .to.emit(marketplace, "PlatformFeeUpdated")
        .withArgs(500)
      expect(await marketplace.platformFeeBps()).to.equal(500)
    })

    it("should reject non-owner fee update", async () => {
      await expect(marketplace.connect(buyer).setPlatformFee(500))
        .to.be.revertedWith("Not owner")
    })

    it("should split payment during purchase", async () => {
      await marketplace.connect(seller).listDataset(TEST_CID, TEST_PREVIEW_CID, "N", "D", "C", "F", 0, 0, PRICE, ListingType.SINGLE)

      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address)
      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address)

      await marketplace.connect(buyer).purchaseDataset(0, { value: PRICE })

      const fee = (PRICE * 250n) / 10000n
      const sellerAmount = PRICE - fee

      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address)
      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address)

      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(sellerAmount)
      // Owner balance might be tricky due to gas if owner is the one running this, but here owner is signer[0]
      // and they are not spending gas in the purchase (buyer is).
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(fee)
    })
  })

  describe("Purchasing datasets (SINGLE)", () => {
    beforeEach(async () => {
      await marketplace.connect(seller).listDataset(
        TEST_CID,
        TEST_PREVIEW_CID,
        DATASET_NAME,
        DATASET_DESC,
        "C",
        "F",
        0,
        0,
        PRICE,
        ListingType.SINGLE
      )
    })

    it("should allow buyer to purchase dataset and deactivate listing", async () => {
      await marketplace.connect(buyer).purchaseDataset(0, { value: PRICE })
      const listing = await marketplace.listings(0)
      expect(listing.sold).to.be.true
      expect(listing.active).to.be.false
    })
  })

  describe("Bounties", () => {
    it("should split fee during bounty fulfillment", async () => {
      const reward = ethers.parseEther("1.0")
      await marketplace.connect(buyer).createBounty("Need data", { value: reward })

      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address)
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address)

      const tx = await marketplace.connect(seller).fulfillBounty(0, TEST_CID, TEST_PREVIEW_CID, "Name", "Desc")
      const receipt = await tx.wait()
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice

      const fee = (reward * 250n) / 10000n
      const sellerAmount = reward - fee

      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address)
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address)

      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(sellerAmount - gasUsed)
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(fee)
    })
  })
})
