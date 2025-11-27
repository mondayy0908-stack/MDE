
import React, { useState, useEffect } from 'react';

interface MendelAssistantProps {
  message: string;
  onClose?: () => void;
  className?: string;
}

const MendelAssistant: React.FC<MendelAssistantProps> = ({ message, onClose, className = '' }) => {
  const [visibleMessage, setVisibleMessage] = useState(message);
  const [isAnimating, setIsAnimating] = useState(false);

  // Trigger animation when message changes
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => {
        setVisibleMessage(message);
        setIsAnimating(false);
    }, 200); // Quick fade out/in effect
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <div className={`flex items-end flex-row-reverse pointer-events-auto z-50 ${className}`}>
      
      {/* 1. The Speech Bubble */}
      <div className={`
          relative mb-16 mr-4 bg-white border-4 border-gray-800 rounded-2xl p-4 shadow-xl max-w-[200px] sm:max-w-[260px]
          transition-all duration-300 transform origin-bottom-right
          ${isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}
      `}>
          {/* Close Button */}
          {onClose && (
            <button 
              onClick={onClose}
              className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 text-white rounded-full font-bold flex items-center justify-center border-2 border-white shadow-md hover:bg-red-600 active:scale-95"
            >
              ×
            </button>
          )}

          {/* Bubble Tail (flipped for right side) */}
          <div className="absolute -bottom-4 right-6 w-0 h-0 border-r-[15px] border-r-transparent border-t-[20px] border-t-gray-800 border-l-[5px] border-l-transparent"></div>
          <div className="absolute -bottom-[11px] right-[27px] w-0 h-0 border-r-[10px] border-r-transparent border-t-[16px] border-t-white border-l-[2px] border-l-transparent"></div>
          
          {/* Message Content */}
          <p className="text-gray-800 text-sm font-bold leading-relaxed font-sans">
             {visibleMessage}
          </p>
      </div>

      {/* 2. Cartoon Mendel SVG */}
      <div className="w-24 h-24 sm:w-32 sm:h-32 -mr-8 filter drop-shadow-2xl animate-[bounce_3s_infinite]">
        <svg viewBox="0 0 200 200" className="w-full h-full transform -scale-x-100">
            {/* Robe Body */}
            <path d="M50,180 Q50,100 100,80 Q150,100 150,180" fill="#5D4037" stroke="#3E2723" strokeWidth="3" />
            
            {/* Head */}
            <circle cx="100" cy="70" r="40" fill="#FFCCBC" stroke="#3E2723" strokeWidth="3" />
            
            {/* Beard */}
            <path d="M65,70 Q100,120 135,70 Q135,90 100,110 Q65,90 65,70" fill="#ECEFF1" stroke="#CFD8DC" strokeWidth="2" />
            
            {/* Glasses */}
            <circle cx="85" cy="65" r="10" fill="rgba(255,255,255,0.4)" stroke="#333" strokeWidth="2" />
            <circle cx="115" cy="65" r="10" fill="rgba(255,255,255,0.4)" stroke="#333" strokeWidth="2" />
            <line x1="95" y1="65" x2="105" y2="65" stroke="#333" strokeWidth="2" />
            
            {/* Eyes */}
            <circle cx="85" cy="65" r="2" fill="#000" />
            <circle cx="115" cy="65" r="2" fill="#000" />

            {/* Nose */}
            <path d="M100,65 Q95,75 100,80" fill="none" stroke="#D84315" strokeWidth="2" />

            {/* Monk Hat/Hair */}
            <path d="M60,60 Q100,20 140,60" fill="none" stroke="#9E9E9E" strokeWidth="8" strokeLinecap="round" />
            
            {/* Hand holding a Pea Plant */}
            <circle cx="140" cy="140" r="15" fill="#FFCCBC" stroke="#3E2723" strokeWidth="3" />
            <path d="M140,140 Q140,100 140,80" fill="none" stroke="#2E7D32" strokeWidth="3" />
            <circle cx="135" cy="90" r="5" fill="#4CAF50" />
            <circle cx="145" cy="85" r="5" fill="#4CAF50" />
        </svg>
      </div>
    </div>
  );
};

export default MendelAssistant;
