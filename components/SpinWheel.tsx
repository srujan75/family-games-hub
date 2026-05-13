import React, { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface SpinWheelProps {
  options: string[];
  onSpinEnd: (result: string) => void;
  isHost: boolean;
}

export const SpinWheel: React.FC<SpinWheelProps> = ({ options, onSpinEnd, isHost }) => {
  const controls = useAnimation();
  const [isSpinning, setIsSpinning] = useState(false);

  const handleSpin = async () => {
    if (!isHost || isSpinning) return;

    setIsSpinning(true);
    const spinDegrees = 1800 + Math.random() * 360; // 5 full rotations + random
    
    await controls.start({
      rotate: spinDegrees,
      transition: { duration: 4, ease: "easeOut" }
    });

    setIsSpinning(false);
    const finalDegree = spinDegrees % 360;
    const optionIndex = Math.floor((360 - finalDegree) / (360 / options.length)) % options.length;
    onSpinEnd(options[optionIndex]);
  };

  return (
    <div className="flex flex-col items-center gap-8 py-10">
      <div className="relative w-72 h-72">
        {/* Pointer */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-8 h-8 bg-red-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
          <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[15px] border-t-red-600 absolute -bottom-3" />
        </div>

        <motion.div
          animate={controls}
          className="w-full h-full rounded-full border-8 border-white shadow-2xl overflow-hidden relative"
          style={{ background: 'conic-gradient(#3b82f6 0% 10%, #8b5cf6 10% 20%, #ec4899 20% 30%, #f97316 30% 40%, #10b981 40% 50%, #3b82f6 50% 60%, #8b5cf6 60% 70%, #ec4899 70% 80%, #f97316 80% 90%, #10b981 90% 100%)' }}
        >
          {options.map((option, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center px-4"
              style={{ transform: `translate(-50%, -50%) rotate(${i * (360 / options.length)}deg) translateY(-100px)` }}
            >
              <span className="text-[10px] font-black text-white uppercase drop-shadow-md">
                {option}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {isHost && (
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className="bg-red-600 text-white font-black px-12 py-4 rounded-full shadow-xl hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
        >
          {isSpinning ? 'SPINNING...' : 'SPIN WHEEL!'}
        </button>
      )}
    </div>
  );
};
