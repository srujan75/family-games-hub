import React from 'react';

interface PlayerCardProps {
  name: string;
  avatar: string;
  isHost?: boolean;
  score?: number;
  className?: string;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ name, avatar, isHost, score, className }) => {
  return (
    <div className={`flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
      <span className="text-2xl">{avatar}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-800 truncate">{name}</p>
        {isHost && <span className="text-[10px] bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold uppercase">Host</span>}
      </div>
      {score !== undefined && (
        <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-lg font-bold">
          {score}
        </div>
      )}
    </div>
  );
};
