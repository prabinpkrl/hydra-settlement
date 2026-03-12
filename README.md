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

## Tech Stack

Next.js 15, TypeScript, Tailwind CSS, Zustand, Cardano Hydra

## Prerequisites

Hydra devnet running on ports 8082-8084 (see `kuber/kuber-hydra/devnet`)
