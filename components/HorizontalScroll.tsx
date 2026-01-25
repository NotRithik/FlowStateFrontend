import React, { useRef, useEffect } from 'react';
import { SwissBadge } from './PixelComponents';

const steps = [
  {
    id: 1,
    title: "Stream Detection",
    description: "We constantly monitor your wallet for incoming Sablier salary streams.",
    image: "https://picsum.photos/600/400?random=10",
    tag: "Analysis"
  },
  {
    id: 2,
    title: "Smart Vesting",
    description: "Our hook calculates the optimal vest schedule to minimize gas and maximize time-in-market.",
    image: "https://picsum.photos/600/400?random=11",
    tag: "Calculation"
  },
  {
    id: 3,
    title: "Aqua0 Bridging",
    description: "Liquidity is extracted and bridged via LayerZero to the highest yield pools.",
    image: "https://picsum.photos/600/400?random=12",
    tag: "Execution"
  },
  {
    id: 4,
    title: "Auto-Compound",
    description: "Yield is harvested and reinvested. Your salary works for you while you sleep.",
    image: "https://picsum.photos/600/400?random=13",
    tag: "Growth"
  }
];

export const HorizontalScroll = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || !trackRef.current) return;
      
      const container = containerRef.current;
      const track = trackRef.current;
      
      const containerTop = container.offsetTop;
      const containerHeight = container.getBoundingClientRect().height;
      const windowHeight = window.innerHeight;
      
      const trackWidth = track.scrollWidth;
      const maxTranslate = trackWidth - window.innerWidth;
      const scrollDist = containerHeight - windowHeight;
      const scrollTop = window.scrollY;
      
      const rawProgress = (scrollTop - containerTop) / scrollDist;
      const progress = Math.max(0, Math.min(1, rawProgress));
      
      track.style.transform = `translateX(-${progress * maxTranslate}px)`;
      
      const images = track.querySelectorAll('.parallax-img');
      images.forEach((img: any) => {
        img.style.transform = `scale(${1.2 - progress * 0.1})`;
      });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative bg-deep-black text-white" style={{ height: `${steps.length * 100}vh` }}>
      
      {/* Internal Snap Points to drive the animation step-by-step */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {steps.map((_, i) => (
          <div 
            key={i} 
            className="w-full h-screen snap-start absolute left-0"
            style={{ top: `${i * 100}vh` }} 
          />
        ))}
      </div>

      {/* Added pt-24 to account for fixed header height (approx 80-90px) */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col pt-24">
        
        {/* 1. Header Section - Fixed at top, clear of content */}
        <div className="w-full px-8 md:px-16 pb-8 flex justify-between items-end border-b border-white/10 bg-deep-black z-20">
           <div>
             <h2 className="text-4xl md:text-6xl font-serif italic text-white leading-none mb-2">
               The Mechanism
             </h2>
             <p className="font-sans text-xs font-bold uppercase tracking-widest text-gray-500">How FlowState Works</p>
           </div>
           <div className="hidden md:block text-right">
             <div className="font-sans text-xs font-bold uppercase tracking-widest mb-2">Scroll to Advance</div>
             <div className="w-full h-[1px] bg-white/20"></div>
           </div>
        </div>

        {/* 2. Scrolling Track Section - Takes up remaining space */}
        <div className="flex-grow relative flex items-center">
            <div ref={trackRef} className="flex items-center pl-8 md:pl-16 w-max will-change-transform h-full">
              
              {/* Spacer so first item isn't flush left */}
              <div className="w-[10vw] flex-shrink-0"></div>

              {steps.map((step, index) => (
                <div key={step.id} className="w-[85vw] md:w-[600px] flex-shrink-0 pr-20 md:pr-40 relative group">
                  
                  {/* Content Layout */}
                  <div className="relative">
                    <div className="flex items-baseline gap-4 mb-6">
                        <span className="text-6xl font-serif italic text-swiss-red">0{step.id}</span>
                        <h3 className="text-3xl md:text-4xl font-sans font-black uppercase tracking-tight">
                        {step.title}
                        </h3>
                    </div>

                    <div className="w-full aspect-[4/3] overflow-hidden mb-8 border border-white/20 relative">
                      <img 
                        src={step.image} 
                        alt={step.title} 
                        className="parallax-img w-full h-full object-cover grayscale opacity-80 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700" 
                      />
                    </div>
                    
                    <p className="text-gray-400 font-sans text-lg leading-relaxed max-w-md border-l border-white/20 pl-6">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
              
              <div className="w-[20vw] flex justify-center opacity-30">
                 <span className="font-serif italic text-2xl">Fin.</span>
              </div>

            </div>
        </div>

      </div>
    </div>
  );
};