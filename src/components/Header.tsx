import React from 'react';
import { 
  ShieldCheck, 
  Server, 
  Play, 
  FileText, 
  Download, 
  Settings2,
  RefreshCw,
  Cpu
} from 'lucide-react';

interface HeaderProps {
  onOpenModelManager: () => void;
  onOpenTestCaseManager: () => void;
  onOpenExport: () => void;
  onRunBenchmark: () => void;
  isRunning: boolean;
  activeModelCount: number;
  totalTestCaseCount: number;
  executionMode: 'proxy' | 'direct' | 'simulation';
  onChangeExecutionMode: (mode: 'proxy' | 'direct' | 'simulation') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenModelManager,
  onOpenTestCaseManager,
  onOpenExport,
  onRunBenchmark,
  isRunning,
  activeModelCount,
  totalTestCaseCount,
  executionMode,
  onChangeExecutionMode,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Brand & App Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <Cpu className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
                  OpenAI DocBenchmark Studio
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  Kapalı Ağ Uyumlu
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Yerel OpenAI uç noktaları için doküman analizi doğruluk ve hız kıyaslaması
              </p>
            </div>
          </div>

          {/* Controls & Action Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Execution Mode Selector */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                id="mode-proxy-btn"
                type="button"
                onClick={() => onChangeExecutionMode('proxy')}
                title="Express arka uç üzerinden yerel IP adreslerine CORS engeli olmadan sorgu atar"
                className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                  executionMode === 'proxy'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ağ Proxy (LAN)
              </button>
              <button
                id="mode-direct-btn"
                type="button"
                onClick={() => onChangeExecutionMode('direct')}
                title="Doğrudan tarayıcıdan yerel uç noktaya istek gönderir"
                className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                  executionMode === 'direct'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Doğrudan
              </button>
              <button
                id="mode-simulation-btn"
                type="button"
                onClick={() => onChangeExecutionMode('simulation')}
                title="Model yanıtlarını önceden hazırlanmış test çıktısıyla simüle eder"
                className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                  executionMode === 'simulation'
                    ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Simülasyon Modu
              </button>
            </div>

            {/* Management Buttons */}
            <button
              id="open-model-manager-btn"
              type="button"
              onClick={onOpenModelManager}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Server className="w-3.5 h-3.5 text-slate-500" />
              Modeller ({activeModelCount})
            </button>

            <button
              id="open-case-manager-btn"
              type="button"
              onClick={onOpenTestCaseManager}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Test Senaryoları ({totalTestCaseCount})
            </button>

            <button
              id="export-report-btn"
              type="button"
              onClick={onOpenExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Rapor
            </button>

            {/* Primary Action: Run Benchmark */}
            <button
              id="start-benchmark-primary-btn"
              type="button"
              onClick={onRunBenchmark}
              disabled={isRunning || activeModelCount === 0 || totalTestCaseCount === 0}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs transition-all ${
                isRunning
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98'
              }`}
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Kıyaslama Çalışıyor...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Benchmark Başlat
                </>
              )}
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
