import React, { useState } from 'react';
import { SwissCard, SwissButton, SwissBadge } from '../PixelComponents';
import { StrategyType, Token } from '../../types';
import { ArrowLeftRight, Layers, Settings, Zap, Clock } from 'lucide-react';

const MOCK_TOKENS: Token[] = [
    { id: '1', symbol: 'WBTC', name: 'Wrapped Bitcoin', price: 98000 },
    { id: '2', symbol: 'WETH', name: 'Wrapped Ether', price: 3400 },
    { id: '3', symbol: 'SOL', name: 'Solana', price: 145 },
];

interface StrategyControlProps {
    currentStrategy: StrategyType;
    setStrategy: (s: StrategyType) => void;
}

export const StrategyControl: React.FC<StrategyControlProps> = ({ currentStrategy, setStrategy }) => {
    const [selectedToken, setSelectedToken] = useState<Token | null>(null);
    const [salaryDiversion, setSalaryDiversion] = useState(25);
    const [frequency, setFrequency] = useState<'CONTINUOUS' | 'DAILY'>('CONTINUOUS');

    return (
        <div className="flex flex-col gap-8 h-full">
            {/* Removed the border-l-4 that was causing the ugly line */}
            <div className="bg-white border border-black p-8 h-full">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-serif text-2xl">Strategy</h3>
                    <SwissBadge>{currentStrategy === 'LP' ? 'Simple' : 'Advanced'}</SwissBadge>
                </div>

                {/* Strategy Toggles */}
                <div className="flex gap-4 mb-8">
                    <div
                        onClick={() => setStrategy('LP')}
                        className={`cursor-pointer px-4 py-3 border border-black flex-1 flex items-center justify-center gap-2 transition-all ${currentStrategy === 'LP' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
                    >
                        <Layers size={16} />
                        <span className="font-sans font-bold text-[10px] md:text-xs uppercase tracking-wider">Liquidity</span>
                    </div>
                    <div
                        onClick={() => setStrategy('SWAP')}
                        className={`cursor-pointer px-4 py-3 border border-black flex-1 flex items-center justify-center gap-2 transition-all ${currentStrategy === 'SWAP' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
                    >
                        <ArrowLeftRight size={16} />
                        <span className="font-sans font-bold text-[10px] md:text-xs uppercase tracking-wider">Accumulate</span>
                    </div>
                </div>

                {/* Strategy Specific Controls */}
                {currentStrategy === 'LP' ? (
                    <div className="mb-8 p-4 bg-gray-50 border border-black/10">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-8 h-8 rounded-full bg-swiss-red flex items-center justify-center text-white shrink-0">
                                <Zap size={16} />
                            </div>
                            <p className="font-sans text-sm text-gray-600 leading-relaxed">
                                Auto-Bridge & Deposit. Every <span className="font-bold text-black">750 USDC</span> unlocked is bridged to Base chain and deposited into Aqua0.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="mb-8">
                        <h4 className="font-sans font-bold text-xs uppercase tracking-widest text-gray-400 mb-3">Select Asset</h4>
                        <div className="grid grid-cols-1 gap-2">
                            {MOCK_TOKENS.map(token => (
                                <div
                                    key={token.id}
                                    onClick={() => setSelectedToken(token)}
                                    className={`p-3 border ${selectedToken?.id === token.id ? 'bg-swiss-red text-white border-black' : 'bg-white border-gray-200 hover:border-black'} cursor-pointer flex justify-between items-center transition-all`}
                                >
                                    <div className="font-sans font-bold">{token.symbol}</div>
                                    <div className="font-mono text-xs opacity-70">${token.price.toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* New Features: Salary Diversion & Frequency */}
                <div className="space-y-8 mb-8">

                    {/* Salary Diversion Slider */}
                    <div>
                        <div className="flex justify-between items-end mb-4">
                            <h4 className="font-sans font-bold text-xs uppercase tracking-widest text-gray-400">Salary Diversion</h4>
                            <span className="font-serif italic text-2xl text-swiss-red">{salaryDiversion}%</span>
                        </div>
                        <div className="relative w-full h-2 bg-gray-200 cursor-pointer group">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={salaryDiversion}
                                onChange={(e) => setSalaryDiversion(parseInt(e.target.value))}
                                className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div
                                className="absolute h-full bg-black transition-all group-hover:bg-swiss-red"
                                style={{ width: `${salaryDiversion}%` }}
                            ></div>
                            <div
                                className="absolute h-4 w-4 bg-black top-1/2 -translate-y-1/2 -ml-2 border border-white transition-all group-hover:scale-125"
                                style={{ left: `${salaryDiversion}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Execution Frequency */}
                    <div>
                        <h4 className="font-sans font-bold text-xs uppercase tracking-widest text-gray-400 mb-4">Execution Frequency</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div
                                onClick={() => setFrequency('CONTINUOUS')}
                                className={`p-3 border cursor-pointer transition-all ${frequency === 'CONTINUOUS' ? 'border-swiss-red bg-swiss-red/5' : 'border-gray-200 hover:border-black'}`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Zap size={12} className={frequency === 'CONTINUOUS' ? 'text-swiss-red' : 'text-gray-400'} />
                                    <span className="font-sans font-bold text-xs">Continuous</span>
                                </div>
                                <p className="text-[10px] text-gray-500 leading-tight">Every block. Max efficiency.</p>
                            </div>

                            <div
                                onClick={() => setFrequency('DAILY')}
                                className={`p-3 border cursor-pointer transition-all ${frequency === 'DAILY' ? 'border-swiss-red bg-swiss-red/5' : 'border-gray-200 hover:border-black'}`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Clock size={12} className={frequency === 'DAILY' ? 'text-swiss-red' : 'text-gray-400'} />
                                    <span className="font-sans font-bold text-xs">Daily Batch</span>
                                </div>
                                <p className="text-[10px] text-gray-500 leading-tight">Once/day. Gas optimized.</p>
                            </div>
                        </div>
                    </div>

                </div>

                <SwissButton className="w-full mt-auto" variant="primary">
                    Update Strategy
                    <Zap size={16} className="ml-2 inline" />
                </SwissButton>
            </div>
        </div>
    );
};
