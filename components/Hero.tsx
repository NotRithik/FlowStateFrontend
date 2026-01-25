import React, { useEffect, useState } from 'react';
import { SwissButton } from './PixelComponents';
import { ArrowDown, ArrowRight, TrendingUp } from 'lucide-react';

interface HeroProps {
  onEnterApp: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onEnterApp }) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-off-white border-b border-black">
      
      {/* Subtle Grid */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 h-full flex flex-col items-center justify-center pt-20">
        
        {/* Central Graphic Area - Simplified */}
        <div className="relative w-full max-w-5xl mb-16 h-[30vh] hidden md:block">
          
          {/* Card 1: Stream */}
          <div 
            className="absolute left-10 top-1/2 -translate-y-1/2 w-72 bg-white border border-black p-6 shadow-xl z-20"
            style={{ transform: `translateY(${-50 + scrollY * 0.05}%) rotate(-3deg)` }}
          >
            <div className="text-xs font-sans font-bold uppercase text-gray-400 mb-4 tracking-wider">Source</div>
            <div className="font-serif text-4xl mb-2">$4,250.00</div>
            <div className="h-1 w-full bg-gray-100 mt-4 overflow-hidden">
               <div className="h-full bg-black w-2/3 animate-pulse"></div>
            </div>
          </div>

          {/* Connection Line */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] border-t-2 border-dashed border-gray-300 z-0"></div>

          {/* Card 2: Yield */}
          <div 
            className="absolute right-10 top-1/2 -translate-y-1/2 w-72 bg-black text-white p-6 shadow-2xl z-30"
            style={{ transform: `translateY(${-50 + scrollY * -0.05}%) rotate(2deg)` }}
          >
             <div className="flex justify-between items-start mb-6">
                <span className="text-xs font-sans font-bold uppercase text-gray-500 tracking-wider">Aqua0 Yield</span>
                <TrendingUp size={20} className="text-swiss-red" />
             </div>
             <div className="font-serif text-5xl italic">+12.4%</div>
             <div className="mt-4 text-xs font-sans text-gray-400">Auto-Compounding active</div>
          </div>
        </div>

        {/* Typography */}
        <div className="text-center relative z-20 max-w-5xl mx-auto mt-0 md:-mt-10">
          <h1 className="text-7xl md:text-9xl font-sans font-black tracking-tighter mb-8 leading-[0.85]">
            YOUR SALARY <br/>
            <span className="font-serif italic font-normal text-6xl md:text-8xl text-swiss-red">LIQUID.</span>
          </h1>
          
          <p className="font-sans text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed">
            Your future income stream becomes a live liquidity source that feeds Uniswap pools automatically via Aqua0.
          </p>

          <div className="flex flex-col items-center gap-6">
            <SwissButton size="lg" onClick={onEnterApp}>
              Connect Stream
            </SwissButton>
            <div className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-gray-400">
              Powered by Sablier x Aqua0
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};