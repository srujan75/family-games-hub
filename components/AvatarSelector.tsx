import React from 'react';
import { AVATARS } from '@/lib/gameConstants';

interface AvatarSelectorProps {
  selectedAvatar: string;
  onSelect: (avatar: string) => void;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({ selectedAvatar, onSelect }) => {
  return (
    <div className="grid grid-cols-5 gap-3 p-4 bg-white rounded-2xl shadow-inner max-h-48 overflow-y-auto">
      {AVATARS.map((avatar) => (
        <button
          key={avatar}
          type="button"
          onClick={() => onSelect(avatar)}
          className={`text-3xl p-2 rounded-xl transition-all ${
            selectedAvatar === avatar 
              ? 'bg-blue-500 scale-110 shadow-lg' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {avatar}
        </button>
      ))}
    </div>
  );
};
