'use client';

import React, { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
require('@solana/wallet-adapter-react-ui/styles.css');

interface WalletContextProviderProps {
  children: ReactNode;
}

export const WalletContextProvider: FC<WalletContextProviderProps> = ({ children }) => {
  // Get network from environment variable, default to mainnet
  const networkEnv = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta';

  const network = useMemo(() => {
    switch (networkEnv) {
      case 'devnet':
        return WalletAdapterNetwork.Devnet;
      case 'testnet':
        return WalletAdapterNetwork.Testnet;
      case 'mainnet-beta':
      case 'mainnet':
        return WalletAdapterNetwork.Mainnet;
      default:
        console.warn(`Unknown network: ${networkEnv}, defaulting to mainnet`);
        return WalletAdapterNetwork.Mainnet;
    }
  }, [networkEnv]);

  // Use custom RPC endpoint if provided, otherwise use default
  const endpoint = useMemo(() => {
    const customEndpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT;

    if (customEndpoint && customEndpoint.trim() !== '') {
      console.log(`[Wallet] Using custom RPC endpoint for ${networkEnv}:`, customEndpoint);
      return customEndpoint;
    }

    console.log(`[Wallet] Using default public RPC for ${networkEnv}`);
    console.warn('[Wallet] ⚠️ Public RPC will block getProgramAccounts - set NEXT_PUBLIC_RPC_ENDPOINT for real data');
    return clusterApiUrl(network);
  }, [network, networkEnv]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};