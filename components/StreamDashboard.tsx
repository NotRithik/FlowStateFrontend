import React, { useState, useEffect } from 'react';
import { Stream, StrategyType } from '../types';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { PerformanceChart } from './dashboard/PerformanceChart';
import { StrategyControl } from './dashboard/StrategyControl';
import { PoolSelection } from './dashboard/PoolSelection';

// Mock Data
const MOCK_STREAM: Stream = {
  id: 'str-0x123...89',
  sender: '0xOrganizationDAO',
  tokenSymbol: 'USDC',
  totalAmount: 120000,
  withdrawnAmount: 45000,
  remainingAmount: 75000,
  startTime: Date.now() - 10000000,
  endTime: Date.now() + 20000000,
  avatarUrl: 'https://picsum.photos/50/50?random=99'
};

export const StreamDashboard: React.FC = () => {
  const [activeStream, setActiveStream] = useState<Stream>(MOCK_STREAM);
  const [simulatedEarnings, setSimulatedEarnings] = useState(124.50);
  const [currentStrategy, setCurrentStrategy] = useState<StrategyType>('LP');

  // Simulate live earnings ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedEarnings(prev => prev + 0.0001);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-off-white min-h-screen pb-20 pt-28 px-4">
      <div className="container mx-auto max-w-6xl">

        {/* Header Dashboard Area */}
        <DashboardHeader activeStream={activeStream} simulatedEarnings={simulatedEarnings} />

        {/* Charts & Strategy Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <PerformanceChart />
          <StrategyControl currentStrategy={currentStrategy} setStrategy={setCurrentStrategy} />
        </div>

        {/* Pool Selection - Only visible for LP Strategy */}
        {currentStrategy === 'LP' && <PoolSelection />}

      </div>
    </div>
  );
};