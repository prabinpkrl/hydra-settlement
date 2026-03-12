# Hydra Settlement System

A 3-party escrow payment system built on Cardano's Hydra Layer-2 protocol for instant, near-zero-fee transactions.

## Features

- **Multiple concurrent escrows** - Create unlimited simultaneous payment agreements
- **3-party model** - Buyer (Alice), Seller (Bob), Mediator (Carol)
- **Dispute resolution** - Built-in mediation for payment conflicts
- **Instant transactions** - All payments happen within the Hydra Head
- **Real-time sync** - LocalStorage-based state synchronization between parties

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open:
- Alice (Buyer): http://localhost:3000/alice
- Bob (Seller): http://localhost:3000/bob
- Carol (Mediator): http://localhost:3000/carol
- Dashboard: http://localhost:3000/dashboard

## Flow

1. All parties coordinate to open a Hydra Head
2. Alice creates escrows and locks funds
3. Bob confirms delivery of goods/services
4. Alice releases payment or raises dispute
5. Carol resolves disputes if raised

## Prerequisites

- **Docker** installed and running
- **Node.js** 18+ and npm
- **Kuber Hydra devnet** - Clone and setup:
  ```bash
  git clone https://github.com/dQuadrant/kuber.git
  cd kuber/kuber-hydra/devnet
  ./reset-cluster.sh
  ./seed-devnet.sh
  ```
  This will start Hydra nodes on ports 8082-8084
  
  📖 **For detailed Kuber Hydra setup**: [View Documentation](https://dquadrant.github.io/kuber/hydra_docusaurus/docs/hydra-js-client/local-devnet)

## Setup

1. **Start Hydra devnet** (in kuber-hydra/devnet directory):
   ```bash
   docker compose up -d
   ```

2. **Install and run frontend**:
   ```bash
   npm install
   npm run dev
   ```

3. **Initialize Hydra Head**:
   - Open Alice's page: http://localhost:3000/alice
   - Click "Initialize Head"
   - All three parties (Alice, Bob, Carol) must manually commit funds
   - Once all parties commit, the head opens
   - **Transactions only happen after the head is open**

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **Zustand** - State management
- **Cardano Hydra** - Layer-2 scaling protocol
- **Kuber Hydra** - Hydra API wrapper
