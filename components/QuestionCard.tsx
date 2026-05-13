import React from 'react';

interface QuestionCardProps {
  question: string;
  options: string[];
  onSelect: (answer: string) => void;
  selectedAnswer?: string;
  disabled?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, options, onSelect, selectedAnswer, disabled }) => {
  return (
    <div className="w-full space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-black text-slate-800 leading-tight text-center">
          {question}
        </h2>
      </div>

      <div className="grid gap-3">
        {options.map((option, index) => (
          <button
            key={index}
            disabled={disabled}
            onClick={() => onSelect(option)}
            className={`w-full p-5 rounded-2xl font-bold text-lg transition-all text-left flex items-center gap-4 ${
              selectedAnswer === option 
                ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-100' 
                : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-100'
            } ${disabled && selectedAnswer !== option ? 'opacity-50' : ''}`}
          >
            <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-black ${
              selectedAnswer === option ? 'bg-white/20' : 'bg-slate-100'
            }`}>
              {String.fromCharCode(65 + index)}
            </div>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};
