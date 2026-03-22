# DataForge

> **A dual-layer decentralized data marketplace.** Provenance on Filecoin. Settlement onchain. Agentic access via x402 microtransactions.

DataForge is a decentralized ecosystem where every dataset is backed by a verifiable Filecoin CID and cryptographically protected by Lit Protocol. The platform operates on two distinct layers:

1. **The Human Layer**: A React-based web marketplace where sellers list Lit-encrypted datasets stored on Filecoin, and buyers purchase and decrypt them transparently.
2. **The Agent Layer**: A passive Node.js platform agent registered with an ERC-8004 identity on Base Mainnet. External AI agents can discover, purchase, and receive decrypted datasets autonomously using x402 (USDC) microtransactions.

---

## 🏗 Architecture

### 1. Human Layer (Web Marketplace)
- Producers upload datasets to **Filecoin Calibration Testnet** via the **Synapse SDK**
- Files are encrypted client-side using **Lit Protocol v8 (Naga)** with onchain access control conditions before upload — ensuring only authorized buyers can decrypt
- Smart contracts (`DataMarketplace.sol`) handle listings, purchases, and fee distribution transparently
- Buyers purchase access by paying FIL; Lit Protocol verifies the purchase onchain before releasing decryption keys

### 2. Agent Layer (Platform Backend)
- A passive **ERC-8004 registered Platform Agent** acts as an autonomous broker
- Exposes `GET /listings` for programmatic dataset discovery
- External AI agents pay **dynamic USDC on Base Sepolia** via the **x402** payment protocol — no API keys, no signups. The USDC price is automatically calculated from the listing's FIL price using a CoinGecko oracle (60s cache)
- On payment, the platform agent purchases the listing on Filecoin, downloads the encrypted payload via Synapse, decrypts server-side via Lit Protocol using its private key, and returns plaintext bytes to the requesting agent

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity (`DataMarketplace.sol`) on Filecoin Calibration Testnet |
| Storage | `@filoz/synapse-sdk` — Filecoin upload, retrieval, and onchain confirmation |
| Encryption | **Lit Protocol v8 (Naga)** — client-side encrypt, server-side decrypt with EVM contract ACC |
| Agent Identity | **ERC-8004** on Base Mainnet (via Synthesis) |
| Agent Payments | `@x402/express` + `@x402/fetch` — USDC on Base Sepolia |
| Frontend | React + Vite + TypeScript |
| Infrastructure | Docker + Nginx |

---

## 🔐 How Lit Protocol is Used

DataForge uses **Lit Protocol V1 (Naga SDK)** as the cryptographic access control layer — not just for encryption but as the enforcement mechanism for the entire marketplace:

1. **Encryption** — when a seller uploads a dataset, it is encrypted via `client.encrypt()` with an Access Control Condition (ACC) tied to the `isAuthorized()` function of the marketplace smart contract
2. **Access Control** — Lit nodes call `isAuthorized(listingId, userAddress)` onchain to verify a purchase before releasing decryption keys. No purchase = no decryption, cryptographically enforced
3. **Server-side Decryption** — the platform agent decrypts using `createEoaAuthContext` with a private key (no MetaMask) via `storagePlugins.localStorageNode` — enabling fully autonomous agent access
4. **Cross-chain** — encryption happens on Filecoin Calibration; Lit nodes are on their own network; the ACC checks the Filecoin contract — demonstrating Lit's cross-chain programmable access control

---

## 🌐 How Filecoin + Synapse SDK is Used

1. **Dataset storage** — every listed dataset is uploaded as encrypted bytes to Filecoin Calibration via `synapse.storage.upload()`, returning a `pieceCid` stored onchain in the marketplace contract
2. **Agent card storage** — the platform agent's `agent.json` (ERC-8004 identity manifest) is also stored on Filecoin, with its CID used as the ERC-8004 `tokenURI` — linking onchain identity to decentralized storage
3. **Retrieval** — both the frontend and the platform agent download datasets via `synapse.storage.download()` using the CID from the contract

---

## 🤖 How ERC-8004 is Used

1. **Agent registration** — the platform agent registers its identity via the Synthesis API, minting an ERC-8004 NFT on Base Mainnet with `agent.json` stored on Filecoin as the `tokenURI`
2. **Self-custody** — the NFT is transferred from Synthesis custody to the operator wallet via `npm run transfer`
3. **Discoverability** — any ERC-8004 compatible agent network can discover DataForge by resolving the agent's identity and reading its capabilities and service endpoints

---

## 🚀 Setup & Installation

### Prerequisites
- Docker & Docker Compose
- Node.js v20+
- `.env` file in `./backend/` — see `backend/.env.example`

### 1. Register Your Agent
```bash
cd backend
npm install
npm run register
```
Creates your ERC-8004 identity on Base Mainnet and saves credentials to `agent_log.json`.

### 2. Start the Stack
```bash
docker-compose up --build -d
```
- **Frontend**: `http://localhost:80`
- **Platform Agent API**: `http://localhost:4000`

### 3. Claim Self-Custody
```bash
cd backend
npm run transfer
```
Transfers the ERC-8004 NFT from Synthesis custody to your wallet. Viewable on Basescan.

---

## 🤖 Agent Demo

```bash
cd backend
npm run consumer
```

Runs `consumer_agent.ts` — powered by **NEAR AI** — which autonomously:
1. Discovers datasets from `GET /listings`
2. Reasons about which to buy based on goal and budget
3. Pays USDC via x402 on Base Sepolia
4. Receives decrypted dataset bytes
5. Analyses the data and logs everything to `consumer_log.json`

No human clicks anything.

---

## 🔒 Security Notes

⚠️ **Hackathon/demo project.** For production:
- Use cloud KMS (AWS KMS, HashiCorp Vault) instead of `.env` private keys
- Lit Protocol access control is configured for Filecoin Calibration Testnet
- x402 price is dynamically calculated from the listing's FIL value via CoinGecko oracle. High-frequency usage may need multi-oracle consensus for production

---

## 🏆 Bounty Alignment

**Filecoin — Challenge #7: Agent-Generated Data Marketplace**
- ✅ Marketplace contracts (listing, purchase, settlement)
- ✅ CID-rooted dataset storage via Synapse SDK
- ✅ Producer + consumer agent demo
- ✅ Deployed on Filecoin Calibration Testnet

**ERC-8004 — Agents With Receipts**
- ✅ Identity registry — ERC-8004 agent registered on Base Mainnet
- ✅ Agent identity linked to operator wallet (self-custody transfer)
- ✅ Autonomous agent architecture (planning → execution → verification → decision loops)
- ✅ `agent.json` + `agent_log.json` DevSpot compatibility
- ✅ All transactions viewable on Basescan

**Lit Protocol — NextGen AI Apps**
- ✅ Lit Protocol V1 (Naga SDK) for encryption and programmable access control
- ✅ EVM contract ACC gating decryption behind onchain purchase verification
- ✅ Server-side decryption enabling fully autonomous agent access
- ✅ Cross-chain access control (Filecoin contract + Lit nodes)

---

## 📚 Resources

- [ERC-8004 Spec](https://eips.ethereum.org/EIPS/eip-8004)
- [x402 Payment Protocol](https://x402.org/)
- [Synapse SDK GitHub](https://github.com/FilOzone/synapse-sdk)
- [Lit Protocol v8 Docs](https://developer.litprotocol.com/sdk/introduction)
- [Filecoin Calibration Faucet](https://faucet.calibration.fildev.network)

## License
MIT