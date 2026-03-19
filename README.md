# DataForge

> Buy and sell verifiable datasets. Provenance on Filecoin. Settlement onchain.

A decentralized data marketplace where every dataset is backed by a Filecoin CID. Producers upload data via Synapse SDK. Buyers pay onchain. The CID proves what was sold.

## The Problem

Data marketplaces today are centralized — you trust the platform that the data is real and hasn't been tampered with. With Filecoin, the CID is the proof.

## The Solution

DataForge uses Filecoin's Synapse SDK to store datasets with verifiable PieceCIDs. Smart contracts handle listing and payment. No central server. No trust required.

## How It Uses Filecoin

- Synapse SDK uploads datasets to Filecoin Calibration testnet
- PieceCID returned from upload is stored in the marketplace contract
- Buyers retrieve datasets using the CID via Synapse SDK download
- All storage is verifiable onchain via PDP proofs

## Tech Stack

- **Smart Contracts**: Solidity (DataMarketplace.sol) — deployed on Filecoin Calibration Testnet
- **Storage**: @filoz/synapse-sdk — Filecoin storage and retrieval
- **Frontend**: React + Vite + TypeScript
- **Web3**: ethers v6 + MetaMask
- **Development**: Hardhat

## Project Structure

```
dataforge/
├── contracts/
│   └── DataMarketplace.sol        # Listing, escrow, settlement
├── deploy/
│   └── 01_deploy_marketplace.ts   # Deployment script
├── test/
│   └── DataMarketplace.test.ts    # Contract tests
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── filecoin.ts            # Synapse SDK integration
│   │   ├── components/
│   │   │   ├── ProducerDashboard.tsx
│   │   │   ├── BuyerDashboard.tsx
│   │   │   └── ListingCard.tsx
│   │   └── hooks/
│   │       ├── useMarketplace.ts
│   │       └── useFilecoin.ts
│   └── package.json
├── hardhat.config.ts
└── package.json
```

## Setup & Installation

### Prerequisites

- Node.js v18+ (LTS)
- MetaMask wallet
- Git

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```bash
# Deployer wallet private key (NEVER commit this!)
PRIVATE_KEY=0x...

# Filecoin Calibration RPC URL
CALIBRATION_RPC=https://api.calibration.node.glif.io/rpc/v1
```

### 3. Get Testnet Tokens

Get tFIL and USDFC from the faucet:
- **Faucet**: https://faucet.calibnet.chainsafe-fil.io
- Fund your deployer wallet with at least **1 tFIL** before deploying

### 4. Add Filecoin Calibration to MetaMask

```javascript
Network Name: Filecoin Calibration
RPC URL: https://api.calibration.node.glif.io/rpc/v1
Chain ID: 314159
Currency Symbol: tFIL
Block Explorer: https://calibration.filfox.info/en
```

### 5. Compile & Test Contracts

```bash
# Compile contracts
npm run compile

# Run tests
npm test
```

### 6. Deploy to Calibration Testnet

```bash
npm run deploy
```

Copy the deployed contract address and add it to `frontend/.env`:

```bash
VITE_CONTRACT_ADDRESS=0x...
```

### 7. Run Frontend

```bash
npm run frontend
```

The app will be available at `http://localhost:3000`

## Usage

### For Producers (Sellers)

1. Click **Upload & Sell** tab
2. Select a file (CSV, JSON, etc. - max 254 MiB)
3. Click **Upload to Filecoin** — Synapse SDK returns a CID
4. Fill in dataset name, description, and price
5. Click **List on Marketplace** — dataset is now for sale

### For Buyers

1. Browse datasets in the **Browse & Buy** tab
2. Click **Buy Now** on a dataset you want
3. Confirm payment in MetaMask
4. Click **Download Dataset** to retrieve the file using the CID
5. The file is verified by Filecoin's content addressing

## Development Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to Calibration testnet
npm run deploy

# Deploy to local Hardhat network
npm run deploy:local

# Run frontend dev server
npm run frontend
```

## Architecture

```
┌─────────┐     ┌──────────────┐     ┌──────────┐
│  User   │────>│   Frontend   │────>│ MetaMask │
└─────────┘     └──────────────┘     └──────────┘
                        │                    │
                        │                    │
                        v                    v
                ┌──────────────┐    ┌──────────────┐
                │ Synapse SDK  │    │   Contract   │
                │  (Storage)   │    │ (Marketplace)│
                └──────────────┘    └──────────────┘
                        │                    │
                        v                    v
                ┌──────────────────────────────────┐
                │   Filecoin Calibration Testnet   │
                └──────────────────────────────────┘
```

## Features

- ✅ Upload datasets to Filecoin via Synapse SDK
- ✅ List datasets for sale with metadata
- ✅ Purchase datasets with tFIL
- ✅ Download purchased datasets using CID
- ✅ Trustless verification via content addressing
- ✅ Cancel listings
- ✅ Access control for CID retrieval

## Security Notes

⚠️ **Important**: This is a hackathon/demo project. For production use:

- Never expose private keys in the frontend
- Use a proper key management solution
- Add more comprehensive access controls
- Implement dispute resolution mechanisms
- Add dataset preview/sample data features

## Judging Criteria

- **Technical Execution (40%)**: Full integration with Synapse SDK, working contract deployment on Calibration, complete frontend
- **Innovation (30%)**: CID-as-proof-of-provenance is a new primitive for data commerce
- **Potential Impact (20%)**: Decentralized data marketplaces unlock trust in multi-billion dollar data industry
- **Presentation (10%)**: Upload → list → buy → download in a clean, visual demo

## Resources

- [Synapse SDK GitHub](https://github.com/FilOzone/synapse-sdk)
- [Synapse SDK Docs](https://docs.filecoin.cloud/developer-guides/synapse/)
- [Filecoin Calibration Docs](https://docs.filecoin.io/networks/calibration)
- [Calibration Faucet](https://faucet.calibnet.chainsafe-fil.io)
- [Calibration Explorer](https://calibration.filfox.info/en)

## License

MIT
