import React, { useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { HorizontalScroll } from './components/HorizontalScroll';
import { StreamDashboard } from './components/StreamDashboard';
import { AppView } from './types';
import { SwissButton } from './components/PixelComponents';
import { Web3Provider } from './context/Web3Context';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);

  return (
    <Web3Provider>
      <div className="min-h-screen bg-off-white text-deep-black font-sans selection:bg-swiss-red selection:text-white">
        <Header currentView={currentView} setView={setCurrentView} />

        <main>
          {currentView === AppView.LANDING ? (
            <>
              <section className="h-screen w-full snap-start relative">
                <Hero onEnterApp={() => setCurrentView(AppView.DASHBOARD)} />
              </section>

              {/* Expanded Full Screen Transition Section */}
              <section className="h-screen w-full snap-start flex flex-col justify-center items-center py-20 relative bg-white border-b border-black overflow-hidden">

                <div className="container mx-auto px-6 flex-grow flex flex-col justify-center items-center max-w-5xl z-10 relative pb-32 md:pb-0">
                  <h2 className="text-5xl md:text-9xl font-serif italic mb-8 md:mb-12 leading-[0.9] text-center">
                    "Set it and <br /> forget it"
                  </h2>

                  <div className="w-24 md:w-32 h-2 bg-swiss-red mx-auto mb-8 md:mb-12"></div>

                  <p className="text-xl md:text-4xl font-serif text-black leading-snug text-center max-w-4xl">
                    Stop letting your vested tokens sit idle. <br />
                    <span className="font-sans font-bold bg-black text-white px-2">FlowState</span> hooks into your Sablier contract and automatically bridges assets to Aqua0 pools the moment they unlock.
                  </p>
                </div>

                {/* Added visual density at the bottom - Full Width */}
                <div className="w-full absolute bottom-0 left-0 border-t border-black bg-off-white z-20">
                  <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-black">
                    <div className="p-4 md:p-6 text-center md:text-left">
                      <div className="font-sans font-black text-xl md:text-2xl mb-1">ZERO</div>
                      <div className="text-[10px] uppercase tracking-widest text-gray-500">Idle Capital</div>
                    </div>
                    <div className="p-4 md:p-6 text-center md:text-left">
                      <div className="font-sans font-black text-xl md:text-2xl mb-1">AUTO</div>
                      <div className="text-[10px] uppercase tracking-widest text-gray-500">Bridging & LPing</div>
                    </div>
                    <div className="p-4 md:p-6 text-center md:text-left">
                      <div className="font-sans font-black text-xl md:text-2xl mb-1">LAYER0</div>
                      <div className="text-[10px] uppercase tracking-widest text-gray-500">Omnichain Standard</div>
                    </div>
                    <div className="p-4 md:p-6 bg-swiss-red text-white flex items-center justify-center cursor-pointer hover:bg-black transition-colors" onClick={() => setCurrentView(AppView.DASHBOARD)}>
                      <span className="font-sans font-bold uppercase tracking-widest text-xs">Start Now &rarr;</span>
                    </div>
                  </div>
                </div>
              </section>

              <HorizontalScroll />

              {/* Ready to Divert + Footer - Combined into one slide */}
              <section className="h-screen w-full snap-start flex flex-col relative bg-swiss-red overflow-hidden text-white">
                {/* Decorative background text */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[25vw] font-black text-black opacity-10 whitespace-nowrap pointer-events-none select-none">
                  DIVERSIFY
                </div>

                {/* Main CTA Content - Grows to fill space */}
                <div className="flex-grow flex flex-col justify-center items-center relative z-10 w-full max-w-6xl mx-auto px-4">
                  <h2 className="text-6xl md:text-9xl font-sans font-black mb-8 md:mb-12 tracking-tighter leading-none break-words text-center">
                    READY TO<br /> DIVERT?
                  </h2>
                  <div className="flex justify-center">
                    <SwissButton
                      className="bg-white text-black hover:bg-black hover:text-white border-transparent shadow-[10px_10px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none"
                      size="lg"
                      onClick={() => setCurrentView(AppView.DASHBOARD)}
                    >
                      Start Streaming
                    </SwissButton>
                  </div>
                </div>

                {/* Footer - Shrinks to fit content at bottom */}
                <footer className="bg-white text-black py-8 border-t border-black flex-shrink-0 relative z-20">
                  <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-8">
                    <div className="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 text-center md:text-left">
                      © 2026 FlowState Inc.<br />
                      Uniswap Hook Incubator
                    </div>
                    <div className="flex gap-8 font-sans font-bold text-xs uppercase tracking-widest">
                      <a href="#" className="hover:text-swiss-red transition-colors">Twitter</a>
                      <a href="#" className="hover:text-swiss-red transition-colors">Discord</a>
                      <a href="#" className="hover:text-swiss-red transition-colors">Github</a>
                    </div>
                  </div>
                </footer>
              </section>
            </>
          ) : (
            <StreamDashboard />
          )}
        </main>
      </div>
    </Web3Provider>
  );
}