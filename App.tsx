
import React, { useState, useEffect, useRef } from 'react';
import { GameState, Seed, GardenPlot, Customer } from './types';
import { createSeed, performCross, getPhenotypeLabel, getGeneticDescription } from './utils/genetics';
import { generateCustomer, getTutorTip } from './services/geminiService';
import GardenPlotComponent from './components/GardenPlot';
import CustomerCard from './components/CustomerCard';
import Pea from './components/Pea';
import MendelAssistant from './components/MendelAssistant';

// --- Sound Effects System ---
const playSoundEffect = (type: 'pop' | 'coin' | 'plant' | 'success' | 'fail' | 'reveal' | 'unlock') => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    
    if (type === 'pop') {
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'coin') {
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.setValueAtTime(1600, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'plant') {
        osc.frequency.setValueAtTime(200, now);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'success') {
        const osc2 = ctx.createOscillator();
        osc2.connect(gain);
        osc.frequency.setValueAtTime(500, now);
        osc2.frequency.setValueAtTime(750, now);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.3);
        osc2.frequency.exponentialRampToValueAtTime(1500, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start(now);
        osc2.start(now);
        osc.stop(now + 0.4);
        osc2.stop(now + 0.4);
    } else if (type === 'fail') {
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.4);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.type = 'sawtooth';
        osc.start(now);
        osc.stop(now + 0.4);
    } else if (type === 'unlock') {
         osc.type = 'triangle';
         osc.frequency.setValueAtTime(400, now);
         osc.frequency.linearRampToValueAtTime(800, now + 0.2);
         osc.frequency.linearRampToValueAtTime(1200, now + 0.4);
         gain.gain.setValueAtTime(0.3, now);
         gain.gain.linearRampToValueAtTime(0, now + 0.5);
         osc.start(now);
         osc.stop(now + 0.5);
    }
};

const INITIAL_INVENTORY: Seed[] = [
  createSeed('AABB', true), // Pure Dominant (High Round)
  createSeed('aabb', true, true), // Pure Recessive (Short Wrinkled) - Acts as Tester
];

// CHANGED: 3 Plots only. 1 Unlocked, 2 Locked.
const INITIAL_PLOTS: GardenPlot[] = [
  { id: 0, parent1: null, parent2: null, offspring: null, status: 'empty', progress: 0, isLocked: false, unlockPrice: 0 },
  { id: 1, parent1: null, parent2: null, offspring: null, status: 'empty', progress: 0, isLocked: true, unlockPrice: 100 },
  { id: 2, parent1: null, parent2: null, offspring: null, status: 'empty', progress: 0, isLocked: true, unlockPrice: 200 },
];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    money: 200,
    reputation: 0,
    day: 1,
    inventory: INITIAL_INVENTORY,
    plots: INITIAL_PLOTS,
    customers: [],
    isPaused: false,
    selectedSeedId: null,
    tutorialStep: 1, // Start Tutorial
  });

  const [tutorTip, setTutorTip] = useState<string>("欢迎来到豌豆花园！我是孟德尔。");
  const [loadingTip, setLoadingTip] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(true);
  
  // NEW: State for Level Up Modal
  const [showLevelUpModal, setShowLevelUpModal] = useState<{level: number, reward: string} | null>(null);
  const prevLevelRef = useRef(1);
  
  // Persistence: Load on Mount
  useEffect(() => {
    const saved = localStorage.getItem('mendel_garden_save');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (typeof parsed.tutorialStep !== 'number') parsed.tutorialStep = 0;
            
            // Migrate plots if loading from old save with 4 plots
            if (parsed.plots && parsed.plots.length > 3) {
                parsed.plots = parsed.plots.slice(0, 3);
            }
            
            setGameState(parsed);
            if (parsed.tutorialStep === 0) {
                 setTutorTip("欢迎回来！继续我们的实验吧。");
            }
        } catch (e) {
            console.error("Failed to load save", e);
        }
    }
  }, []);

  // Persistence: Auto-Save
  useEffect(() => {
      const timer = setInterval(() => {
          localStorage.setItem('mendel_garden_save', JSON.stringify(gameState));
      }, 5000);
      return () => clearInterval(timer);
  }, [gameState]);

  // --- Game Mechanics Helpers ---

  const calculateLevel = (reputation: number) => {
      if (reputation < 100) return 1;
      if (reputation < 300) return 2;
      return 3;
  };

  const currentLevel = calculateLevel(gameState.reputation);

  // NEW: Level Up Logic
  useEffect(() => {
      if (currentLevel > prevLevelRef.current) {
          playSoundEffect('unlock');
          const rewardText = currentLevel === 2 ? "解锁二级订单！顾客可能要求纯种豌豆了。" : "解锁三级订单！难度提升，奖励更丰厚！";
          setShowLevelUpModal({ level: currentLevel, reward: rewardText });
          prevLevelRef.current = currentLevel;
      }
  }, [currentLevel]);

  const updateTutorTip = async (context: string) => {
    setLoadingTip(true);
    const tip = await getTutorTip(context);
    setTutorTip(tip);
    setLoadingTip(false);
  };
  
  // NEW: Manual Save
  const handleManualSave = () => {
      localStorage.setItem('mendel_garden_save', JSON.stringify(gameState));
      playSoundEffect('coin');
      alert("游戏已保存！");
  };

  // --- Game Loop (Time & Growth) ---
  useEffect(() => {
    if (gameState.isPaused) return;

    const interval = setInterval(() => {
      setGameState(prev => {
        // 1. Update Plot Growth
        let growthSpeed = 5; 
        if (prev.tutorialStep > 0 && prev.tutorialStep < 7) {
            growthSpeed = 20; // Speed up heavily during tutorial
        }

        let plotsChanged = false;
        let anyPlotBecameReady = false;

        const newPlots = prev.plots.map(plot => {
          if (plot.status === 'growing') {
            const newProgress = plot.progress + growthSpeed;
            if (newProgress >= 100 && plot.progress < 100) {
              plotsChanged = true;
              anyPlotBecameReady = true;
              return { ...plot, progress: 100, status: 'ready' as const };
            } else if (newProgress < 100) {
               plotsChanged = true;
               return { ...plot, progress: newProgress };
            } else {
               return plot;
            }
          }
          return plot;
        });

        // 2. Update Tutorial if waiting for growth
        let newTutorialStep = prev.tutorialStep;
        if (prev.tutorialStep === 5 && anyPlotBecameReady) {
            newTutorialStep = 6;
            playSoundEffect('success');
        }

        // 3. Update Customer Timers
        const newCustomers = prev.customers.map(c => ({
          ...c,
          timeLeft: c.timeLeft - 1
        })).filter(c => c.timeLeft > 0);

        const customersChanged = newCustomers.length !== prev.customers.length;
        if (customersChanged && newCustomers.length < prev.customers.length) {
             playSoundEffect('fail');
        }

        if (plotsChanged || customersChanged || newTutorialStep !== prev.tutorialStep || prev.customers.some(c => c.timeLeft !== newCustomers.find(nc => nc.id === c.id)?.timeLeft)) {
             return { 
                 ...prev, 
                 plots: newPlots, 
                 customers: newCustomers,
                 tutorialStep: newTutorialStep
             };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.isPaused]);

  // Separate effect to trigger Tutor Tip
  useEffect(() => {
      if (gameState.tutorialStep === 6) {
          updateTutorTip("哇！豌豆成熟了！看到试验田中间那些闪光的豆荚了吗？快把它们收进背包！");
      }
  }, [gameState.tutorialStep]);


  // --- Customer Generation Loop ---
  useEffect(() => {
    if (gameState.isPaused) return;
    if (gameState.tutorialStep > 0 && gameState.tutorialStep < 7) return;

    const maxCustomers = currentLevel === 1 ? 1 : currentLevel === 2 ? 2 : 3;

    if (gameState.customers.length < maxCustomers) {
      const timeout = setTimeout(async () => {
        const partialCustomer = await generateCustomer(currentLevel);
        const baseTime = currentLevel === 1 ? 150 : currentLevel === 2 ? 120 : 90;
        
        const newCustomer: Customer = {
          id: Math.random().toString(36).substr(2, 9),
          requirements: { quantity: 1, ...partialCustomer.requirements },
          name: partialCustomer.name || "Customer",
          description: partialCustomer.description || "...",
          timeLeft: baseTime,
          maxTime: baseTime,
          reward: 20 + (currentLevel * 10),
        };

        setGameState(prev => ({
          ...prev,
          customers: [...prev.customers, newCustomer]
        }));
        playSoundEffect('pop');
        if (Math.random() > 0.7) {
            updateTutorTip("新顾客来了！看看他们需要什么性状的豌豆。");
        }
      }, Math.random() * 5000 + 3000);

      return () => clearTimeout(timeout);
    }
  }, [gameState.customers.length, gameState.isPaused, currentLevel, gameState.tutorialStep]);


  // --- Interactions ---

  const handleSelectSeed = (seedId: string) => {
    playSoundEffect('pop');
    setGameState(prev => ({
      ...prev,
      selectedSeedId: prev.selectedSeedId === seedId ? null : seedId
    }));
    
    if (gameState.tutorialStep === 2) {
        setGameState(prev => ({ ...prev, tutorialStep: 3 }));
    } 
  };

  const handlePlaceSeed = (plotId: number, seed: Seed) => {
    setGameState(prev => {
      const newPlots = [...prev.plots];
      const plotIndex = newPlots.findIndex(p => p.id === plotId);
      if (plotIndex === -1) return prev;
      const plot = { ...newPlots[plotIndex] }; // Copy plot
      
      if (!plot.parent1) {
        plot.parent1 = seed;
      } else if (!plot.parent2) {
        plot.parent2 = seed;
      }
      
      // CRITICAL FIX: Update status to 'planted' if at least one seed is present.
      // This ensures the "Cross" button logic in GardenPlot works when both are present.
      if (plot.parent1 || plot.parent2) {
          plot.status = 'planted';
      }
      
      newPlots[plotIndex] = plot;
      
      let nextTutStep = prev.tutorialStep;
      if (prev.tutorialStep === 3 && plot.parent1 && plot.parent2) {
          nextTutStep = 4;
          updateTutorTip("父母本都准备好了。点击粉色的【开始杂交】按钮吧！");
      }

      const newInventory = prev.inventory.filter(s => s.id !== seed.id);
      
      playSoundEffect('plant');
      return {
        ...prev,
        plots: newPlots,
        inventory: newInventory,
        selectedSeedId: null,
        tutorialStep: nextTutStep
      };
    });
  };

  const handleCross = (plotId: number) => {
    setGameState(prev => {
      const newPlots = [...prev.plots];
      const plotIndex = newPlots.findIndex(p => p.id === plotId);
      if (plotIndex === -1) return prev;
      const plot = { ...newPlots[plotIndex] };

      if (!plot.parent1 || !plot.parent2) return prev;

      const offspringGenotypes = performCross(plot.parent1.genotype, plot.parent2.genotype);
      const offspringSeeds = offspringGenotypes.map(g => createSeed(g));

      plot.status = 'growing';
      plot.progress = 0;
      plot.offspring = offspringSeeds;
      
      newPlots[plotIndex] = plot;

      updateTutorTip("杂交开始了！基因正在重组... 耐心等待。");
      playSoundEffect('success');

      let nextTutStep = prev.tutorialStep;
      if (prev.tutorialStep === 4) nextTutStep = 5;

      return { ...prev, plots: newPlots, tutorialStep: nextTutStep };
    });
  };

  const handleHarvest = (plotId: number) => {
    setGameState(prev => {
      const newPlots = [...prev.plots];
      const plotIndex = newPlots.findIndex(p => p.id === plotId);
      if (plotIndex === -1) return prev;
      
      const plot = newPlots[plotIndex];
      const harvestedSeeds = plot.offspring || [];

      newPlots[plotIndex] = {
        ...plot,
        parent1: null,
        parent2: null,
        offspring: null,
        status: 'empty',
        progress: 0
      };

      playSoundEffect('coin');
      
      let nextTutStep = prev.tutorialStep;
      if (prev.tutorialStep === 6) {
          nextTutStep = 7;
          updateTutorTip("太棒了！种子已经进入你的背包。现在去柜台把它们交给顾客吧。");
      } else {
          updateTutorTip(`收获了 ${harvestedSeeds.length} 颗新种子！去背包里看看它们的性状。`);
      }

      return {
        ...prev,
        plots: newPlots,
        inventory: [...prev.inventory, ...harvestedSeeds],
        tutorialStep: nextTutStep
      };
    });
  };
  
  const handleUnlockPlot = (plotId: number) => {
      setGameState(prev => {
         const plot = prev.plots.find(p => p.id === plotId);
         if (!plot || prev.money < plot.unlockPrice) return prev;
         
         playSoundEffect('unlock');
         updateTutorTip("新土地解锁了！扩大生产规模吧！");
         
         const newPlots = prev.plots.map(p => 
             p.id === plotId ? { ...p, isLocked: false } : p
         );
         
         return {
             ...prev,
             money: prev.money - plot.unlockPrice,
             plots: newPlots
         };
      });
  };

  const handleServeCustomer = (customerId: string, seed: Seed) => {
    setGameState(prev => {
      const customer = prev.customers.find(c => c.id === customerId);
      if (!customer) return prev;

      const req = customer.requirements;
      let isSuccess = true;
      let failureReason = "";

      if (req.phenotype) {
          if (seed.phenotype.height !== req.phenotype.height || seed.phenotype.shape !== req.phenotype.shape) {
              isSuccess = false;
              failureReason = "外观不符";
          }
      }

      if (req.genotype) {
          if (seed.genotype !== req.genotype) {
              isSuccess = false;
              failureReason = "基因型不纯";
          }
      }

      if (isSuccess) {
          playSoundEffect('success');
          updateTutorTip("订单完成！客户很满意，你的声望提升了！");
          return {
              ...prev,
              money: prev.money + customer.reward,
              reputation: Math.min(1000, prev.reputation + 10),
              inventory: prev.inventory.filter(s => s.id !== seed.id),
              customers: prev.customers.filter(c => c.id !== customerId),
              selectedSeedId: null,
              tutorialStep: prev.tutorialStep === 7 ? 0 : prev.tutorialStep
          };
      } else {
          playSoundEffect('fail');
          updateTutorTip(`哎呀，订单失败了... ${failureReason}`);
          return {
              ...prev,
              reputation: Math.max(0, prev.reputation - 5),
              inventory: prev.inventory.filter(s => s.id !== seed.id),
              customers: prev.customers.map(c => c.id === customerId ? { ...c, dialogue: "这不是我想要的！" } : c),
              selectedSeedId: null
          };
      }
    });
  };

  const handleBuySeed = (type: 'mystery' | 'pure_dom' | 'pure_rec') => {
      const price = 50;
      if (gameState.money < price) {
          playSoundEffect('fail');
          updateTutorTip("金币不足！快去完成订单赚钱吧。");
          return;
      }

      let newSeed: Seed;
      if (type === 'pure_dom') newSeed = createSeed('AABB', true);
      else if (type === 'pure_rec') newSeed = createSeed('aabb', true, true);
      else {
           const genotypes = ['AABB', 'AaBB', 'AABb', 'AaBb', 'aaBB', 'aaBb', 'AAbb', 'Aabb', 'aabb'];
           const randomG = genotypes[Math.floor(Math.random() * genotypes.length)];
           newSeed = createSeed(randomG, false); 
      }

      playSoundEffect('coin');
      setGameState(prev => ({
          ...prev,
          money: prev.money - price,
          inventory: [...prev.inventory, newSeed]
      }));
  };
  
  const handleIdentify = (seedId: string) => {
      if (gameState.money < 20) {
          updateTutorTip("鉴定需要 20 金币，你钱不够啦！");
          return;
      }
      setGameState(prev => ({
          ...prev,
          money: prev.money - 20,
          inventory: prev.inventory.map(s => s.id === seedId ? { ...s, isRevealed: true } : s)
      }));
      playSoundEffect('reveal');
      updateTutorTip("基因型已揭晓！现在你可以确信它的纯度了。");
  };

  const handleReset = () => {
      localStorage.removeItem('mendel_garden_save');
      window.location.reload();
  };

  // NEW: Handle Mendel Close
  const handleMendelClose = () => {
      // Clear current tip.
      // If NOT in specific tutorial steps, fetch a new random one to keep things lively.
      setTutorTip("");
      if (gameState.tutorialStep === 0) {
          // Trigger a new random tip shortly after
          setTimeout(() => {
              updateTutorTip("继续努力！多做杂交实验，你能发现更多规律。");
          }, 1000);
      }
  };

  // --- Render ---
  
  return (
    <div className="h-screen flex flex-col bg-green-50 font-fredoka overflow-hidden selection:bg-green-200">
      
      {/* Level Up Modal */}
      {showLevelUpModal && (
          <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"></div>
              <div className="bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-3xl p-8 max-w-sm w-full relative z-80 shadow-2xl border-8 border-yellow-100 transform animate-[bounce_0.5s_ease-out]">
                  <div className="text-6xl text-center mb-4">🏆</div>
                  <h2 className="text-3xl font-black text-center text-yellow-900 mb-2">店铺升级!</h2>
                  <p className="text-xl font-bold text-center text-yellow-800 mb-4">Level {showLevelUpModal.level}</p>
                  <div className="bg-white/50 rounded-xl p-4 text-center font-bold text-yellow-900 mb-6">
                      {showLevelUpModal.reward}
                  </div>
                  <button 
                    onClick={() => setShowLevelUpModal(null)}
                    className="w-full bg-yellow-800 hover:bg-yellow-900 text-white font-black py-3 rounded-xl shadow-lg active:scale-95 transition-transform"
                  >
                      太棒了！
                  </button>
              </div>
          </div>
      )}

      {/* Tutorial Overlay */}
      {gameState.tutorialStep > 0 && (
          <div className="fixed inset-0 z-[60] pointer-events-none flex flex-col items-center justify-center p-4">
              <div className="bg-black/60 absolute inset-0 pointer-events-auto backdrop-blur-sm"></div>
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full relative z-10 animate-in zoom-in duration-300 pointer-events-auto shadow-2xl border-8 border-green-600">
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 w-24 h-24 sm:w-32 sm:h-32">
                      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                        <circle cx="50" cy="50" r="45" fill="#fcd34d" stroke="#78350f" strokeWidth="3" />
                        <path d="M20,50 Q50,90 80,50" fill="none" stroke="#78350f" strokeWidth="3" />
                        <circle cx="35" cy="40" r="5" fill="#000" />
                        <circle cx="65" cy="40" r="5" fill="#000" />
                        <path d="M20,50 Q20,30 30,20 Q50,5 70,20 Q80,30 80,50" fill="none" stroke="#78350f" strokeWidth="3" />
                      </svg>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-center mt-8 sm:mt-10 text-green-800">孟德尔导师</h2>
                  <p className="text-base sm:text-lg text-gray-700 my-4 text-center font-bold leading-relaxed">
                      {gameState.tutorialStep === 1 && "欢迎！我是孟德尔。让我们通过种植豌豆来探索遗传的奥秘吧！"}
                      {gameState.tutorialStep === 2 && "看到底部的种子包了吗？点击一颗种子选中它。"}
                      {gameState.tutorialStep === 3 && "很好！现在点击屏幕中间的试验田把它种下去。你需要两颗种子作为父母本。"}
                      {gameState.tutorialStep === 4 && "两颗种子都就位了！点击试验田下方的粉色【开始杂交】按钮。"}
                      {gameState.tutorialStep === 5 && "基因重组中... 马上就好！"}
                      {gameState.tutorialStep === 6 && "成熟了！点击田中央那些跳动的豌豆荚收获它们。"}
                      {gameState.tutorialStep === 7 && "顶部有顾客来了。选中你收获的种子，点击订单上的【提交】按钮！"}
                  </p>
                  <button 
                    onClick={() => setGameState(prev => ({ ...prev, tutorialStep: prev.tutorialStep === 1 ? 2 : 0 }))}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-xl text-lg sm:text-xl shadow-lg transition-transform active:scale-95"
                  >
                      {gameState.tutorialStep === 1 ? "下一步" : "明白啦！(关闭教程)"}
                  </button>
              </div>
          </div>
      )}

      {/* --- HEADER (Fixed Height) --- */}
      <header className="bg-green-800 text-white p-2 px-4 shadow-lg flex-shrink-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
             {/* Level Badge */}
             <div className="relative group flex-shrink-0">
                 <div className="w-10 h-10 bg-yellow-400 rounded-full border-2 border-yellow-600 flex items-center justify-center shadow-lg transform transition hover:scale-110 cursor-pointer">
                     <span className="text-lg font-black text-yellow-900">{currentLevel}</span>
                 </div>
                 <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-yellow-600 text-[8px] font-bold px-1.5 rounded-full">
                     Lv
                 </div>
             </div>
             
             <div className="flex flex-col">
                <h1 className="text-lg font-black leading-none tracking-tight hidden sm:block">孟德尔花园</h1>
                <div className="flex gap-2 text-xs font-mono font-bold mt-1">
                    <span className="bg-green-900/50 px-2 py-0.5 rounded flex items-center shadow-inner">💰 {gameState.money}</span>
                    <span className="bg-green-900/50 px-2 py-0.5 rounded flex items-center shadow-inner">🏆 {gameState.reputation}</span>
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
               {/* Manual Save Button */}
               <button onClick={handleManualSave} className="bg-blue-600 hover:bg-blue-700 text-[10px] px-3 py-1.5 rounded font-bold shadow-md border border-blue-400 active:scale-95 transition-transform">
                   💾 存档
               </button>
               <button onClick={handleReset} className="bg-red-900/50 hover:bg-red-900 text-[10px] px-2 py-1.5 rounded text-red-200 border border-red-800">
                   重置
               </button>
          </div>
        </div>
      </header>

      {/* --- MAIN WORKSPACE (Flex Grow) --- */}
      <main className="flex-1 flex flex-col overflow-hidden relative max-w-6xl mx-auto w-full">
        
        {/* TOP: ORDERS (Large Bar) - Removed yellow background */}
        <section className="p-2 flex-shrink-0 z-40 relative">
             <div className="flex gap-4 overflow-x-auto px-4 pt-4 pb-4 custom-scroll items-start min-h-[160px]">
                 {gameState.customers.length === 0 ? (
                     <div className="w-full text-center text-green-800/40 text-lg font-bold mt-8 border-4 border-dashed border-green-800/10 rounded-2xl p-4">
                        ⏳ 等待顾客中...
                     </div>
                 ) : (
                     gameState.customers.map(customer => (
                        <div key={customer.id} className="flex-shrink-0">
                            <CustomerCard 
                                customer={customer} 
                                onServe={handleServeCustomer} 
                                selectedSeed={gameState.inventory.find(s => s.id === gameState.selectedSeedId) || null}
                            />
                        </div>
                     ))
                 )}
             </div>
        </section>

        {/* MIDDLE: GARDEN PLOTS (Scrollable area) */}
        <section className="flex-1 overflow-y-auto p-4 bg-[#f0fdf4] relative">
             
             {/* FLOATING MENDEL ASSISTANT (Bottom Right fixed within workspace) */}
             {/* Updated positioning to be dynamic based on inventory state */}
             <div className={`fixed right-4 z-[55] pointer-events-none hidden sm:block transition-all duration-300 ${isInventoryOpen ? 'bottom-40' : 'bottom-4'}`}>
                 <MendelAssistant message={loadingTip ? "思考中..." : tutorTip} onClose={handleMendelClose} />
             </div>
             {/* Mobile Version */}
             <div className={`fixed right-2 z-[55] pointer-events-none sm:hidden scale-75 origin-bottom-right transition-all duration-300 ${isInventoryOpen ? 'bottom-36' : 'bottom-2'}`}>
                 <MendelAssistant message={loadingTip ? "..." : tutorTip} onClose={handleMendelClose} />
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-20 pt-2">
                 {gameState.plots.map(plot => (
                     <GardenPlotComponent 
                        key={plot.id} 
                        plot={plot} 
                        onPlaceSeed={handlePlaceSeed}
                        onHarvest={handleHarvest}
                        onCross={handleCross}
                        onUnlock={handleUnlockPlot}
                        selectedSeed={gameState.inventory.find(s => s.id === gameState.selectedSeedId) || null}
                        money={gameState.money}
                     />
                 ))}
             </div>
        </section>

        {/* BOTTOM: INVENTORY & SHOP (Collapsible) */}
        <section className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-green-600 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] flex-shrink-0 z-50 transition-all duration-300">
             
             {/* Toggle Button */}
             <button
                 onClick={() => setIsInventoryOpen(!isInventoryOpen)}
                 className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold w-16 h-6 rounded-t-lg flex items-center justify-center border-t border-x border-green-700 shadow-md cursor-pointer transition-colors z-50 focus:outline-none"
                 title={isInventoryOpen ? "收起背包" : "展开背包"}
             >
                 {isInventoryOpen ? '▼ 收起' : '▲ 背包'}
             </button>

             {/* Collapsible Content */}
             <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isInventoryOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
                 <div className="max-w-6xl mx-auto flex flex-col sm:flex-row">
                     
                     {/* Shop Buttons (Left on Desktop, Top on Mobile) */}
                     <div className="bg-green-50 p-2 flex sm:flex-col gap-2 border-b sm:border-b-0 sm:border-r border-green-100 items-center justify-center sm:w-32 flex-shrink-0">
                         <span className="text-[10px] font-bold text-green-800 uppercase mb-1 hidden sm:block">商店</span>
                         <button onClick={() => handleBuySeed('mystery')} className="w-full bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold py-1 px-2 rounded border border-purple-300">
                             盲盒 $50
                         </button>
                         <button onClick={() => handleBuySeed('pure_dom')} className="w-full bg-green-100 hover:bg-green-200 text-green-900 text-xs font-bold py-1 px-2 rounded border border-green-300">
                             AABB $50
                         </button>
                         <button onClick={() => handleBuySeed('pure_rec')} className="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold py-1 px-2 rounded border border-emerald-300">
                             aabb $50
                         </button>
                     </div>

                     {/* Seeds List (Horizontal Scroll) */}
                     <div className="flex-1 p-2 overflow-x-auto flex items-center gap-3 custom-scroll h-24 sm:h-28 bg-white relative">
                         {gameState.inventory.length === 0 && (
                             <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm italic pointer-events-none">
                                背包空空，请购买种子
                             </div>
                         )}
                         {gameState.inventory.map(seed => (
                             <div key={seed.id} className="relative group flex-shrink-0">
                                 <Pea 
                                    seed={seed} 
                                    onClick={() => handleSelectSeed(seed.id)}
                                    selected={gameState.selectedSeedId === seed.id}
                                    showGenotype={seed.isRevealed} 
                                    size="md"
                                    className="transform transition-transform active:scale-90"
                                 />
                                 {!seed.isRevealed && (
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); handleIdentify(seed.id); }}
                                        className="absolute -top-1 -right-1 bg-blue-500 hover:bg-blue-600 text-white text-[8px] w-5 h-5 rounded-full flex items-center justify-center border border-white shadow-sm z-20"
                                     >
                                        🔍
                                     </button>
                                 )}
                             </div>
                         ))}
                     </div>

                 </div>
             </div>
        </section>

      </main>
    </div>
  );
};

export default App;
