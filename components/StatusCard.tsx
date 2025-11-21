import React from 'react';
import { Loader2, Search, BrainCircuit, CheckCircle2, AlertCircle } from 'lucide-react';

interface StatusCardProps {
  status: 'idle' | 'researching' | 'thinking' | 'complete' | 'error';
  error?: string;
}

export const StatusCard: React.FC<StatusCardProps> = ({ status, error }) => {
  if (status === 'idle') return null;

  if (status === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-6">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
        <div>
          <h3 className="font-medium text-red-800">Generation Failed</h3>
          <p className="text-sm text-red-600 mt-1">{error || "An unexpected error occurred."}</p>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 'researching', label: 'Gathering Facts (Google Search)', icon: Search },
    { id: 'thinking', label: 'Drafting & Reasoning (Gemini 3.0)', icon: BrainCircuit },
    { id: 'complete', label: 'Content Ready', icon: CheckCircle2 },
  ];

  // Determine active index
  const currentIndex = steps.findIndex(s => s.id === status);
  const isComplete = status === 'complete';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Generation Progress</h3>
      <div className="space-y-4">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          // Logic: 
          // If isComplete, all steps are completed.
          // Else, steps before current are done. Current is active. Steps after are pending.
          
          let stepState = 'pending'; // pending, active, completed
          if (isComplete) {
            stepState = 'completed';
          } else if (index < currentIndex) {
            stepState = 'completed';
          } else if (index === currentIndex) {
            stepState = 'active';
          }

          return (
            <div key={step.id} className="flex items-center gap-3">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300
                ${stepState === 'completed' ? 'bg-green-100 text-green-600' : ''}
                ${stepState === 'active' ? 'bg-blue-100 text-blue-600' : ''}
                ${stepState === 'pending' ? 'bg-slate-100 text-slate-400' : ''}
              `}>
                {stepState === 'active' ? <Loader2 className="w-4 h-4 animate-spin" /> : <StepIcon className="w-4 h-4" />}
              </div>
              <span className={`
                text-sm font-medium transition-colors duration-300
                ${stepState === 'active' ? 'text-blue-700' : 'text-slate-600'}
                ${stepState === 'pending' ? 'opacity-50' : ''}
              `}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};