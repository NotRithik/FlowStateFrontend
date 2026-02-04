import React from 'react';
import { UniswapPool, formatFeeTier, getPoolRisk, formatPoolPrice } from '../../hooks/useUniswapPools';
import { SwissButton, SectionTitle } from '../PixelComponents';
import { Loader2, Check, AlertCircle } from 'lucide-react';

interface PoolSelectionProps {
    pools: UniswapPool[];
    selectedPool: UniswapPool | null;
    onSelectPool: (pool: UniswapPool) => void;
    loading: boolean;
}

export const PoolSelection: React.FC<PoolSelectionProps> = ({
    pools,
    selectedPool,
    onSelectPool,
    loading
}) => {
    if (loading) {
        return (
            <>
                <SectionTitle subtitle="Fetching from Uniswap v4 StateView...">LP Allocation</SectionTitle>
                <div className="flex justify-center py-12">
                    <Loader2 size={32} className="animate-spin text-gray-400" />
                </div>
            </>
        );
    }

    if (pools.length === 0) {
        return (
            <>
                <SectionTitle subtitle="No pools available">LP Allocation</SectionTitle>
                <div className="text-center py-12 text-gray-500">
                    No Uniswap v4 pools found with FlowState hook.
                </div>
            </>
        );
    }

    return (
        <>
            <SectionTitle subtitle="Uniswap v4 Pools on Sepolia (Live Data)">LP Allocation</SectionTitle>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {pools.map((pool) => {
                    const isSelected = selectedPool?.id === pool.id;
                    const risk = getPoolRisk(pool);

                    return (
                        <div
                            key={pool.id}
                            className={`relative group cursor-pointer transition-all ${isSelected ? 'ring-2 ring-swiss-red ring-offset-2' : ''
                                }`}
                            onClick={() => onSelectPool(pool)}
                        >
                            <div className="relative bg-white border border-black p-8 h-full flex flex-col justify-between hover:shadow-lg transition-shadow">
                                {isSelected && (
                                    <div className="absolute top-4 right-4 w-6 h-6 bg-swiss-red rounded-full flex items-center justify-center">
                                        <Check size={14} className="text-white" />
                                    </div>
                                )}

                                {/* Status indicator */}
                                {!pool.isActive && (
                                    <div className="absolute top-4 left-4 flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                        <AlertCircle size={12} />
                                        <span>Not initialized</span>
                                    </div>
                                )}

                                <div>
                                    <div className="flex justify-between items-start mb-6 mt-4">
                                        <div className="font-bold font-sans text-2xl">{pool.pair}</div>
                                        <span className={`w-2 h-2 rounded-full ${pool.isActive
                                                ? (risk === 'Low' ? 'bg-green-500' :
                                                    risk === 'Medium' ? 'bg-yellow-500' : 'bg-red-500')
                                                : 'bg-gray-300'
                                            }`}></span>
                                    </div>
                                    <div className="mb-8 space-y-3">
                                        <div className="flex justify-between text-sm font-sans text-gray-500">
                                            <span>Status</span>
                                            <span className={`font-bold ${pool.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                                                {pool.isActive ? 'Active' : 'Not Initialized'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm font-sans text-gray-500">
                                            <span>Fee Tier</span>
                                            <span className="font-bold text-black">{formatFeeTier(pool.fee)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-sans text-gray-500">
                                            <span>TVL</span>
                                            <span className="font-bold text-black">{pool.tvl || 'N/A'}</span>
                                        </div>
                                        {pool.isActive && pool.sqrtPriceX96 && (
                                            <div className="flex justify-between text-sm font-sans text-gray-500">
                                                <span>Price</span>
                                                <span className="font-bold text-black">{formatPoolPrice(pool)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-auto pt-6 border-t border-gray-100">
                                    <div className="text-4xl font-serif italic mb-6">
                                        {pool.apy !== null ? (
                                            <>{pool.apy}% <span className="text-xs font-sans not-italic font-bold text-gray-300">APY</span></>
                                        ) : (
                                            <span className="text-gray-300 text-lg font-sans not-italic">
                                                {pool.isActive ? 'APY calculating...' : 'Initialize pool first'}
                                            </span>
                                        )}
                                    </div>
                                    <SwissButton
                                        className="w-full"
                                        size="sm"
                                        variant={isSelected ? 'secondary' : 'outline'}
                                        disabled={!pool.isActive}
                                    >
                                        {isSelected ? 'Selected' : pool.isActive ? 'Select' : 'Unavailable'}
                                    </SwissButton>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Info note about testnet pools */}
            <div className="mt-8 text-center text-sm text-gray-400">
                <p>
                    Pool data fetched from Uniswap v4 StateView contract on Sepolia.
                    Initialize pools via PoolManager to enable LP deposits.
                </p>
            </div>
        </>
    );
};
