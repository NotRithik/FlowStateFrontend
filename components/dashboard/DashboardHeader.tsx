import React from 'react';
import { SwissCard, SwissBadge } from '../PixelComponents';
import { Stream } from '../../types';
import { Activity, Wallet } from 'lucide-react';

interface DashboardHeaderProps {
    activeStream: Stream;
    simulatedEarnings: number;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ activeStream, simulatedEarnings }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">

            {/* Main Status Card */}
            <div className="md:col-span-8">
                <SwissCard className="h-full relative overflow-hidden flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h3 className="font-sans font-bold text-gray-400 uppercase text-xs tracking-widest mb-2">Active Stream Source</h3>
                            <div className="flex items-center gap-4">
                                <img src={activeStream.avatarUrl} className="w-12 h-12 grayscale" alt="Sender" />
                                <div>
                                    <h2 className="text-3xl font-serif italic mb-1">{activeStream.sender}</h2>
                                    <div className="flex gap-2">
                                        <SwissBadge color="bg-black text-white">Sablier</SwissBadge>
                                        <SwissBadge>{activeStream.id}</SwissBadge>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <h3 className="font-sans font-bold text-gray-400 uppercase text-xs tracking-widest mb-2">Total Value</h3>
                            <div className="text-4xl font-sans font-black">${activeStream.totalAmount.toLocaleString()}</div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative mt-auto">
                        <div className="flex justify-between text-xs font-sans font-bold mb-3 uppercase tracking-wider">
                            <span>Withdrawn: ${activeStream.withdrawnAmount.toLocaleString()}</span>
                            <span>Remaining: ${activeStream.remainingAmount.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-8 bg-gray-100 border border-black relative">
                            <div
                                className="h-full bg-black transition-all duration-1000"
                                style={{ width: `${(activeStream.withdrawnAmount / activeStream.totalAmount) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </SwissCard>
            </div>

            {/* Real-time Earnings Card - Fixed 'empty' appearance by ensuring contrasting background (Simulated) */}
            <div className="md:col-span-4">
                <SwissCard className="h-full bg-swiss-red text-white border-black relative overflow-hidden group">

                    {/* Decorative background circle */}
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>

                    <div className="flex flex-col h-full justify-between relative z-10">
                        <div>
                            <h3 className="font-sans font-bold uppercase text-xs text-white/70 tracking-widest mb-4">Unrealized Yield</h3>
                            <div className="text-5xl font-sans font-black tracking-tighter">
                                ${simulatedEarnings.toFixed(4)}
                            </div>
                        </div>

                        <div className="mt-8 border-t border-white/20 pt-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity size={16} />
                                <span className="font-sans font-bold text-sm">Live Aqua0 Feed</span>
                            </div>
                            <div className="text-xs font-sans opacity-60">
                                Syncing with Base RPC...
                            </div>
                        </div>
                    </div>
                </SwissCard>
            </div>
        </div>
    );
};
