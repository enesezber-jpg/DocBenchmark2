import React from 'react';
import { RefreshCw, Square, CheckCircle2 } from 'lucide-react';

interface BenchmarkRunnerBarProps {
  isRunning: boolean;
  currentStep: number;
  totalSteps: number;
  currentModelName: string;
  currentTestCaseTitle: string;
  onStop: () => void;
}

export const BenchmarkRunnerBar: React.FC<BenchmarkRunnerBarProps> = ({
  isRunning,
  currentStep,
  totalSteps,
  currentModelName,
  currentTestCaseTitle,
  onStop,
}) => {
  if (!isRunning && currentStep === 0) return null;

  const percentage = totalSteps > 0 ? Math.min(100, Math.round((currentStep / totalSteps) * 100)) : 0;
  const isComplete = !isRunning && currentStep >= totalSteps && totalSteps > 0;

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      isComplete 
        ? 'bg-emerald-50/70 border-emerald-200' 
        : 'bg-white border-slate-200 shadow-xs'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {isRunning ? (
            <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
          ) : isComplete ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : null}
          <span className="text-xs font-semibold text-slate-900">
            {isRunning 
              ? `Benchmark İşleniyor (${currentStep} / ${totalSteps})` 
              : isComplete 
              ? 'Tüm Doküman Testleri Tamamlandı' 
              : 'Kıyaslama Durduruldu'}
          </span>
          <span className="text-xs font-mono font-medium text-slate-500">
            %{percentage}
          </span>
        </div>

        {isRunning && (
          <button
            type="button"
            onClick={onStop}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 transition-colors"
          >
            <Square className="w-3 h-3 fill-current" />
            Durdur
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
        <div 
          className={`h-full transition-all duration-300 ${
            isComplete ? 'bg-emerald-600' : 'bg-indigo-600'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Current Execution Details */}
      {isRunning && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
          <div>
            <span className="text-slate-400">Model:</span>{' '}
            <span className="font-semibold text-slate-800">{currentModelName || 'Hazırlanıyor...'}</span>
          </div>
          <div>
            <span className="text-slate-400">Test:</span>{' '}
            <span className="font-medium text-slate-700">{currentTestCaseTitle || 'Bekleniyor...'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
