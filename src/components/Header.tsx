'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Activity, TrendingUp, Zap } from 'lucide-react';

export function Header() {
  const { connected, publicKey } = useWallet();

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  DLMM Pro Manager
                </h1>
                <p className="text-xs text-gray-500">Powered by Saros Finance</p>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <a href="#dashboard" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              Dashboard
            </a>
            <a href="#positions" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              Positions
            </a>
            <a href="#analytics" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              Analytics
            </a>
            <a href="#strategies" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              Strategies
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            {connected && (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Connected</span>
              </div>
            )}
            <WalletMultiButton className="!bg-gradient-to-r !from-blue-500 !to-purple-600 !border-0 !rounded-lg !h-10 !px-4 !text-sm !font-medium hover:!from-blue-600 hover:!to-purple-700 transition-all" />
          </div>
        </div>
      </div>
    </header>
  );
}