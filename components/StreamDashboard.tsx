import React, { useState, useEffect } from 'react';
import { StrategyType } from '../types';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { PerformanceChart } from './dashboard/PerformanceChart';
import { StrategyControl } from './dashboard/StrategyControl';
import { PoolSelection } from './dashboard/PoolSelection';
import { StreamSelector } from './dashboard/StreamSelector';
import { useSablierStreams, SablierStream, StreamStatus, shortenAddress, getStatusLabel } from '../hooks/useSablierStreams';
import { useUniswapPools, UniswapPool } from '../hooks/useUniswapPools';
import { useWeb3 } from '../context/Web3Context';
import { SwissCard, SwissButton } from './PixelComponents';
import { Loader2, AlertCircle, Wallet } from 'lucide-react';

export const StreamDashboard: React.FC = () => {
  const { account, connectWallet, isConnecting } = useWeb3();
  const { streams, loading: streamsLoading, error: streamsError, refetch: refetchStreams } = useSablierStreams();
  const { pools, selectedPool, setSelectedPool, loading: poolsLoading } = useUniswapPools();

  const [selectedStream, setSelectedStream] = useState<SablierStream | null>(null);
  const [simulatedEarnings, setSimulatedEarnings] = useState(0);
  const [currentStrategy, setCurrentStrategy] = useState<StrategyType>('LP');

  // Auto-select first stream when loaded
  useEffect(() => {
    if (streams.length > 0 && !selectedStream) {
      setSelectedStream(streams[0]);
    }
  }, [streams, selectedStream]);

  // Simulate live earnings ticker based on stream rate
  useEffect(() => {
    if (!selectedStream || selectedStream.status !== StreamStatus.STREAMING_SOLVENT) return;

    const ratePerSecond = Number(selectedStream.formattedRatePerSecond);
    const interval = setInterval(() => {
      setSimulatedEarnings(prev => prev + ratePerSecond * 0.1);
    }, 100);
    return () => clearInterval(interval);
  }, [selectedStream]);

  // Not connected state
  if (!account) {
    return (
      <div className="bg-off-white min-h-screen pb-20 pt-28 px-4">
        <div className="container mx-auto max-w-6xl">
          <SwissCard className="text-center py-20">
            <Wallet size={64} className="mx-auto mb-6 text-gray-300" />
            <h2 className="text-3xl font-serif italic mb-4">Connect Your Wallet</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Connect your wallet to view your Sablier Flow streams and start auto-compounding into Uniswap v4 pools.
            </p>
            <SwissButton onClick={connectWallet} disabled={isConnecting}>
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </SwissButton>
          </SwissCard>
        </div>
      </div>
    );
  }

  // Loading state
  if (streamsLoading) {
    return (
      <div className="bg-off-white min-h-screen pb-20 pt-28 px-4">
        <div className="container mx-auto max-w-6xl">
          <SwissCard className="text-center py-20">
            <Loader2 size={48} className="mx-auto mb-4 animate-spin text-swiss-red" />
            <p className="text-gray-500">Loading your Sablier streams...</p>
          </SwissCard>
        </div>
      </div>
    );
  }

  // Error state
  if (streamsError) {
    return (
      <div className="bg-off-white min-h-screen pb-20 pt-28 px-4">
        <div className="container mx-auto max-w-6xl">
          <SwissCard className="text-center py-20 border-red-500">
            <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2">Failed to Load Streams</h2>
            <p className="text-gray-500 mb-6">{streamsError}</p>
            <SwissButton onClick={refetchStreams}>Retry</SwissButton>
          </SwissCard>
        </div>
      </div>
    );
  }

  // No streams found
  if (streams.length === 0) {
    return (
      <div className="bg-off-white min-h-screen pb-20 pt-28 px-4">
        <div className="container mx-auto max-w-6xl">
          <SwissCard className="text-center py-20">
            <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-3xl font-serif italic mb-4">No Streams Found</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              You don't have any active Sablier Flow streams as recipient on Sepolia.
              Create a stream at <a href="https://app.sablier.com" target="_blank" rel="noopener noreferrer" className="text-swiss-red underline">app.sablier.com</a> to get started.
            </p>
            <div className="flex gap-4 justify-center">
              <SwissButton onClick={refetchStreams} variant="outline">
                Refresh
              </SwissButton>
              <SwissButton onClick={() => window.open('https://app.sablier.com', '_blank')}>
                Create Stream
              </SwissButton>
            </div>
          </SwissCard>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-off-white min-h-screen pb-20 pt-28 px-4">
      <div className="container mx-auto max-w-6xl">

        {/* Stream Selector - always visible when streams exist */}
        {streams.length > 0 && (
          <StreamSelector
            streams={streams}
            selectedStream={selectedStream}
            onSelect={setSelectedStream}
          />
        )}

        {/* Header Dashboard Area */}
        {selectedStream && (
          <DashboardHeader
            stream={selectedStream}
            simulatedEarnings={simulatedEarnings}
          />
        )}

        {/* Charts & Strategy Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <PerformanceChart stream={selectedStream} />
          <StrategyControl
            currentStrategy={currentStrategy}
            setStrategy={setCurrentStrategy}
            selectedStream={selectedStream}
            selectedPool={selectedPool}
          />
        </div>

        {/* Pool Selection - Only visible for LP Strategy */}
        {currentStrategy === 'LP' && (
          <PoolSelection
            pools={pools}
            selectedPool={selectedPool}
            onSelectPool={setSelectedPool}
            loading={poolsLoading}
          />
        )}

      </div>
    </div>
  );
};