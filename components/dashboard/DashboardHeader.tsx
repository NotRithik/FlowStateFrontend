import React from 'react';
import { SwissCard, SwissBadge } from '../PixelComponents';
import { SablierStream, StreamStatus, shortenAddress, getStatusLabel } from '../../hooks/useSablierStreams';
import { Activity } from 'lucide-react';

interface DashboardHeaderProps {
    stream: SablierStream;
    simulatedEarnings: number;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ stream, simulatedEarnings }) => {
    const balance = parseFloat(stream.formattedBalance);
    const withdrawable = parseFloat(stream.formattedWithdrawable);
    const total = balance + withdrawable; // Approximate total value
    const progressPercent = total > 0 ? (withdrawable / total) * 100 : 0;

    const statusColor = stream.status === StreamStatus.STREAMING_SOLVENT
        ? 'bg-green-500'
        : stream.status === StreamStatus.VOIDED
            ? 'bg-red-500'
            : 'bg-yellow-500';

    // Format monthly rate properly - stream.monthlyRate is already calculated correctly
    const monthlyRateFormatted = stream.monthlyRate < 0.01
        ? stream.monthlyRate.toFixed(6)
        : stream.monthlyRate.toLocaleString(undefined, { maximumFractionDigits: 2 });

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">

            {/* Main Status Card */}
            <div className="md:col-span-8">
                <SwissCard className="h-full relative overflow-hidden flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h3 className="font-sans font-bold text-gray-400 uppercase text-xs tracking-widest mb-2">Active Stream Source</h3>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-swiss-red to-black rounded-sm flex items-center justify-center text-white font-bold text-xl">
                                    {stream.tokenSymbol.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-3xl font-serif italic mb-1">{shortenAddress(stream.sender)}</h2>
                                    <div className="flex gap-2">
                                        <SwissBadge color="bg-black text-white">Sablier Flow</SwissBadge>
                                        <SwissBadge>Stream #{stream.id}</SwissBadge>
                                        <SwissBadge color={`${statusColor} text-white`}>
                                            {getStatusLabel(stream.status)}
                                        </SwissBadge>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <h3 className="font-sans font-bold text-gray-400 uppercase text-xs tracking-widest mb-2">Withdrawable</h3>
                            <div className="text-4xl font-sans font-black">
                                {parseFloat(stream.formattedWithdrawable).toLocaleString(undefined, { maximumFractionDigits: 2 })} {stream.tokenSymbol}
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative mt-auto">
                        <div className="flex justify-between text-xs font-sans font-bold mb-3 uppercase tracking-wider">
                            <span>Balance: {parseFloat(stream.formattedBalance).toFixed(2)} {stream.tokenSymbol}</span>
                            <span>Rate: {monthlyRateFormatted} {stream.tokenSymbol}/month</span>
                        </div>
                        <div className="w-full h-8 bg-gray-100 border border-black relative">
                            <div
                                className="h-full bg-black transition-all duration-1000"
                                style={{ width: `${Math.min(progressPercent, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </SwissCard>
            </div>

            {/* Real-time Earnings Card */}
            <div className="md:col-span-4">
                <SwissCard className="h-full bg-swiss-red text-white border-black relative overflow-hidden group">

                    {/* Decorative background circle */}
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>

                    <div className="flex flex-col h-full justify-between relative z-10">
                        <div>
                            <h3 className="font-sans font-bold uppercase text-xs text-white/70 tracking-widest mb-4">Accumulated Yield</h3>
                            <div className="text-5xl font-sans font-black tracking-tighter">
                                +{withdrawable.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}
                            </div>
                            <div className="text-sm opacity-70 mt-1">{stream.tokenSymbol}</div>
                        </div>

                        <div className="mt-8 border-t border-white/20 pt-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity size={16} />
                                <span className="font-sans font-bold text-sm">Live FlowState Feed</span>
                            </div>
                            <div className="text-xs font-sans opacity-60">
                                +{stream.monthlyRate.toFixed(4)} {stream.tokenSymbol}/month
                            </div>
                        </div>
                    </div>
                </SwissCard>
            </div>
        </div>
    );
};
