import React from 'react';
import { Seed } from '../types';
import { getPhenotypeLabel } from '../utils/genetics';

interface PeaProps {
  seed: Seed;
  onClick?: () => void;
  selected?: boolean;
  showGenotype?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Pea: React.FC<PeaProps> = ({ seed, onClick, selected, showGenotype = false, className = '', size = 'md' }) => {
  const isRound = seed.phenotype.shape === 'Round';
  const isHigh = seed.phenotype.height === 'High';
  const isWrinkled = !isRound;
  
  const labels = getPhenotypeLabel(seed.phenotype);

  // Size classes
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center cursor-pointer transition-all duration-300
        ${selected ? 'scale-110 z-10' : 'hover:scale-105'}
        ${className}
      `}
    >
      {/* Selection Glow */}
      {selected && <div className="absolute inset-0 bg-yellow-300 rounded-full blur-md opacity-70 animate-pulse" />}

      {/* The Pea Body */}
      <div
        className={`
          relative ${sizeClasses[size]} rounded-full border-4 border-green-900 shadow-[inset_-4px_-4px_10px_rgba(0,0,0,0.2)]
          flex items-center justify-center overflow-hidden
          ${isHigh ? 'bg-gradient-to-br from-green-300 to-green-500' : 'bg-gradient-to-br from-emerald-400 to-emerald-600'} 
        `}
        style={{
             // Cartoonish wobble for wrinkled
             borderRadius: isWrinkled ? '60% 40% 70% 30% / 50% 70% 30% 60%' : '50%',
             transform: isWrinkled ? 'rotate(-10deg)' : 'none'
        }}
      >
        {/* Cartoon Face */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="flex gap-1 mb-1">
                <div className="w-2 h-2 bg-black rounded-full animate-[blink_4s_infinite]"></div>
                <div className="w-2 h-2 bg-black rounded-full animate-[blink_4s_infinite_0.2s]"></div>
            </div>
            {/* Mouth */}
            <div className={`
                w-3 h-1.5 border-b-2 border-black rounded-full opacity-60
                ${isHigh ? 'w-4' : 'w-2'}
            `}></div>
        </div>

        {/* Genotype Text Overlay (if visible) */}
        {(showGenotype || seed.isRevealed) && (
             <span className="absolute bottom-1 text-[10px] font-black text-white bg-black/40 px-1 rounded">
                {seed.genotype}
             </span>
        )}
      </div>
      
      {/* Phenotype Label Badge */}
      <div className="mt-1 flex flex-col items-center">
         <span className={`
            text-[10px] font-bold text-white px-2 py-0.5 rounded-full border-2 border-white shadow-sm whitespace-nowrap
            ${isHigh ? 'bg-green-600' : 'bg-emerald-700'}
         `}>
             {labels.height}
         </span>
         <span className={`
            text-[10px] font-bold text-white px-2 py-0.5 rounded-full border-2 border-white shadow-sm -mt-1 scale-90
            ${isRound ? 'bg-blue-400' : 'bg-amber-500'}
         `}>
             {labels.shape}
         </span>
      </div>
      
      {/* Tester Badge */}
      {seed.isTester && (
         <div className="absolute top-0 right-0 bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white rotate-12 shadow-md">
             试
         </div>
      )}
    </div>
  );
};

export default Pea;