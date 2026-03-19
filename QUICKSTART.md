# 🚀 Quick Start Guide

## Build & Test Locally

### 1. Compile Contracts
```bash
npm run compile
```

### 2. Run Tests
```bash
npm test
```
All 18 tests should pass ✅

### 3. Deploy to Calibration Testnet

First, create a `.env` file in the root directory:
```bash
PRIVATE_KEY=0x...  # Your deployer wallet private key
CALIBRATION_RPC=https://api.calibration.node.glif.io/rpc/v1
```

Make sure you have at least **1 tFIL** in your deployer wallet. Get testnet tokens from:
- https://faucet.calibnet.chainsafe-fil.io

Then deploy:
```bash
npm run deploy
```

Copy the deployed contract address from the output.

### 4. Configure Frontend

Create `frontend/.env`:
```bash
VITE_CONTRACT_ADDRESS=0x...  # Paste the deployed contract address
```

### 5. Run Frontend
```bash
npm run frontend
```

Open http://localhost:3000 in your browser with MetaMask installed.

## MetaMask Configuration

Add Filecoin Calibration network to MetaMask:
- **Network Name**: Filecoin Calibration
- **RPC URL**: https://api.calibration.node.glif.io/rpc/v1
- **Chain ID**: 314159
- **Currency Symbol**: tFIL
- **Block Explorer**: https://calibration.filfox.info/en

Get testnet tokens:
- **tFIL** (for gas): https://faucet.calibnet.chainsafe-fil.io
- **USDFC** (for Synapse storage): https://faucet.calibnet.chainsafe-fil.io

## Demo Flow

### As a Producer:
1. Go to "Upload & Sell" tab
2. Select a file (CSV, JSON, etc. - max 254 MiB)
3. Click "Upload to Filecoin" (enter your private key when prompted)
4. Fill in dataset name, description, and price
5. Click "List on Marketplace"
6. Your dataset is now for sale! ✨

### As a Buyer:
1. Go to "Browse & Buy" tab
2. View all available datasets
3. Click "Buy Now" on a dataset
4. Confirm payment in MetaMask
5. Click "Download Dataset" to retrieve the file
6. The file is verified via Filecoin's content addressing ✅

## Project Structure

```
dataforge/
├── contracts/              # Solidity smart contracts
├── deploy/                # Deployment scripts
├── test/                  # Contract tests
├── frontend/              # React frontend
│   ├── src/
│   │   ├── filecoin.ts        # Synapse SDK integration
│   │   ├── components/        # React components
│   │   └── hooks/             # Custom hooks
│   └── package.json
├── hardhat.config.ts      # Hardhat configuration
└── package.json
```

## Troubleshooting

### "Contract address not set"
Make sure you've set `VITE_CONTRACT_ADDRESS` in `frontend/.env`

### "Insufficient storage allowance"
You need USDFC deposited for Synapse SDK uploads. Get USDFC from the faucet.

### "Wrong network"
Make sure MetaMask is connected to Filecoin Calibration (Chain ID: 314159)

### Transaction failing
Make sure you have enough tFIL for gas fees

## Key Commands

```bash
# Root (contracts)
npm run compile      # Compile contracts
npm test            # Run tests
npm run deploy      # Deploy to Calibration

# Frontend
npm run frontend    # Start dev server
cd frontend && npm run build  # Build for production
```

## Resources

- [Synapse SDK Docs](https://docs.filecoin.cloud/developer-guides/synapse/)
- [Calibration Explorer](https://calibration.filfox.info/en)
- [Testnet Faucet](https://faucet.calibnet.chainsafe-fil.io)
