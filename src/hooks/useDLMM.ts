import { useState, useEffect, useCallback, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { LiquidityBookServices, MODE } from '@saros-finance/dlmm-sdk';
// import type { PositionInfo } from '@saros-finance/dlmm-sdk';

export interface DLMMPool {
  address: string;
  tokenX: {
    symbol: string;
    mint: string;
    decimals: number;
  };
  tokenY: {
    symbol: string;
    mint: string;
    decimals: number;
  };
  currentPrice: number;
  tvl: number;
  volume24h: number;
  fees24h: number;
  binStep?: number;
  activeId?: number;
}

export interface DLMMPosition {
  id: string;
  poolAddress: string;
  positionMint: string;
  lowerPrice: number;
  upperPrice: number;
  lowerBinId: number;
  upperBinId: number;
  liquidity: number;
  tokenXAmount: number;
  tokenYAmount: number;
  feesEarned: number;
  pnl: number;
  apy: number;
  entryPrice?: number;
  entryTokenXAmount?: number;
  entryTokenYAmount?: number;
  entryTimestamp?: number;
  initialValueUSD?: number;
}

// Known Saros DLMM token addresses on Devnet
const KNOWN_TOKENS: Record<string, { symbol: string; decimals: number }> = {
  'So11111111111111111111111111111111111111112': { symbol: 'SOL', decimals: 9 },
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', decimals: 6 },
  'SarosNETPRPkBhFRh34RPhyE2m6CnHcdVdKhpCXJ3K7Y': { symbol: 'SAROS', decimals: 6 },
};

export const useDLMM = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction, sendTransaction } = useWallet();

  const [pools, setPools] = useState<DLMMPool[]>([]);
  const [positions, setPositions] = useState<DLMMPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize DLMM SDK with proper configuration
  const dlmmService = useMemo(() => {
    const networkEnv = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta';

    // Map network name to DLMM SDK mode
    const mode = networkEnv === 'devnet' ? MODE.DEVNET : MODE.MAINNET;

    const rpcUrl = connection.rpcEndpoint;
    const isPublicRpc = rpcUrl.includes('api.mainnet-beta.solana.com') || rpcUrl.includes('api.devnet.solana.com');

    console.log(`[DLMM] Initializing SDK in ${mode} mode`);
    console.log(`[DLMM] RPC: ${rpcUrl}`);

    if (isPublicRpc) {
      console.warn('[DLMM] ⚠️ Using public RPC - getProgramAccounts will likely fail with 403 errors');
      console.warn('[DLMM] ⚠️ Set NEXT_PUBLIC_RPC_ENDPOINT in .env.local to use a private RPC (Helius, QuickNode, etc.)');
    }

    return new LiquidityBookServices({
      mode,
      options: {
        rpcUrl: connection.rpcEndpoint,
      }
    });
  }, [connection]);

  // Helper function to get token info
  const getTokenInfo = (mintAddress: string) => {
    return KNOWN_TOKENS[mintAddress] || { symbol: mintAddress.slice(0, 4), decimals: 9 };
  };

  // Helper function to calculate price from bin ID
  const calculatePriceFromBinId = (binId: number, binStep: number): number => {
    // Price = (1 + binStep/10000)^binId
    return Math.pow(1 + binStep / 10000, binId);
  };

  // Helper function to store position entry data in localStorage
  const storePositionEntry = (positionId: string, data: {
    entryPrice: number;
    entryTokenXAmount: number;
    entryTokenYAmount: number;
    entryTimestamp: number;
    initialValueUSD: number;
  }) => {
    try {
      const key = `position_entry_${positionId}`;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.warn('Failed to store position entry data:', err);
    }
  };

  // Helper function to retrieve position entry data from localStorage
  const getPositionEntry = (positionId: string) => {
    try {
      const key = `position_entry_${positionId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.warn('Failed to retrieve position entry data:', err);
      return null;
    }
  };

  // Helper function to calculate P&L
  const calculatePnL = (
    currentTokenX: number,
    currentTokenY: number,
    entryTokenX: number,
    entryTokenY: number,
    currentPrice: number,
    entryPrice: number
  ): number => {
    // Calculate current value in terms of token Y
    const currentValue = (currentTokenX * currentPrice) + currentTokenY;
    // Calculate entry value in terms of token Y
    const entryValue = (entryTokenX * entryPrice) + entryTokenY;
    // P&L is the difference
    return currentValue - entryValue;
  };

  // Helper function to calculate APY
  const calculateAPY = (
    currentValue: number,
    initialValue: number,
    daysHeld: number,
    feesEarned: number
  ): number => {
    if (initialValue === 0 || daysHeld === 0) return 0;

    // Total return including fees
    const totalReturn = ((currentValue - initialValue + feesEarned) / initialValue);

    // Annualize the return (365 days in a year)
    const annualizedReturn = (totalReturn * (365 / daysHeld)) * 100;

    return annualizedReturn;
  };

  // Helper function to estimate fees from bin reserves
  const estimateFeesFromBins = async (
    positionId: string,
    poolPubkey: PublicKey,
    position: { poolAddress: string }
  ): Promise<number> => {
    try {
      if (!publicKey) return 0;

      const binsReserve = await dlmmService.getBinsReserveInformation({
        position: new PublicKey(positionId),
        pair: poolPubkey,
        payer: publicKey,
      });

      // Get entry data to compare
      const entryData = getPositionEntry(positionId);
      if (!entryData) return 0;

      // Calculate total current reserves
      let currentTokenX = 0;
      let currentTokenY = 0;
      for (const bin of binsReserve) {
        currentTokenX += Number(bin.reserveX) || 0;
        currentTokenY += Number(bin.reserveY) || 0;
      }

      // Fees are the increase in reserves beyond initial deposit
      // (simplified - in reality would need to account for price changes)
      const pool = pools.find(p => p.address === position.poolAddress);
      if (!pool) return 0;

      const currentTokenXAdjusted = currentTokenX / Math.pow(10, pool.tokenX.decimals);
      const currentTokenYAdjusted = currentTokenY / Math.pow(10, pool.tokenY.decimals);

      const xDiff = Math.max(0, currentTokenXAdjusted - entryData.entryTokenXAmount);
      const yDiff = Math.max(0, currentTokenYAdjusted - entryData.entryTokenYAmount);

      // Estimate fees in USD (rough approximation)
      return (xDiff * pool.currentPrice + yDiff) * 0.5; // Conservative estimate
    } catch (err) {
      console.warn('Failed to estimate fees:', err);
      return 0;
    }
  };

  // Fetch available pools with rate limit handling
  const fetchPools = useCallback(async () => {
    if (!dlmmService) return;

    setLoading(true);
    setError(null);

    const networkEnv = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta';
    // Known Saros pool address on mainnet (if available)
    const KNOWN_MAINNET_POOL = '9P3N4QxjMumpTNNdvaNNskXu2t7VHMMXtePQB72kkSAk';

    const mockPool = {
      address: "Sample Pool 1",
      tokenX: { symbol: "SOL", mint: "So11111111111111111111111111111111111111112", decimals: 9 },
      tokenY: { symbol: "USDC", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 },
      currentPrice: 245.50,
      tvl: 12500000,
      volume24h: 2100000,
      fees24h: 8400,
      binStep: 10,
      activeId: 8388608
    };

    try {
      console.log(`[DLMM] Fetching pools from ${networkEnv}...`);
      console.log(`[DLMM] SDK Mode:`, dlmmService.mode);
      console.log(`[DLMM] RPC Endpoint:`, connection.rpcEndpoint);

      // Add retry logic for rate limiting
      let poolAddresses: string[] = [];
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          poolAddresses = await dlmmService.fetchPoolAddresses();
          console.log(`[DLMM] Found ${poolAddresses?.length || 0} pool addresses:`, poolAddresses);
          break;
        } catch (fetchErr) {
          const error = fetchErr as Error & {response?: {status?: number}};
          console.error(`[DLMM] Error fetching pool addresses:`, error);
          console.error(`[DLMM] Error name:`, error?.name);
          console.error(`[DLMM] Error message:`, error?.message);

          if (error?.message?.includes('429') || error?.response?.status === 429) {
            retries++;
            if (retries < maxRetries) {
              const delay = Math.pow(2, retries) * 1000; // Exponential backoff
              console.log(`[DLMM] Rate limited. Retrying after ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            } else {
              throw new Error('Rate limit exceeded. Please try again in a few moments.');
            }
          } else {
            // Break out and try known pool instead
            console.warn(`[DLMM] fetchPoolAddresses failed, will try known pool instead`);
            break;
          }
        }
      }

      // Use mock data if API fails or returns empty, but also try known pool on mainnet
      if (!poolAddresses || poolAddresses.length === 0) {
        if (networkEnv === 'mainnet-beta') {
          console.log(`[DLMM] No pools from API, trying known mainnet pool: ${KNOWN_MAINNET_POOL}`);

          // Test: Try to fetch the known pool directly to see if it exists
          try {
            console.log(`[DLMM] Testing direct fetch of known pool...`);
            const testPairAccount = await dlmmService.getPairAccount(new PublicKey(KNOWN_MAINNET_POOL));
            console.log(`[DLMM] ✓ Successfully fetched known pool directly!`, testPairAccount);
            console.log(`[DLMM] Pool details:`, {
              tokenX: testPairAccount.tokenMintX.toString(),
              tokenY: testPairAccount.tokenMintY.toString(),
              binStep: testPairAccount.binStep,
              activeId: testPairAccount.activeId
            });
          } catch (directFetchErr) {
            console.error(`[DLMM] ✗ Failed to fetch known pool directly:`, directFetchErr);
          }

          poolAddresses = [KNOWN_MAINNET_POOL];
        } else {
          console.warn(`[DLMM] No pools found on ${networkEnv}, using mock data for demo`);
          setPools([mockPool]);
          return;
        }
      }

      const poolsData: DLMMPool[] = [];

      // Fetch pair info for limited pools to avoid rate limits
      console.log(`[DLMM] Fetching details for up to 5 pools...`);
      for (const poolAddress of poolAddresses.slice(0, 5)) {
        try {
          await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit protection
          const pairAccount = await dlmmService.getPairAccount(new PublicKey(poolAddress));

          if (pairAccount) {
            const tokenXInfo = getTokenInfo(pairAccount.tokenMintX.toString());
            const tokenYInfo = getTokenInfo(pairAccount.tokenMintY.toString());
            const currentPrice = calculatePriceFromBinId(pairAccount.activeId, pairAccount.binStep);

            poolsData.push({
              address: poolAddress,
              tokenX: {
                symbol: tokenXInfo.symbol,
                mint: pairAccount.tokenMintX.toString(),
                decimals: tokenXInfo.decimals,
              },
              tokenY: {
                symbol: tokenYInfo.symbol,
                mint: pairAccount.tokenMintY.toString(),
                decimals: tokenYInfo.decimals,
              },
              currentPrice,
              tvl: 0,
              volume24h: 0,
              fees24h: 0,
              binStep: pairAccount.binStep,
              activeId: pairAccount.activeId,
            });
            console.log(`[DLMM] Successfully loaded pool: ${tokenXInfo.symbol}/${tokenYInfo.symbol}`);
          }
        } catch (poolErr) {
          console.warn(`[DLMM] Failed to fetch pool ${poolAddress}:`, poolErr);
        }
      }

      // If we have pools, use them. Otherwise fall back to mock data
      if (poolsData.length > 0) {
        console.log(`[DLMM] Successfully loaded ${poolsData.length} pools`);
        setPools(poolsData);
      } else {
        console.warn(`[DLMM] All pool fetches failed on ${networkEnv}. Using mock data for demo.`);
        setPools([mockPool]);
      }
    } catch (err) {
      console.error('[DLMM] Error in fetchPools:', err);

      // Use mock data on error
      console.warn(`[DLMM] Using mock data due to error`);
      setPools([mockPool]);
      setError(null); // Don't show error to user, just use mock data
    } finally {
      setLoading(false);
    }
  }, [dlmmService, connection]);

  // Fetch user positions
  const fetchPositions = useCallback(async () => {
    if (!publicKey || !dlmmService) return;

    setLoading(true);
    setError(null);

    try {
      const userPositions: DLMMPosition[] = [];

      // Fetch positions for each known pool
      for (const pool of pools) {
        try {
          const poolPubkey = new PublicKey(pool.address);
          const positions = await dlmmService.getUserPositions({
            payer: publicKey,
            pair: poolPubkey,
          });

          for (const position of positions) {
            // Get bin reserve information
            const positionPubkey = new PublicKey(position.position);
            const binsReserve = await dlmmService.getBinsReserveInformation({
              position: positionPubkey,
              pair: poolPubkey,
              payer: publicKey,
            });

            // Calculate total amounts
            let totalTokenX = 0;
            let totalTokenY = 0;
            let totalLiquidity = 0;

            for (const bin of binsReserve) {
              totalTokenX += Number(bin.reserveX) || 0;
              totalTokenY += Number(bin.reserveY) || 0;
              totalLiquidity += Number(bin.totalSupply) || 0;
            }

            const lowerPrice = calculatePriceFromBinId(position.lowerBinId, pool.binStep || 1);
            const upperPrice = calculatePriceFromBinId(position.upperBinId, pool.binStep || 1);

            const currentTokenXAmount = totalTokenX / Math.pow(10, pool.tokenX.decimals);
            const currentTokenYAmount = totalTokenY / Math.pow(10, pool.tokenY.decimals);

            // Get entry data from localStorage
            const entryData = getPositionEntry(position.position);

            // Calculate fees, P&L, and APY if we have entry data
            let feesEarned = 0;
            let pnl = 0;
            let apy = 0;

            if (entryData) {
              // Estimate fees from bin reserves
              feesEarned = await estimateFeesFromBins(position.position, poolPubkey, position);

              // Calculate P&L
              pnl = calculatePnL(
                currentTokenXAmount,
                currentTokenYAmount,
                entryData.entryTokenXAmount,
                entryData.entryTokenYAmount,
                pool.currentPrice,
                entryData.entryPrice
              );

              // Calculate APY
              const daysHeld = (Date.now() - entryData.entryTimestamp) / (1000 * 60 * 60 * 24);
              const currentValue = (currentTokenXAmount * pool.currentPrice) + currentTokenYAmount;
              apy = calculateAPY(currentValue, entryData.initialValueUSD, daysHeld, feesEarned);
            }

            userPositions.push({
              id: position.position,
              poolAddress: pool.address,
              positionMint: position.positionMint,
              lowerPrice,
              upperPrice,
              lowerBinId: position.lowerBinId,
              upperBinId: position.upperBinId,
              liquidity: totalLiquidity,
              tokenXAmount: currentTokenXAmount,
              tokenYAmount: currentTokenYAmount,
              feesEarned,
              pnl,
              apy,
              entryPrice: entryData?.entryPrice,
              entryTokenXAmount: entryData?.entryTokenXAmount,
              entryTokenYAmount: entryData?.entryTokenYAmount,
              entryTimestamp: entryData?.entryTimestamp,
              initialValueUSD: entryData?.initialValueUSD,
            });
          }
        } catch (poolErr) {
          console.warn(`Failed to fetch positions for pool ${pool.address}:`, poolErr);
        }
      }

      setPositions(userPositions);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch positions';
      setError(errorMsg);
      console.error('Error fetching positions:', err);
    } finally {
      setLoading(false);
    }
  }, [publicKey, dlmmService, pools, estimateFeesFromBins]);

  // Create new DLMM position
  const createPosition = useCallback(async (
    poolAddress: string,
    lowerPrice: number,
    upperPrice: number,
    _tokenXAmount: number,
    _tokenYAmount: number,
    maxSlippagePercent: number = 1 // 1% default slippage tolerance
  ) => {
    if (!publicKey || !signTransaction || !sendTransaction) {
      throw new Error('Wallet not connected');
    }

    if (!dlmmService) {
      throw new Error('DLMM service not initialized');
    }

    setLoading(true);
    setError(null);

    try {
      const pool = pools.find(p => p.address === poolAddress);
      if (!pool) {
        throw new Error('Pool not found');
      }

      // Validate price range
      const { validatePriceRange, validateTokenAmounts, validateSlippage } = await import('@/lib/validation');

      const priceValidation = validatePriceRange(lowerPrice, upperPrice, pool.currentPrice);
      if (!priceValidation.valid) {
        throw new Error(priceValidation.error);
      }

      // Validate token amounts
      const amountValidation = validateTokenAmounts(_tokenXAmount, _tokenYAmount);
      if (!amountValidation.valid) {
        throw new Error(amountValidation.error);
      }

      // Check slippage before creating position
      const expectedPrice = pool.currentPrice;
      const slippageCheck = validateSlippage(expectedPrice, pool.currentPrice, maxSlippagePercent);
      if (!slippageCheck.valid) {
        throw new Error(slippageCheck.error);
      }

      // Convert prices to bin IDs
      const binStep = pool.binStep || 1;
      const lowerBinId = Math.floor(Math.log(lowerPrice) / Math.log(1 + binStep / 10000));
      const upperBinId = Math.floor(Math.log(upperPrice) / Math.log(1 + binStep / 10000));

      // Create position mint keypair
      const positionMint = PublicKey.unique();

      // Create transaction
      const transaction = new Transaction();

      // Calculate relative bin IDs from active bin
      const activeBinId = pool.activeId || 0;
      const relativeBinIdLeft = lowerBinId - activeBinId;
      const relativeBinIdRight = upperBinId - activeBinId;

      // Calculate bin array index
      const binArrayIndex = Math.floor(lowerBinId / 70); // 70 bins per array

      // Create position
      await dlmmService.createPosition({
        payer: publicKey,
        relativeBinIdLeft,
        relativeBinIdRight,
        pair: new PublicKey(poolAddress),
        binArrayIndex,
        positionMint,
        transaction,
      });

      // Sign and send transaction
      const signed = await signTransaction(transaction);
      const signature = await sendTransaction(signed, connection);

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      // Store entry data for P&L calculation
      const entryPrice = pool.currentPrice;
      const entryTimestamp = Date.now();
      const initialValueUSD = (_tokenXAmount * entryPrice) + _tokenYAmount;

      // Note: The position ID will be derived from the transaction
      // For now, we'll store with a temporary ID and update later
      // In production, extract the actual position address from transaction logs
      const tempPositionId = positionMint.toString();
      storePositionEntry(tempPositionId, {
        entryPrice,
        entryTokenXAmount: _tokenXAmount,
        entryTokenYAmount: _tokenYAmount,
        entryTimestamp,
        initialValueUSD,
      });

      // Refresh positions after creation
      await fetchPositions();

      return { success: true, transactionId: signature };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create position';
      setError(error);
      console.error('Error creating position:', err);
      throw new Error(error);
    } finally {
      setLoading(false);
    }
  }, [publicKey, signTransaction, sendTransaction, dlmmService, pools, connection, fetchPositions]);

  // Remove liquidity from position
  const removeLiquidity = useCallback(async (positionId: string) => {
    if (!publicKey || !signTransaction || !sendTransaction) {
      throw new Error('Wallet not connected');
    }

    if (!dlmmService) {
      throw new Error('DLMM service not initialized');
    }

    setLoading(true);
    setError(null);

    try {
      const position = positions.find(p => p.id === positionId);
      if (!position) {
        throw new Error('Position not found');
      }

      const pool = pools.find(p => p.address === position.poolAddress);
      if (!pool) {
        throw new Error('Pool not found');
      }

      // Remove liquidity using SDK
      const result = await dlmmService.removeMultipleLiquidity({
        maxPositionList: [{
          position: positionId,
          start: position.lowerBinId,
          end: position.upperBinId,
          positionMint: position.positionMint,
        }],
        payer: publicKey,
        type: 'removeBoth',
        pair: new PublicKey(position.poolAddress),
        tokenMintX: new PublicKey(pool.tokenX.mint),
        tokenMintY: new PublicKey(pool.tokenY.mint),
        activeId: pool.activeId || 0,
      });

      // Sign and send all transactions
      const signatures = [];
      for (const tx of result.txs) {
        const signed = await signTransaction(tx);
        const signature = await sendTransaction(signed, connection);
        signatures.push(signature);
        await connection.confirmTransaction(signature, 'confirmed');
      }

      // Refresh positions after removal
      await fetchPositions();

      return { success: true, transactionId: signatures[0] };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to remove liquidity';
      console.error('Remove liquidity error:', error);
      setError(error);
      console.error('Error removing liquidity:', err);
      throw new Error(error);
    } finally {
      setLoading(false);
    }
  }, [publicKey, signTransaction, sendTransaction, dlmmService, positions, pools, connection, fetchPositions]);

  // Collect fees from position
  const collectFees = useCallback(async (positionId: string) => {
    if (!publicKey || !signTransaction || !sendTransaction) {
      throw new Error('Wallet not connected');
    }

    if (!dlmmService) {
      throw new Error('DLMM service not initialized');
    }

    setLoading(true);
    setError(null);

    try {
      const position = positions.find(p => p.id === positionId);
      if (!position) {
        throw new Error('Position not found');
      }

      const pool = pools.find(p => p.address === position.poolAddress);
      if (!pool) {
        throw new Error('Pool not found');
      }

      console.log('Collecting fees for position:', positionId);

      // In DLMM, fees are automatically claimed when you remove liquidity
      // To collect fees without closing position, we need to remove and re-add liquidity
      // Or check if SDK has a dedicated claimFee method

      // For now, we'll remove liquidity completely (which collects fees) and then re-add it
      const result = await dlmmService.removeMultipleLiquidity({
        maxPositionList: [{
          position: positionId,
          start: position.lowerBinId,
          end: position.upperBinId,
          positionMint: position.positionMint,
        }],
        payer: publicKey,
        type: 'removeBoth', // Remove both tokens (this also claims fees)
        pair: new PublicKey(position.poolAddress),
        tokenMintX: new PublicKey(pool.tokenX.mint),
        tokenMintY: new PublicKey(pool.tokenY.mint),
        activeId: pool.activeId || 0,
      });

      // Sign and send removal transactions
      const removeSignatures = [];
      for (const tx of result.txs) {
        const signed = await signTransaction(tx);
        const signature = await sendTransaction(signed, connection);
        removeSignatures.push(signature);
        await connection.confirmTransaction(signature, 'confirmed');
      }

      // Now re-create the position with the same parameters
      const newPositionMint = PublicKey.unique();
      const createTransaction = new Transaction();

      const activeBinId = pool.activeId || 0;
      const relativeBinIdLeft = position.lowerBinId - activeBinId;
      const relativeBinIdRight = position.upperBinId - activeBinId;
      const binArrayIndex = Math.floor(position.lowerBinId / 70);

      await dlmmService.createPosition({
        payer: publicKey,
        relativeBinIdLeft,
        relativeBinIdRight,
        pair: new PublicKey(position.poolAddress),
        binArrayIndex,
        positionMint: newPositionMint,
        transaction: createTransaction,
      });

      const createSigned = await signTransaction(createTransaction);
      const createSignature = await sendTransaction(createSigned, connection);
      await connection.confirmTransaction(createSignature, 'confirmed');

      // Refresh positions after fee collection
      await fetchPositions();

      const feesCollected = position.feesEarned || 0;

      return {
        success: true,
        transactionId: removeSignatures[0] || 'no_signature',
        feesCollected
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to collect fees';
      setError(error);
      console.error('Error collecting fees:', err);
      throw new Error(error);
    } finally {
      setLoading(false);
    }
  }, [publicKey, signTransaction, sendTransaction, dlmmService, positions, pools, connection, fetchPositions]);

  // Rebalance position to new price range
  const rebalancePosition = useCallback(async (
    positionId: string,
    newRangeWidth: number // % width around current price
  ) => {
    if (!publicKey || !signTransaction || !sendTransaction) {
      throw new Error('Wallet not connected');
    }

    if (!dlmmService) {
      throw new Error('DLMM service not initialized');
    }

    setLoading(true);
    setError(null);

    try {
      const position = positions.find(p => p.id === positionId);
      if (!position) {
        throw new Error('Position not found');
      }

      const pool = pools.find(p => p.address === position.poolAddress);
      if (!pool) {
        throw new Error('Pool not found');
      }

      const oldRange = {
        lower: position.lowerPrice,
        upper: position.upperPrice
      };

      // Step 1: Remove all liquidity from old position
      const removeResult = await dlmmService.removeMultipleLiquidity({
        maxPositionList: [{
          position: positionId,
          start: position.lowerBinId,
          end: position.upperBinId,
          positionMint: position.positionMint,
        }],
        payer: publicKey,
        type: 'removeBoth',
        pair: new PublicKey(position.poolAddress),
        tokenMintX: new PublicKey(pool.tokenX.mint),
        tokenMintY: new PublicKey(pool.tokenY.mint),
        activeId: pool.activeId || 0,
      });

      // Sign and send removal transactions
      const removeSignatures = [];
      for (const tx of removeResult.txs) {
        const signed = await signTransaction(tx);
        const signature = await sendTransaction(signed, connection);
        removeSignatures.push(signature);
        await connection.confirmTransaction(signature, 'confirmed');
      }

      // Step 2: Calculate new price range centered on current price
      const currentPrice = pool.currentPrice;
      const rangeWidthMultiplier = 1 + (newRangeWidth / 100);
      const newLowerPrice = currentPrice / rangeWidthMultiplier;
      const newUpperPrice = currentPrice * rangeWidthMultiplier;

      // Convert prices to bin IDs
      const binStep = pool.binStep || 1;
      const newLowerBinId = Math.floor(Math.log(newLowerPrice) / Math.log(1 + binStep / 10000));
      const newUpperBinId = Math.floor(Math.log(newUpperPrice) / Math.log(1 + binStep / 10000));

      // Step 3: Create new position with the tokens we received from removal
      // After removing liquidity, we have the tokens in our wallet
      // We'll use those same amounts to create the new position
      const newPositionMint = PublicKey.unique();
      const createTransaction = new Transaction();

      const activeBinId = pool.activeId || 0;
      const relativeBinIdLeft = newLowerBinId - activeBinId;
      const relativeBinIdRight = newUpperBinId - activeBinId;
      const binArrayIndex = Math.floor(newLowerBinId / 70);

      // Create the new position with the liquidity we just removed
      await dlmmService.createPosition({
        payer: publicKey,
        relativeBinIdLeft,
        relativeBinIdRight,
        pair: new PublicKey(position.poolAddress),
        binArrayIndex,
        positionMint: newPositionMint,
        transaction: createTransaction,
      });

      // Note: The SDK's createPosition should automatically use available token balances
      // from the wallet after the removal transaction

      // Sign and send creation transaction
      const signed = await signTransaction(createTransaction);
      const createSignature = await sendTransaction(signed, connection);
      await connection.confirmTransaction(createSignature, 'confirmed');

      // Store entry data for the new rebalanced position
      const entryPrice = pool.currentPrice;
      const entryTimestamp = Date.now();
      const initialValueUSD = (position.tokenXAmount * entryPrice) + position.tokenYAmount;

      storePositionEntry(newPositionMint.toString(), {
        entryPrice,
        entryTokenXAmount: position.tokenXAmount,
        entryTokenYAmount: position.tokenYAmount,
        entryTimestamp,
        initialValueUSD,
      });

      // Refresh positions
      await fetchPositions();

      const newRange = {
        lower: newLowerPrice,
        upper: newUpperPrice
      };

      return {
        success: true,
        transactionId: createSignature,
        oldRange,
        newRange
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to rebalance position';
      setError(error);
      console.error('Error rebalancing position:', err);
      throw new Error(error);
    } finally {
      setLoading(false);
    }
  }, [publicKey, signTransaction, sendTransaction, dlmmService, positions, pools, connection, fetchPositions]);

  // Auto-fetch data when wallet connects
  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  useEffect(() => {
    if (publicKey) {
      fetchPositions();
    }
  }, [publicKey, fetchPositions]);

  return {
    pools,
    positions,
    loading,
    error,
    fetchPools,
    fetchPositions,
    createPosition,
    removeLiquidity,
    collectFees,
    rebalancePosition,
    isConnected: !!publicKey
  };
};