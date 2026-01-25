import React from 'react';
import { Pool } from '../../types';
import { SwissButton, SectionTitle } from '../PixelComponents';

const MOCK_POOLS: Pool[] = [
    { id: '1', pair: 'USDC/ETH', chain: 'Base', apy: 12.4, tvl: '$4.2M', risk: 'Medium' },
    { id: '2', pair: 'USDC/OP', chain: 'Optimism', apy: 18.2, tvl: '$1.1M', risk: 'High' },
    { id: '3', pair: 'USDC/DAI', chain: 'WorldChain', apy: 5.1, tvl: '$12.5M', risk: 'Low' },
];

export const PoolSelection: React.FC = () => {
    return (
        <>
            <SectionTitle subtitle="Available Opportunities">Allocation</SectionTitle>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {MOCK_POOLS.map((pool) => (
                    <div key={pool.id} className="relative group cursor-pointer">
                        <div className="relative bg-white border border-black p-8 h-full flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="font-bold font-sans text-2xl">{pool.pair}</div>
                                    <span className={`w-2 h-2 rounded-full ${pool.risk === 'Low' ? 'bg-green-500' :
                                        pool.risk === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}></span>
                                </div>
                                <div className="mb-8 space-y-3">
                                    <div className="flex justify-between text-sm font-sans text-gray-500">
                                        <span>Chain</span>
                                        <span className="font-bold text-black">{pool.chain}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-sans text-gray-500">
                                        <span>TVL</span>
                                        <span className="font-bold text-black">{pool.tvl}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-6 border-t border-gray-100">
                                <div className="text-4xl font-serif italic mb-6">{pool.apy}% <span className="text-xs font-sans not-italic font-bold text-gray-300">APY</span></div>
                                <SwissButton className="w-full" size="sm" variant={pool.id === '1' ? 'secondary' : 'outline'}>
                                    {pool.id === '1' ? 'Active' : 'Select'}
                                </SwissButton>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};
