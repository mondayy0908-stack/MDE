
import React from 'react';
import { Customer, Seed } from '../types';
import { getPhenotypeLabel } from '../utils/genetics';

interface CustomerCardProps {
  customer: Customer;
  onServe: (customerId: string, seed: Seed) => void;
  selectedSeed: Seed | null;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onServe, selectedSeed }) => {
  const progressPercent = (customer.timeLeft / customer.maxTime) * 100;
  
  // Color based on urgency
  let barColor = 'bg-green-500';
  if (progressPercent < 50) barColor = 'bg-yellow-500';
  if (progressPercent < 20) barColor = 'bg-red-500';

  const reqLabels = customer.requirements.phenotype ? getPhenotypeLabel(customer.requirements.phenotype) : null;

  // Zoomed in card: w-96 to w-[26rem], larger fonts
  return (
    <div className="flex bg-white rounded-2xl shadow-xl border-4 border-gray-100 p-4 relative h-full animate-in slide-in-from-top-2 duration-300 w-[26rem] overflow-hidden transform hover:scale-[1.02] transition-transform">
        
        {/* Left: Avatar (Larger) */}
        <div className="flex flex-col items-center justify-center mr-4 flex-shrink-0">
             <div className="w-16 h-16 bg-blue-50 rounded-full border-4 border-gray-200 flex items-center justify-center text-3xl shadow-sm">
                 🧑‍🌾
             </div>
             <div className="text-sm font-bold text-gray-600 mt-2 truncate max-w-[6rem] text-center">
                 {customer.name}
             </div>
        </div>

        {/* Center: Info (Larger Text) */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
             {/* Bubble text */}
             <div className="text-sm text-gray-700 italic bg-gray-50 p-2 rounded-lg border border-gray-100 leading-tight mb-2">
                 "{customer.description}"
             </div>
             
             {/* Requirements */}
             <div className="flex items-center flex-wrap gap-2">
                 <span className="text-base font-black text-gray-800 bg-gray-200 px-3 py-1 rounded-md">x{customer.requirements.quantity}</span>
                 {customer.requirements.genotype ? (
                    <span className="bg-purple-600 text-white text-sm font-bold px-3 py-1 rounded shadow-sm">
                        纯合 {customer.requirements.genotype}
                    </span>
                 ) : (
                    <div className="flex gap-2">
                        <span className={`text-sm font-bold text-white px-3 py-1 rounded shadow-sm ${reqLabels?.height === '高茎' ? 'bg-green-600' : 'bg-emerald-600'}`}>
                            {reqLabels?.height}
                        </span>
                        <span className={`text-sm font-bold text-white px-3 py-1 rounded shadow-sm ${reqLabels?.shape === '圆粒' ? 'bg-blue-500' : 'bg-amber-600'}`}>
                            {reqLabels?.shape}
                        </span>
                    </div>
                 )}
             </div>

             {/* Time Bar */}
             <div className="h-3 w-full bg-gray-200 rounded-full mt-3 overflow-hidden border border-gray-300 shadow-inner">
                <div 
                    className={`h-full ${barColor} transition-all duration-1000 linear`} 
                    style={{ width: `${progressPercent}%` }}
                ></div>
            </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col justify-between items-end ml-4 border-l-2 border-dashed border-gray-200 pl-4">
            <div className="bg-yellow-100 text-yellow-800 font-black px-3 py-1.5 rounded-lg text-sm border border-yellow-300 shadow-sm">
                +${customer.reward}
            </div>
            <button 
                onClick={() => selectedSeed && onServe(customer.id, selectedSeed)}
                className={`
                    text-sm font-bold px-4 py-3 rounded-xl shadow-lg transition-all border-b-4 active:border-b-0 active:translate-y-[4px]
                    ${selectedSeed 
                        ? 'bg-green-600 hover:bg-green-500 text-white border-green-800 animate-pulse' 
                        : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'}
                `}
                disabled={!selectedSeed}
            >
                {selectedSeed ? '提交' : '选择'}
            </button>
        </div>
    </div>
  );
};

export default CustomerCard;
