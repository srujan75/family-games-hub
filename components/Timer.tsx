import React, { useEffect, useState } from 'react';

interface TimerProps {
  seconds: number;
  onEnd: () => void;
  className?: string;
}

export const Timer: React.FC<TimerProps> = ({ seconds, onEnd, className }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onEnd();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onEnd]);

  const percentage = (timeLeft / seconds) * 100;

  return (
    <div className={`relative w-full h-3 bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div 
        className={`h-full transition-all duration-1000 ease-linear ${
          timeLeft < 5 ? 'bg-red-500' : 'bg-blue-500'
        }`}
        style={{ width: `${percentage}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">
        {timeLeft}s
      </div>
    </div>
  );
};
