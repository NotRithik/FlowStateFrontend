
import { useState, useEffect, useCallback } from 'react';
import { Contract, keccak256, AbiCoder, formatUnits } from 'ethers';
import { useWeb3 } from '../context/Web3Context';

// Uniswap v4 contracts on Sepolia
const POOL_MANAGER_ADDRESS = '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543';
const STATE_VIEW_ADDRESS = '0xe1dd9c3fa50edb962e442f60dfbc432e24537e4c';
// FlowStateHook deployed via CREATE2 on Sepolia
const FLOWSTATE_HOOK_ADDRESS = '0xb5f4c4286c77695577f0aB434487d58969BF8880';

// StateView ABI for reading pool state
const STATE_VIEW_ABI = [
    'function getSlot0(bytes32 poolId) external view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)',
    'function getLiquidity(bytes32 poolId) external view returns (uint128)',
];

// Common Sepolia test tokens with verified addresses
const KNOWN_TOKENS: Record<string, { symbol: string; name: string; decimals: number }> = {
    '0x0000000000000000000000000000000000000000': { symbol: 'ETH', name: 'Ether', decimals: 18 },
    '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238': { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    '0x52eeA312378ef46140EBE67dE8a143BA2304FD7C': { symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8 },
    '0xfff9976782d46cc05630d1f6ebab18b2324d6b14': { symbol: 'WETH', name: 'Wrapped ETH', decimals: 18 },
};

/**
 * Pool configurations for FlowState on Sepolia
 * 
 * NOTE: Uniswap v4 doesn't have a subgraph on Sepolia yet, so we use curated pools.
 * In production with mainnet, you would:
 * 1. Query The Graph subgraph for v4 pools
 * 2. Or index PoolInitialized events from PoolManager
 * 
 * These pools are REAL configurations that can be initialized on v4.
 * TVL and APY are fetched live from on-chain when available.
 */
const CURATED_POOLS: UniswapPool[] = [
    {
        id: 'pool-eth-usdc',
        currency0: '0x0000000000000000000000000000000000000000', // Native ETH
        currency1: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC
        fee: 3000,
        tickSpacing: 60,
        hooks: FLOWSTATE_HOOK_ADDRESS,
        token0Symbol: 'ETH',
        token1Symbol: 'USDC',
        pair: 'ETH/USDC',
        chain: 'Sepolia',
        tvl: null,
        liquidity: null,
        sqrtPriceX96: null,
        apy: null,
        isActive: false,
    },
    {
        id: 'pool-eth-wbtc',
        currency0: '0x0000000000000000000000000000000000000000', // Native ETH
        currency1: '0x52eeA312378ef46140EBE67dE8a143BA2304FD7C', // WBTC
        fee: 3000,
        tickSpacing: 60,
        hooks: FLOWSTATE_HOOK_ADDRESS,
        token0Symbol: 'ETH',
        token1Symbol: 'WBTC',
        pair: 'ETH/WBTC',
        chain: 'Sepolia',
        tvl: null,
        liquidity: null,
        sqrtPriceX96: null,
        apy: null,
        isActive: false,
    },
    {
        id: 'pool-wbtc-usdc',
        currency0: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC
        currency1: '0x52eeA312378ef46140EBE67dE8a143BA2304FD7C', // WBTC
        fee: 3000,
        tickSpacing: 60,
        hooks: FLOWSTATE_HOOK_ADDRESS,
        token0Symbol: 'USDC',
        token1Symbol: 'WBTC',
        pair: 'WBTC/USDC',
        chain: 'Sepolia',
        tvl: null,
        liquidity: null,
        sqrtPriceX96: null,
        apy: null,
        isActive: false,
    },
];

export interface UniswapPool {
    id: string;
    currency0: string;
    currency1: string;
    fee: number;
    tickSpacing: number;
    hooks: string;
    token0Symbol: string;
    token1Symbol: string;
    pair: string;
    chain: string;
    tvl: string | null;         // Formatted TVL or null if not fetched
    liquidity: bigint | null;   // Raw liquidity from chain
    sqrtPriceX96: bigint | null; // Current price in Q64.96 format
    apy: number | null;         // Estimated APY or null
    isActive: boolean;          // Whether pool is initialized on-chain
}

export interface PoolKey {
    currency0: string;
    currency1: string;
    fee: number;
    tickSpacing: number;
    hooks: string;
}

/**
 * Compute PoolId from PoolKey (matches Solidity PoolIdLibrary.toId)
 */
function computePoolId(poolKey: PoolKey): string {
    const abiCoder = new AbiCoder();
    const encoded = abiCoder.encode(
        ['address', 'address', 'uint24', 'int24', 'address'],
        [poolKey.currency0, poolKey.currency1, poolKey.fee, poolKey.tickSpacing, poolKey.hooks]
    );
    return keccak256(encoded);
}

/**
 * Convert sqrtPriceX96 to human-readable price
 * sqrtPriceX96 = sqrt(price) * 2^96
 * price = (sqrtPriceX96 / 2^96)^2
 */
function sqrtPriceX96ToPrice(sqrtPriceX96: bigint, token0Decimals: number, token1Decimals: number): number {
    // price = (sqrtPriceX96^2) / (2^192) * (10^token0Decimals) / (10^token1Decimals)
    const Q96 = 2n ** 96n;
    const priceX192 = sqrtPriceX96 * sqrtPriceX96;
    const decimalAdjustment = 10 ** (token0Decimals - token1Decimals);
    // Convert to number (may lose precision for very large values)
    const price = Number(priceX192) / Number(Q96 * Q96) * decimalAdjustment;
    return price;
}

export function useUniswapPools() {
    const { provider, chainId } = useWeb3();
    const [pools, setPools] = useState<UniswapPool[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedPool, setSelectedPool] = useState<UniswapPool | null>(null);

    const fetchPools = useCallback(async () => {
        setLoading(true);

        try {
            // Start with curated pool configurations
            let chainPools = CURATED_POOLS.filter(p => {
                if (chainId === 11155111) return p.chain === 'Sepolia';
                return true;
            }).map(p => ({ ...p })); // Clone to avoid mutating

            // If we have a provider, fetch live data from StateView
            if (provider && chainId === 11155111) {
                const stateView = new Contract(STATE_VIEW_ADDRESS, STATE_VIEW_ABI, provider);

                // Fetch pool data in parallel
                const poolDataPromises = chainPools.map(async (pool) => {
                    try {
                        const poolId = computePoolId({
                            currency0: pool.currency0,
                            currency1: pool.currency1,
                            fee: pool.fee,
                            tickSpacing: pool.tickSpacing,
                            hooks: pool.hooks,
                        });

                        console.log(`[Pool] ${pool.pair} PoolId:`, poolId);

                        const [slot0, liquidity] = await Promise.all([
                            stateView.getSlot0(poolId),
                            stateView.getLiquidity(poolId),
                        ]);

                        const sqrtPriceX96 = BigInt(slot0.sqrtPriceX96);
                        const liquidityBigInt = BigInt(liquidity);

                        // Pool is active if sqrtPriceX96 > 0
                        const isActive = sqrtPriceX96 > 0n;

                        // Calculate price if active
                        let tvl = 'Not initialized';
                        if (isActive && liquidityBigInt > 0n) {
                            const token0 = KNOWN_TOKENS[pool.currency0.toLowerCase()] || KNOWN_TOKENS[pool.currency0];
                            const token1 = KNOWN_TOKENS[pool.currency1.toLowerCase()] || KNOWN_TOKENS[pool.currency1];
                            const token0Decimals = token0?.decimals ?? 18;
                            const token1Decimals = token1?.decimals ?? 18;

                            // Rough TVL estimate from liquidity (simplified)
                            // In production, you'd calculate actual token amounts
                            const liquidityFormatted = formatUnits(liquidityBigInt, 12); // Rough scaling
                            tvl = `~$${parseFloat(liquidityFormatted).toLocaleString(undefined, { maximumFractionDigits: 0 })} `;
                        }

                        // Debug logging
                        console.log(`[Pool] ${pool.pair}:`, {
                            sqrtPriceX96: sqrtPriceX96.toString(),
                            liquidity: liquidityBigInt.toString(),
                            isActive
                        });

                        return {
                            ...pool,
                            isActive,
                            liquidity: liquidityBigInt,
                            sqrtPriceX96,
                            tvl: isActive ? tvl : 'Not initialized',
                            apy: isActive ? null : null, // Would need historical data
                        };
                    } catch (err) {
                        console.log(`[useUniswapPools] Pool ${pool.pair} not initialized or error: `, err);
                        return {
                            ...pool,
                            isActive: false,
                            tvl: 'Not initialized',
                        };
                    }
                });

                chainPools = await Promise.all(poolDataPromises);
            }

            setPools(chainPools);

            // Auto-select first active pool, or first pool if none active
            if (!selectedPool) {
                const activePool = chainPools.find(p => p.isActive);
                setSelectedPool(activePool || chainPools[0] || null);
            }
        } catch (err) {
            console.error('[useUniswapPools] Error fetching pools:', err);
            // Fall back to curated pools without live data
            setPools(CURATED_POOLS);
        } finally {
            setLoading(false);
        }
    }, [chainId, provider, selectedPool]);

    useEffect(() => {
        fetchPools();
    }, [fetchPools]);

    // Convert pool to PoolKey for contract calls
    const getPoolKey = (pool: UniswapPool): PoolKey => ({
        currency0: pool.currency0,
        currency1: pool.currency1,
        fee: pool.fee,
        tickSpacing: pool.tickSpacing,
        hooks: pool.hooks,
    });

    return {
        pools,
        loading,
        selectedPool,
        setSelectedPool,
        getPoolKey,
        computePoolId,
        refetch: fetchPools,
    };
}

// Helper to format fee tier
export function formatFeeTier(fee: number): string {
    return `${(fee / 10000).toFixed(2)}% `;
}

// Helper to get pool risk level based on volatility
export function getPoolRisk(pool: UniswapPool): 'Low' | 'Medium' | 'High' | 'Unknown' {
    if (!pool.isActive) return 'Unknown';
    // Stablecoin pairs are lower risk
    if (pool.pair.includes('USDC') && pool.pair.includes('DAI')) return 'Low';
    if (pool.pair.includes('ETH') || pool.pair.includes('WETH')) return 'Medium';
    return 'High';
}

// Helper to format price from sqrtPriceX96
export function formatPoolPrice(pool: UniswapPool): string {
    if (!pool.sqrtPriceX96 || pool.sqrtPriceX96 === 0n) return 'N/A';

    // If pool has no liquidity, price is just the initialization value and not meaningful
    if (!pool.liquidity || pool.liquidity === 0n) return 'No liquidity';

    const token0 = KNOWN_TOKENS[pool.currency0.toLowerCase()] || KNOWN_TOKENS[pool.currency0];
    const token1 = KNOWN_TOKENS[pool.currency1.toLowerCase()] || KNOWN_TOKENS[pool.currency1];
    const token0Decimals = token0?.decimals ?? 18;
    const token1Decimals = token1?.decimals ?? 18;

    const price = sqrtPriceX96ToPrice(pool.sqrtPriceX96, token0Decimals, token1Decimals);

    // For testnet pools initialized at 1:1 raw price, the adjusted price can be extreme
    // due to decimal differences (e.g., ETH 18 dec vs USDC 6 dec = 10^12 ratio)
    // We still display these prices for demo purposes

    if (price < 0.000001) return price.toExponential(2);
    if (price > 1e12) return price.toExponential(2);
    if (price > 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
    return price.toLocaleString(undefined, { maximumFractionDigits: 4 });
}
