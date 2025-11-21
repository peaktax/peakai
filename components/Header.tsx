import React from 'react';
import { TrendingUp, History } from 'lucide-react';

interface HeaderProps {
  onToggleHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleHistory }) => {
  return (
    <header className="bg-slate-900 text-white p-6 shadow-lg sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white p-1 rounded-lg overflow-hidden">
            <img 
              src="https://peakbcs.com/assets/images/logo.jpg" 
              alt="PEAKtax AI Logo" 
              className="w-10 h-10 object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">PEAKtax AI</h1>
            <p className="text-xs text-slate-400 font-medium">Simplify US Tax Complexity</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1"><TrendingUp size={14}/> Live Search Data</span>
              <span className="flex items-center gap-1">• Gemini 3.0 Thinking</span>
          </div>
          
          <button 
            onClick={onToggleHistory}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-700"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </button>
        </div>
      </div>
    </header>
  );
};