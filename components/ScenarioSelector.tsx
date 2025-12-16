import React from 'react';
import { Scenario } from '../types';
import { SCENARIOS } from '../constants';

interface ScenarioSelectorProps {
  selected: Scenario;
  onSelect: (scenario: Scenario) => void;
  disabled?: boolean;
}

const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({ selected, onSelect, disabled }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      {SCENARIOS.map((scenario) => (
        <button
          key={scenario.id}
          onClick={() => onSelect(scenario)}
          disabled={disabled}
          className={`
            flex items-start p-4 rounded-xl border-2 transition-all text-left group
            ${selected.id === scenario.id 
              ? 'border-emerald-500 bg-emerald-500/10' 
              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="text-3xl mr-4 group-hover:scale-110 transition-transform">{scenario.icon}</div>
          <div>
            <h3 className={`font-semibold mb-1 ${selected.id === scenario.id ? 'text-white' : 'text-slate-200'}`}>
              {scenario.title}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {scenario.description}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ScenarioSelector;
