import React, { useState } from 'react';
import { SwissCard, SwissButton, SwissBadge } from '../PixelComponents';
import { StrategyType } from '../../types';
import { SablierStream } from '../../hooks/useSablierStreams';
import { UniswapPool } from '../../hooks/useUniswapPools';
import { useWeb3 } from '../../context/Web3Context';
import { ArrowLeftRight, Layers, Zap, Clock, Loader2, Check, AlertCircle } from 'lucide-react';

// Common Sepolia tokens for accumulate strategy
const ACCUMULATE_TOKENS = [
    { symbol: 'WETH', name: 'Wrapped Ether', address: '0xfff9976782d46cc05630d1f6ebab18b2324d6b14' },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x29f2D40B0605204364af54EC677bD022dA425d03' },
    { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06' },
];

interface StrategyControlProps {
    currentStrategy: StrategyType;
    setStrategy: (s: StrategyType) => void;
    selectedStream: SablierStream | null;
    selectedPool: UniswapPool | null;
}

export const StrategyControl: React.FC<StrategyControlProps> = ({
    currentStrategy,
    setStrategy,
    selectedStream,
    selectedPool
}) => {
    const { account, signIntent, submitIntentToBackend, approveSablierOperator, checkSablierApproval } = useWeb3();

    const [selectedToken, setSelectedToken] = useState<typeof ACCUMULATE_TOKENS[0] | null>(null);
    const [salaryDiversion, setSalaryDiversion] = useState(25);
    const [batchSize, setBatchSize] = useState(5);
    const [executionInterval, setExecutionInterval] = useState(50); // ~10 mins
    const [isApproved, setIsApproved] = useState<boolean | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Check approval status on mount
    React.useEffect(() => {
        const checkApproval = async () => {
            const approved = await checkSablierApproval();
            setIsApproved(approved);
        };
        if (account) checkApproval();
    }, [account, checkSablierApproval]);

    const handleApprove = async () => {
        setIsSubmitting(true);
        try {
            const success = await approveSablierOperator();
            setIsApproved(success);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateStrategy = async () => {
        if (!selectedStream || !selectedPool || !account) return;

        setIsSubmitting(true);
        setSubmitStatus('idle');

        try {
            // First ensure approved
            if (!isApproved) {
                const approved = await approveSablierOperator();
                if (!approved) throw new Error('Approval failed');
                setIsApproved(true);
            }

            // Get current block for intent window
            const provider = (window as any).ethereum;
            const web3Provider = new (await import('ethers')).BrowserProvider(provider);
            const currentBlockNumber = await web3Provider.getBlockNumber();
            const startBlock = BigInt(currentBlockNumber);

            // Generate batch
            let successCount = 0;
            const baseNonce = BigInt(Date.now());

            for (let i = 0; i < batchSize; i++) {
                // Determine block window for this execution
                // Execution i starts at: current + (i * interval)
                const minBlock = startBlock + BigInt(i * executionInterval);
                // Window stays open for interval duration (or slightly longer)
                const maxBlock = minBlock + BigInt(executionInterval + 100);

                // Create intent
                const intent = {
                    user: account,
                    streamId: BigInt(selectedStream.id),
                    amount: 0n, // 0 = withdrawMax
                    minBlock: minBlock,
                    maxBlock: maxBlock,
                    nonce: baseNonce + BigInt(i), // Unique nonce
                    isSwap: currentStrategy === 'SWAP',
                    targetPool: {
                        currency0: selectedPool.currency0,
                        currency1: selectedPool.currency1,
                        fee: selectedPool.fee,
                        tickSpacing: selectedPool.tickSpacing,
                        hooks: selectedPool.hooks,
                    }
                };

                // Sign the intent
                // Note: User will be prompted to sign N times. 
                // In future v2, we can use a session key or batch sign EIP-712 if supported.
                const signature = await signIntent(intent);

                // Submit to backend
                const success = await submitIntentToBackend(intent, signature);
                if (success) successCount++;
            }

            if (successCount === batchSize) {
                setSubmitStatus('success');
            } else {
                throw new Error(`Only ${successCount}/${batchSize} submitted`);
            }
        } catch (error) {
            console.error('Strategy update failed:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const canSubmit = selectedStream && selectedPool && account;

    return (
        <div className="flex flex-col gap-8 h-full">
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
                                Auto-Bridge & Deposit. Withdraw from Sablier and provide liquidity to{' '}
                                <span className="font-bold text-black">{selectedPool?.pair || 'selected pool'}</span> on Uniswap v4.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="mb-8">
                        <h4 className="font-sans font-bold text-xs uppercase tracking-widest text-gray-400 mb-3">Select Asset to Accumulate</h4>
                        <div className="grid grid-cols-1 gap-2">
                            {ACCUMULATE_TOKENS.map(token => (
                                <div
                                    key={token.symbol}
                                    onClick={() => setSelectedToken(token)}
                                    className={`p-3 border ${selectedToken?.symbol === token.symbol ? 'bg-swiss-red text-white border-black' : 'bg-white border-gray-200 hover:border-black'} cursor-pointer flex justify-between items-center transition-all`}
                                >
                                    <div className="font-sans font-bold">{token.symbol}</div>
                                    <div className="font-mono text-xs opacity-70">{token.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Salary Diversion & Frequency */}
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

                    {/* Batch Execution Controls */}
                    <div className="space-y-4 mb-8">
                        <h4 className="font-sans font-bold text-xs uppercase tracking-widest text-gray-400">Batch Configuration</h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold mb-1">Number of Executions</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={batchSize}
                                    onChange={(e) => setBatchSize(parseInt(e.target.value))}
                                    className="w-full p-2 border border-gray-200 focus:border-black outline-none font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1">Interval (Blocks)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={executionInterval}
                                    onChange={(e) => setExecutionInterval(parseInt(e.target.value))}
                                    className="w-full p-2 border border-gray-200 focus:border-black outline-none font-mono text-sm"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">~{Math.round(executionInterval * 12 / 60)} mins</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Approval Status */}
            {isApproved === false && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-sm">
                    <AlertCircle size={14} className="inline mr-2 text-yellow-600" />
                    You need to approve FlowState to withdraw from your Sablier stream.
                </div>
            )}

            {/* Submit Status */}
            {submitStatus === 'success' && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-sm text-green-700">
                    <Check size={14} className="inline mr-2" />
                    Strategy submitted! Relayer will execute when conditions are met.
                </div>
            )}
            {submitStatus === 'error' && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-sm text-red-700">
                    <AlertCircle size={14} className="inline mr-2" />
                    Failed to submit strategy. Please try again.
                </div>
            )}

            <SwissButton
                className="w-full mt-auto"
                variant="primary"
                onClick={isApproved ? handleUpdateStrategy : handleApprove}
                disabled={isSubmitting || !canSubmit}
            >
                {isSubmitting ? (
                    <>
                        <Loader2 size={16} className="mr-2 inline animate-spin" />
                        {isApproved ? `Signing Batch (${batchSize})...` : 'Approving...'}
                    </>
                ) : isApproved ? (
                    <>
                        Execute Batch ({batchSize} Tx)
                        <Zap size={16} className="ml-2 inline" />
                    </>
                ) : (
                    'Approve FlowState'
                )}
            </SwissButton>
        </div>
    );
};
