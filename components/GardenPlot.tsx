
import React from 'react';
import { GardenPlot as PlotType, Seed } from '../types';
import Pea from './Pea';

interface GardenPlotProps {
  plot: PlotType;
  onPlaceSeed: (plotId: number, seed: Seed) => void;
  onHarvest: (plotId: number) => void;
  onCross: (plotId: number) => void;
  onUnlock: (plotId: number) => void;
  selectedSeed: Seed | null;
  money: number;
}

const GardenPlot: React.FC<GardenPlotProps> = ({ plot, onPlaceSeed, onHarvest, onCross, onUnlock, selectedSeed, money }) => {
  
  // LOCKED STATE
  if (plot.isLocked) {
      const canAfford = money >= plot.unlockPrice;
      return (
          <div className="relative group h-32 bg-[#3d2616] border-4 border-[#2a1a0f] rounded-xl p-2 flex flex-col items-center justify-center shadow-inner opacity-90">
              <div className="absolute inset-0 opacity-50 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')]"></div>
              <div className="z-10 text-center scale-90">
                  <div className="text-2xl mb-1 grayscale opacity-50">🔒</div>
                  <div className="text-[#A67B5B] font-bold text-[10px] mb-1">未开发</div>
                  <button 
                    onClick={() => onUnlock(plot.id)}
                    className={`
                        text-[9px] font-black px-2 py-1 rounded-full border-2 transition-all duration-300 transform active:scale-95
                        ${canAfford 
                            ? 'bg-yellow-400 text-yellow-900 border-yellow-200 hover:bg-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-pulse ring-2 ring-offset-2 ring-yellow-400' 
                            : 'bg-gray-600 text-gray-400 border-gray-700 cursor-not-allowed opacity-70'}
                    `}
                    disabled={!canAfford}
                  >
                      {plot.unlockPrice} 💰 解锁
                  </button>
              </div>
          </div>
      );
  }

  const handlePlotClick = () => {
    if (plot.status === 'empty' || (plot.status === 'planted' && (!plot.parent1 || !plot.parent2))) {
      if (selectedSeed) {
        onPlaceSeed(plot.id, selectedSeed);
      }
    } else if (plot.status === 'ready') {
      onHarvest(plot.id);
    }
  };

  const canCross = plot.status === 'planted' && plot.parent1 && plot.parent2;
  const isReady = plot.status === 'ready';
  const isGrowing = plot.status === 'growing';

  return (
    <div className="relative group w-full">
        {/* Plot Container - Reduced Height to h-32 */}
        <div className="bg-[#8B5E3C] border-4 border-[#5D3A20] rounded-xl p-1 h-32 flex flex-col items-center justify-between shadow-[inset_0_4px_8px_rgba(0,0,0,0.5)] overflow-hidden relative transition-all">
        
            {/* Dirt Texture Overlay */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] pointer-events-none"></div>

            {/* --- STATE 1: PARENTS (Shown when planting or growing, faded when ready) --- */}
            {/* Changed items-end to items-center to center seeds vertically */}
            <div 
                className={`flex w-full justify-around items-center h-full z-10 pb-2 transition-all duration-500 absolute inset-0
                ${isReady ? 'opacity-10 scale-90 blur-[2px]' : 'opacity-100'}
                ${isGrowing ? 'opacity-50 blur-[1px]' : ''}
                `}
            >
                {/* Parent 1 - Scaled Down */}
                <div 
                    className={`
                        w-10 h-10 border-2 border-dashed border-[#A67B5B] rounded-full flex items-center justify-center cursor-pointer transition-colors
                        ${!plot.parent1 && selectedSeed && !isGrowing && !isReady ? 'hover:bg-white/20 hover:border-white animate-pulse' : ''}
                    `}
                    onClick={!isReady ? handlePlotClick : undefined}
                >
                    {plot.parent1 ? (
                        <div className="transform scale-75">
                            <Pea seed={plot.parent1} size="sm" showGenotype />
                        </div>
                    ) : (
                        <span className="text-[#A67B5B] text-[9px] font-bold">父本</span>
                    )}
                </div>

                <div className="text-white/30 font-black text-md">x</div>

                {/* Parent 2 - Scaled Down */}
                <div 
                    className={`
                        w-10 h-10 border-2 border-dashed border-[#A67B5B] rounded-full flex items-center justify-center cursor-pointer transition-colors
                        ${!plot.parent2 && selectedSeed && !isGrowing && !isReady ? 'hover:bg-white/20 hover:border-white animate-pulse' : ''}
                    `}
                    onClick={!isReady ? handlePlotClick : undefined}
                >
                    {plot.parent2 ? (
                        <div className="transform scale-75">
                            <Pea seed={plot.parent2} size="sm" showGenotype />
                        </div>
                    ) : (
                        <span className="text-[#A67B5B] text-[9px] font-bold">母本</span>
                    )}
                </div>
            </div>

            {/* --- STATE 2: GROWING PROGRESS --- */}
            {isGrowing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                    <div className="w-3/4 bg-black/30 rounded-full h-2 border border-white/20 mb-1">
                        <div 
                            className="bg-gradient-to-r from-green-400 to-lime-500 h-full rounded-full shadow-[0_0_10px_rgba(74,222,128,0.5)]" 
                            style={{ width: `${plot.progress}%`, transition: 'width 0.2s linear' }}
                        ></div>
                    </div>
                    <div className="text-white font-bold text-[10px] animate-pulse drop-shadow-md">
                        🧬 {Math.round(plot.progress)}%
                    </div>
                </div>
            )}

            {/* --- STATE 3: READY / OFFSPRING (F1) --- */}
            {isReady && plot.offspring && (
                <div 
                    className="absolute inset-0 z-30 flex flex-col items-center justify-center cursor-pointer bg-black/5 hover:bg-black/10 transition-colors"
                    onClick={handlePlotClick}
                >
                     <div className="relative animate-bounce mb-1 transform scale-90">
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-60 animate-pulse"></div>
                        
                        {/* Cluster of Peas */}
                        <div className="relative w-20 h-12 flex items-center justify-center">
                            {plot.offspring.slice(0, 3).map((seed, idx) => (
                                <div 
                                    key={seed.id} 
                                    className="absolute transform transition-transform group-hover:scale-110" 
                                    style={{ 
                                        left: (idx - 1) * 12 + 24, 
                                        top: idx % 2 === 0 ? 0 : 8, 
                                        zIndex: idx,
                                        transform: `rotate(${(idx - 1) * 15}deg)` 
                                    }}
                                >
                                    <Pea seed={seed} size="md" showGenotype={seed.isRevealed} className="shadow-lg border border-white" />
                                </div>
                            ))}
                        </div>
                     </div>
                     
                     <div className="bg-green-600 text-white px-2 py-0.5 rounded-full text-[9px] font-black shadow-lg border border-white/50 animate-pulse">
                         点击收获
                     </div>
                </div>
            )}

            {/* Action Button: CROSS */}
            {!isGrowing && !isReady && canCross && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center z-30 pointer-events-none">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onCross(plot.id); }}
                        className="pointer-events-auto bg-pink-500 hover:bg-pink-600 text-white text-[10px] font-black py-1 px-3 rounded-full shadow-lg border-b-2 border-pink-800 active:translate-y-0.5 active:border-b-0 transition-all animate-bounce"
                    >
                        ❤️ 杂交
                    </button>
                </div>
            )}

        </div>
        
        {/* Plot Label */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-[#5D3A20] text-[#E0C9A6] text-[9px] font-bold px-2 py-0.5 rounded-md border border-[#8B5E3C] shadow-sm z-20">
            {plot.id + 1}号田
        </div>
    </div>
  );
};

export default GardenPlot;
