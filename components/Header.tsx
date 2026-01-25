import React from 'react';
import { AppView } from '../types';
import { SwissButton } from './PixelComponents';
import { useWeb3 } from '../context/Web3Context';

interface HeaderProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, setView }) => {
  const { account, connectWallet, isConnecting } = useWeb3();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-off-white/90 backdrop-blur-sm border-b border-black">
      <div className="container mx-auto px-6 py-5 flex justify-between items-center">
        {/* Logo Area */}
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => setView(AppView.LANDING)}
        >
          <div className="w-8 h-8 bg-black group-hover:bg-swiss-red transition-colors flex items-center justify-center text-white font-serif italic font-bold text-xl">F</div>
          <span className="font-sans font-black text-2xl tracking-tighter uppercase">Flow<span className="font-serif italic font-normal text-swiss-red">State</span></span>
        </div>

        {/* Nav Items */}
        <div className="flex items-center gap-8">
          <div className="hidden md:flex gap-8 font-sans font-bold text-xs uppercase tracking-widest text-gray-500">
            <a href="#" className="hover:text-black transition-colors">Governance</a>
            <a href="#" className="hover:text-black transition-colors">Docs</a>
            <a href="#" className="hover:text-black transition-colors">Support</a>
          </div>

          {account ? (
            <div className="flex items-center gap-2 border border-black px-4 py-2 bg-white cursor-pointer hover:bg-black hover:text-white transition-colors group">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse group-hover:bg-swiss-red"></div>
              <span className="font-sans text-xs font-bold tracking-wider">{account.substring(0, 6)}...{account.substring(38)}</span>
            </div>
          ) : (
            <SwissButton size="sm" onClick={connectWallet}>
              {isConnecting ? 'Connect...' : 'Launch App'}
            </SwissButton>
          )}
        </div>
      </div>
    </nav>
  );
};