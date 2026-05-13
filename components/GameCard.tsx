import React from 'react';
import { LucideIcon } from 'lucide-react';

interface GameCardProps {
  title: string;
  icon: LucideIcon;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  color: string;
}

export const GameCard: React.FC<GameCardProps> = ({ title, icon: Icon, description, onClick, disabled, color }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left p-4 rounded-2xl transition-all active:scale-95 ${color} ${
        disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:shadow-xl shadow-md'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white/20 rounded-xl">
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <p className="text-sm text-white/80">{description}</p>
        </div>
      </div>
    </button>
  );
};
