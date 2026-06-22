<img width="2863" height="1557" alt="image" src="https://github.com/user-attachments/assets/1bdcc926-1dcd-4837-b7c2-b0f371846c80" />

<img width="2870" height="1552" alt="image" src="https://github.com/user-attachments/assets/5b926a58-67c8-4e94-99f1-4486a992bace" />

<img width="2873" height="1555" alt="image" src="https://github.com/user-attachments/assets/0259b655-6719-4583-95da-c7d562cc7dc1" />


Vercel Deployment link:https://reputation-trust-score-protocol.vercel.app/

Contract Address: CDJBYKQBZGK6BFYQH5X2CSZ7S3YGWZPIN7FRDF7IRS5PC5OJNX4DPSU7

Frighter wallet Address: GD7BXNLXPOYKSEQID3GA6UXRYPJOLL4GGDDQWAKM6ZEF6PJN5TTOAH7A


# TrustNet Protocol: Decentralized Reputation & Trust Scores

TrustNet is a decentralized, graph-weighted reputation and trust score protocol built on the Stellar network. By utilizing Soroban smart contracts, TrustNet allows addresses (users, service providers, or developers) to build an on-chain identity and receive weighted ratings. The protocol mitigates Sybil attacks and spam by weighting ratings by the rater's own reputation and admin-verified status (a decentralized Web-of-Trust).

---

## Features

1. **On-Chain Profiles**: Initialize and update display names, professional categories, and external metadata URIs (IPFS, GitHub).
2. **Graph-Weighted Scoring**: Ratings (1-5 stars) are converted to percentages and weighted on-chain based on the rater's reputation, computed O(1) during review submission.
3. **Admin Verification Multiplier**: Administrators can designate certain trust certifiers, giving their reviews a **3x weight multiplier**.
4. **StellarWalletsKit Integration**: Supports Freighter, Albedo, Hana, and other popular Stellar wallets with unified error handling.
5. **Real-Time Activity Feed**: Directly queries and decodes contract events (`RatingSubmitted`, `ProfileUpdated`) to show ledger activity as it happens.
6. **Transaction Status Tracking**: Session history logging showing status updates (Pending, Success, Failed) and hashes linking directly to StellarExpert.

---

## Tech Stack

* **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Lucide icons
* **State Management**: Zustand
* **Query Caching**: TanStack React Query (React Query v5)
* **Wallet Core**: `@creit.tech/stellar-wallets-kit`
* **Stellar Integration**: `@stellar/stellar-sdk`
* **Smart Contracts**: Rust, Soroban SDK

---

## Setup Instructions

### Prerequisites
1. **Node.js**: v18+ (v24 recommended)
2. **Rust & Cargo**: Latest version (to compile the contract)
3. **Stellar CLI**: Installed and available

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file by copying the template:
```bash
cp .env.example .env.local
```

Configure the variables in `.env.local`:
```env
NEXT_PUBLIC_REPUTATION_CONTRACT_ID="CONTRACT_ADDRESS_HERE"
NEXT_PUBLIC_STELLAR_NETWORK="testnet"
NEXT_PUBLIC_STELLAR_RPC_URL="https://soroban-testnet.stellar.org"
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
```

---

## Wallet Setup
To connect and interact with the application:
1. Install the [Freighter Wallet Chrome Extension](https://www.freighter.app/) or use [Albedo](https://albedo.link/).
2. In Freighter, switch the network to **Testnet** (under Settings > Network).
3. Fund your Testnet address using the Friendbot funding button on [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=testnet) or directly in your wallet.

---

## Contract Deployment

We provide an automated deployment and configuration script `scripts/deploy.js`.

To build, deploy to Testnet, initialize admin keys, and generate TS bindings automatically, run:
```bash
node scripts/deploy.js
```

This script will:
1. Check or generate a `deployer` key inside Stellar CLI and fund it.
2. Compile the Rust contract to Wasm.
3. Deploy `reputation.wasm` to Stellar Testnet.
4. Initialize the contract setting the deployer as the admin.
5. Generate client-side TypeScript bindings and install them to your Next.js project.
6. Write the contract configuration to `.env.local` and `lib/reputation-client.ts`.

---

## Running Locally

Once the contract is deployed and `.env.local` is set, launch the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment (Vercel)

To deploy the frontend to Vercel:
1. Push your code to GitHub.
2. Connect your repository to Vercel.
3. Configure the environment variables in your Vercel project settings:
   * `NEXT_PUBLIC_REPUTATION_CONTRACT_ID` = `CBICHSYLR3EX47TD6ILAZKLVJKZMGVB234CABE2QAN33ECSKG3BFM6HK`
   * `NEXT_PUBLIC_STELLAR_NETWORK` = `testnet`
   * `NEXT_PUBLIC_STELLAR_RPC_URL` = `https://soroban-testnet.stellar.org`
   * `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE` = `Test SDF Network ; September 2015`
4. Click **Deploy**.

---

## Placeholders
* **Contract Address**: `CDJBYKQBZGK6BFYQH5X2CSZ7S3YGWZPIN7FRDF7IRS5PC5OJNX4DPSU7`
* **Example Transaction**: `e8220067fb117b884d5df684a0d9b4b0e6e73775f0a0d995c7c25091a134a6ef`
