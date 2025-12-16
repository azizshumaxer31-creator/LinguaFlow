import React from 'react';
import { Language } from '../types';
import { LANGUAGES } from '../constants';

interface LanguageSelectorProps {
  selected: Language;
  onSelect: (lang: Language) => void;
  disabled?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selected, onSelect, disabled }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 w-full">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.id}
          onClick={() => onSelect(lang)}
          disabled={disabled}
          className={`
            flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all
            ${selected.id === lang.id 
              ? 'border-blue-500 bg-blue-500/10 text-white' 
              : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:bg-slate-800'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span className="text-2xl mb-2">{lang.flag}</span>
          <span className="font-medium text-sm">{lang.name}</span>
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;
