# RPC Setup Guide

## Why You Need a Private RPC

The app is currently showing **mock/demo data** because the public Solana RPC endpoint blocks `getProgramAccounts` calls with **403 errors**.

### The Problem

```
Error: 403 : {"jsonrpc":"2.0","error":{"code": 403, "message":"Access forbidden"}, "id": "..."}
```

Public RPC endpoints (`https://api.mainnet-beta.solana.com`) block resource-intensive queries like `getProgramAccounts` to prevent abuse. This query is required to fetch all DLMM pool addresses from the Saros Finance protocol.

## Solution: Get a Free Private RPC

### Option 1: Helius (Recommended)

**Best for Solana development - 100,000 requests/day free tier**

1. Go to https://helius.dev
2. Sign up for a free account
3. Create a new API key
4. Your endpoint will look like:
   ```
   https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
   ```

### Option 2: QuickNode

**500,000 requests/day free tier**

1. Go to https://quicknode.com
2. Sign up and create a Solana Mainnet endpoint
3. Your endpoint will look like:
   ```
   https://YOUR_ENDPOINT.solana-mainnet.quiknode.pro/YOUR_TOKEN/
   ```

### Option 3: Alchemy

1. Go to https://alchemy.com
2. Create a Solana app
3. Your endpoint will look like:
   ```
   https://solana-mainnet.g.alchemy.com/v2/YOUR_API_KEY
   ```

## Configuration Steps

1. **Get your RPC endpoint** from one of the providers above

2. **Update `.env.local`** file:
   ```bash
   NEXT_PUBLIC_RPC_ENDPOINT=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
   ```

3. **Restart the dev server**:
   ```bash
   # Press Ctrl+C to stop
   npm run dev
   ```

4. **Verify it works**:
   - Open the browser console (F12)
   - Look for: `[DLMM] Found X pool addresses: [...]`
   - The yellow "Demo Mode" banner should disappear

## Technical Details

### What `getProgramAccounts` Does

This RPC method queries all accounts owned by the Saros DLMM program (`1qbkdrr3z4ryLA7pZykqxvxWPoeifcVKo6ZG9CfkvVE`) to find all pool addresses.

The SDK code:
```typescript
const accounts = await connection.getProgramAccounts(
  new PublicKey(programId),
  {
    filters: [{
      memcmp: { offset: 0, bytes: bs58.encode(pairAccountDiscriminator) }
    }]
  }
);
```

### Why Public RPCs Block This

- `getProgramAccounts` scans the entire on-chain state
- Very resource-intensive (can scan millions of accounts)
- Public RPCs rate-limit or block to prevent abuse
- Private RPCs have higher limits and allow these queries

## Current Behavior

**Without private RPC:**
- ✗ Shows mock/demo data
- ✗ Yellow "Demo Mode" banner visible
- ✗ Cannot fetch real pool addresses
- ✗ 403 errors in console

**With private RPC:**
- ✓ Fetches real pool data from Saros Finance
- ✓ No demo mode banner
- ✓ Real liquidity, prices, and TVL
- ✓ Can create actual positions
