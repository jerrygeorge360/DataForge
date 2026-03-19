import { ethers } from "hardhat"

async function main() {
  console.log("Deploying DataMarketplace to Filecoin Calibration...")

  const [deployer] = await ethers.getSigners()
  console.log("Deploying with account:", deployer.address)
  
  const balance = await ethers.provider.getBalance(deployer.address)
  console.log("Account balance:", ethers.formatEther(balance), "tFIL")

  const DataMarketplace = await ethers.getContractFactory("DataMarketplace")
  const marketplace = await DataMarketplace.deploy()
  
  await marketplace.waitForDeployment()
  const address = await marketplace.getAddress()

  console.log("✅ DataMarketplace deployed to:", address)
  console.log("Add this to your frontend .env:")
  console.log(`VITE_CONTRACT_ADDRESS=${address}`)
  console.log("\nView on explorer:")
  console.log(`https://calibration.filfox.info/en/address/${address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
