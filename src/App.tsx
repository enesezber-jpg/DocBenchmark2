import React, { useState, useMemo, useRef, useCallback } from 'react';
import { 
  DEFAULT_MODELS 
} from './data/defaultModels';
import { 
  DEFAULT_BENCHMARK_CASES 
} from './data/benchmarkCases';
import { 
  ModelEndpoint, 
  TestCase, 
  SingleEvaluationResult 
} from './types';
import { calculateModelStats } from './utils/stats';
import { 
  executeModelInference, 
  getInitialBenchmarkResults,
  fetchModelsFromBaseUrl,
  DiscoveredModel 
} from './utils/apiClient';

// Components
import { Header } from './components/Header';
import { OverviewCards } from './components/OverviewCards';
import { BenchmarkRunnerBar } from './components/BenchmarkRunnerBar';
import { ComparisonMatrix } from './components/ComparisonMatrix';
import { SideBySideInspector } from './components/SideBySideInspector';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { ModelManagerModal } from './components/ModelManagerModal';
import { TestCaseManagerModal } from './components/TestCaseManagerModal';
import { ExportModal } from './components/ExportModal';

import { ShieldCheck, Info, Sparkles, Terminal, Search, Plus, Check, DownloadCloud, RefreshCw } from 'lucide-react';

export default function App() {
  const [models, setModels] = useState<ModelEndpoint[]>(DEFAULT_MODELS);
  const [testCases, setTestCases] = useState<TestCase[]>(DEFAULT_BENCHMARK_CASES);
  
  // Quick Base URL discovery on the main dashboard
  const [quickBaseUrl, setQuickBaseUrl] = useState('http://192.168.1.100:8000/v1');
  const [quickApiKey, setQuickApiKey] = useState('');
  const [isQuickScanning, setIsQuickScanning] = useState(false);
  const [quickDiscoveredModels, setQuickDiscoveredModels] = useState<DiscoveredModel[]>([]);
  const [quickScanStatus, setQuickScanStatus] = useState<string | null>(null);
  
  // Initialize with comprehensive benchmark results so user sees immediate comparative insights
  const [results, setResults] = useState<Record<string, SingleEvaluationResult>>(() =>
    getInitialBenchmarkResults(DEFAULT_MODELS, DEFAULT_BENCHMARK_CASES)
  );

  const [executionMode, setExecutionMode] = useState<'proxy' | 'direct' | 'simulation'>('simulation');
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [currentModelName, setCurrentModelName] = useState('');
  const [currentTestCaseTitle, setCurrentTestCaseTitle] = useState('');

  // Selected cell for deep inspection
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string>(
    DEFAULT_BENCHMARK_CASES[0]?.id || ''
  );
  const [selectedModelId, setSelectedModelId] = useState<string>(
    DEFAULT_MODELS[0]?.id || ''
  );

  // Modals
  const [isModelManagerOpen, setIsModelManagerOpen] = useState(false);
  const [isTestCaseManagerOpen, setIsTestCaseManagerOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [showNetworkGuide, setShowNetworkGuide] = useState(true);

  const stopSignalRef = useRef(false);

  // Calculate statistics across all models
  const aggregatedStats = useMemo(() => {
    return calculateModelStats(models, testCases, results);
  }, [models, testCases, results]);

  const activeModels = useMemo(() => models.filter((m) => m.isEnabled), [models]);

  // Handle cell selection
  const handleSelectCell = (modelId: string, testCaseId: string) => {
    setSelectedModelId(modelId);
    setSelectedTestCaseId(testCaseId);
    
    // Smooth scroll to inspector
    const element = document.getElementById('inspector-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Run full benchmark
  const handleRunBenchmark = useCallback(async () => {
    if (isRunning) return;

    stopSignalRef.current = false;
    setIsRunning(true);

    const activeList = models.filter((m) => m.isEnabled);
    const stepsTotal = activeList.length * testCases.length;
    setTotalSteps(stepsTotal);
    setCurrentStep(0);

    let stepCount = 0;

    for (const model of activeList) {
      if (stopSignalRef.current) break;

      setCurrentModelName(model.name);

      for (const tc of testCases) {
        if (stopSignalRef.current) break;

        setCurrentTestCaseTitle(tc.title);

        try {
          const evalResult = await executeModelInference(model, tc, executionMode);
          const key = `${model.id}_${tc.id}`;
          setResults((prev) => ({
            ...prev,
            [key]: evalResult,
          }));
        } catch (err: any) {
          console.error('Benchmark case error:', err);
        }

        stepCount++;
        setCurrentStep(stepCount);
      }
    }

    setIsRunning(false);
    setCurrentModelName('');
    setCurrentTestCaseTitle('');
  }, [isRunning, models, testCases, executionMode]);

  const handleStopBenchmark = () => {
    stopSignalRef.current = true;
    setIsRunning(false);
  };

  const handleResetDefaults = () => {
    setTestCases(DEFAULT_BENCHMARK_CASES);
    setModels(DEFAULT_MODELS);
    setResults(getInitialBenchmarkResults(DEFAULT_MODELS, DEFAULT_BENCHMARK_CASES));
  };

  // Quick Discovery Handlers
  const handleQuickScan = async () => {
    if (!quickBaseUrl.trim()) return;
    setIsQuickScanning(true);
    setQuickScanStatus(null);
    try {
      const res = await fetchModelsFromBaseUrl(
        quickBaseUrl,
        quickApiKey,
        executionMode === 'simulation'
      );
      setQuickDiscoveredModels(res.models);
      setQuickScanStatus(res.message || `${res.models.length} model listelendi.`);
    } catch (err: any) {
      setQuickScanStatus(err.message || 'Modeller listelenemedi.');
    } finally {
      setIsQuickScanning(false);
    }
  };

  const handleQuickAddModel = (disc: DiscoveredModel) => {
    const already = models.some(
      (m) => m.baseUrl === quickBaseUrl && m.modelIdentifier === disc.id
    );
    if (already) return;

    let serverType: ModelEndpoint['serverType'] = 'custom';
    const lower = quickBaseUrl.toLowerCase();
    if (lower.includes('11434') || lower.includes('ollama')) serverType = 'ollama';
    else if (lower.includes('8000') || lower.includes('vllm')) serverType = 'vllm';
    else if (lower.includes('1234') || lower.includes('lmstudio')) serverType = 'lmstudio';
    else if (lower.includes('8080') || lower.includes('localai')) serverType = 'localai';

    const newEndpoint: ModelEndpoint = {
      id: `model-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${disc.name || disc.id} (${serverType.toUpperCase()})`,
      serverType,
      baseUrl: quickBaseUrl,
      apiKey: quickApiKey,
      modelIdentifier: disc.id,
      temperature: 0.1,
      maxTokens: 2048,
      contextWindow: 32768,
      isEnabled: true,
      isSimulated: executionMode === 'simulation',
      lastPingStatus: 'online',
    };

    setModels([...models, newEndpoint]);
  };

  const handleQuickAddAll = () => {
    let serverType: ModelEndpoint['serverType'] = 'custom';
    const lower = quickBaseUrl.toLowerCase();
    if (lower.includes('11434') || lower.includes('ollama')) serverType = 'ollama';
    else if (lower.includes('8000') || lower.includes('vllm')) serverType = 'vllm';
    else if (lower.includes('1234') || lower.includes('lmstudio')) serverType = 'lmstudio';
    else if (lower.includes('8080') || lower.includes('localai')) serverType = 'localai';

    const toAdd: ModelEndpoint[] = [];
    quickDiscoveredModels.forEach((disc) => {
      const already = models.some(
        (m) => m.baseUrl === quickBaseUrl && m.modelIdentifier === disc.id
      );
      if (!already) {
        toAdd.push({
          id: `model-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: `${disc.name || disc.id} (${serverType.toUpperCase()})`,
          serverType,
          baseUrl: quickBaseUrl,
          apiKey: quickApiKey,
          modelIdentifier: disc.id,
          temperature: 0.1,
          maxTokens: 2048,
          contextWindow: 32768,
          isEnabled: true,
          isSimulated: executionMode === 'simulation',
          lastPingStatus: 'online',
        });
      }
    });

    if (toAdd.length > 0) {
      setModels([...models, ...toAdd]);
    }
  };

  // Currently inspected test case
  const currentInspectCase = testCases.find((tc) => tc.id === selectedTestCaseId) || testCases[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      
      {/* Top Header & Action Controls */}
      <Header
        activeModelCount={activeModels.length}
        totalTestCaseCount={testCases.length}
        isRunning={isRunning}
        executionMode={executionMode}
        onChangeExecutionMode={setExecutionMode}
        onOpenModelManager={() => setIsModelManagerOpen(true)}
        onOpenTestCaseManager={() => setIsTestCaseManagerOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onRunBenchmark={handleRunBenchmark}
      />

      {/* Main App Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Closed Network Architecture Banner */}
        {showNetworkGuide && (
          <div className="rounded-xl border border-indigo-200 bg-linear-to-r from-indigo-50 via-white to-slate-50 p-4 shadow-2xs relative">
            <button
              type="button"
              onClick={() => setShowNetworkGuide(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 text-xs"
              title="Kapat"
            >
              ×
            </button>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs space-y-1 pr-6">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Kapalı Ağ (Air-Gapped / Intranet) Doküman Analizi Benchmark Paneli
                  </h3>
                  <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                    %100 Yerel Veri Gizliliği
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Bu uygulama, kapalı ağınızdaki PC veya sunucularda çalışan generic OpenAI uyumlu API'leri (vLLM, Ollama, LM Studio, LocalAI) 
                  hukuki sözleşmeler, finansal bilançolar, teknik şartnameler ve fatura şemaları üzerinde kıyaslar.
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-3 text-slate-600 font-medium text-[11px]">
                  <span className="flex items-center gap-1 text-indigo-700">
                    <Terminal className="w-3.5 h-3.5" />
                    <strong>Yerel Çalıştırma:</strong> Bu projeyi kapalı ağdaki PC'nizde <code className="bg-slate-200 px-1 py-0.2 rounded font-mono">npm run dev</code> ile doğrudan çalıştırabilirsiniz.
                  </span>
                  <span>•</span>
                  <span><strong>Mod:</strong> {executionMode === 'simulation' ? 'Simülasyon Aktif (Canlı önizleme için)' : executionMode === 'proxy' ? 'Ağ Proxy (Express LAN yönlendirmesi)' : 'Doğrudan Tarayıcı İsteği'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QUICK AUTO-DISCOVERY BAR: "Generic OpenAPI & Base URL verince modelleri otomatik listele" */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-700">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Uç Noktadan Otomatik Model Keşfi (Auto-Discovery)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Generic OpenAI uyumlu Base URL adresinizi girin, sunucudaki tüm modeller otomatik listelensin.
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setIsModelManagerOpen(true)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold self-start sm:self-auto"
            >
              Gelişmiş Model Yöneticisi →
            </button>
          </div>

          {/* Input & Action */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-6">
              <input
                type="text"
                value={quickBaseUrl}
                onChange={(e) => setQuickBaseUrl(e.target.value)}
                placeholder="Base URL: http://192.168.1.100:8000/v1 veya http://localhost:11434/v1"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50/60 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-hidden"
              />
            </div>
            <div className="sm:col-span-3">
              <input
                type="text"
                value={quickApiKey}
                onChange={(e) => setQuickApiKey(e.target.value)}
                placeholder="API Key (varsa, opsiyonel)"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50/60 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-hidden"
              />
            </div>
            <div className="sm:col-span-3">
              <button
                type="button"
                onClick={handleQuickScan}
                disabled={isQuickScanning || !quickBaseUrl.trim()}
                className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs text-white shadow-xs transition-all ${
                  isQuickScanning
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-98'
                }`}
              >
                {isQuickScanning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Modeller Çekiliyor...
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    Modelleri Otomatik Listele
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Scan Results & Model Cards */}
          {quickScanStatus && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium text-[11px]">{quickScanStatus}</span>
              {quickDiscoveredModels.length > 0 && (
                <button
                  type="button"
                  onClick={handleQuickAddAll}
                  className="inline-flex items-center gap-1 text-indigo-700 hover:text-indigo-900 font-bold text-[11px]"
                >
                  <DownloadCloud className="w-3.5 h-3.5" />
                  Tümünü Benchmark'a Ekle ({quickDiscoveredModels.length} Model)
                </button>
              )}
            </div>
          )}

          {quickDiscoveredModels.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
              {quickDiscoveredModels.map((disc) => {
                const isAdded = models.some(
                  (m) => m.baseUrl === quickBaseUrl && m.modelIdentifier === disc.id
                );

                return (
                  <div
                    key={disc.id}
                    className="p-2 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-2 text-xs hover:border-indigo-300 transition-colors"
                  >
                    <div className="overflow-hidden">
                      <div className="font-semibold text-slate-800 text-[11px] truncate" title={disc.id}>
                        {disc.name || disc.id}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 truncate">
                        ID: {disc.id}
                      </div>
                    </div>

                    {isAdded ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-medium shrink-0">
                        <Check className="w-3 h-3" />
                        Eklendi
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleQuickAddModel(disc)}
                        className="inline-flex items-center gap-0.5 px-2 py-1 rounded bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-300 hover:border-indigo-300 font-semibold text-[10px] shrink-0 shadow-2xs transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Ekle
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Benchmark Execution Bar (when active or finished) */}
        <BenchmarkRunnerBar
          isRunning={isRunning}
          currentStep={currentStep}
          totalSteps={totalSteps}
          currentModelName={currentModelName}
          currentTestCaseTitle={currentTestCaseTitle}
          onStop={handleStopBenchmark}
        />

        {/* 1. Executive Summary / KPI Cards */}
        <section aria-label="Genel Performans Göstergeleri">
          <OverviewCards
            stats={aggregatedStats}
            totalRuns={Object.keys(results).length}
          />
        </section>

        {/* 2. Interactive Comparison Matrix (Rows: Cases, Cols: Models) */}
        <section aria-label="Model Karşılaştırma Matrisi">
          <ComparisonMatrix
            models={models}
            testCases={testCases}
            results={results}
            onSelectCell={handleSelectCell}
            selectedTestCaseId={selectedTestCaseId}
            selectedModelId={selectedModelId}
          />
        </section>

        {/* 3. Deep-Dive Side-by-Side Document & Answer Inspector */}
        <section id="inspector-section" aria-label="Detaylı Yan Yana Doküman İncelemesi">
          {currentInspectCase && (
            <SideBySideInspector
              testCase={currentInspectCase}
              models={models}
              results={results}
              activeModelId={selectedModelId}
              onSelectModelId={(modelId) => setSelectedModelId(modelId)}
            />
          )}
        </section>

        {/* 4. Category Breakdown Analysis */}
        <section aria-label="Doküman Türlerine Göre Başarım Analizi">
          <CategoryBreakdown stats={aggregatedStats} />
        </section>

      </main>

      {/* Modals */}
      <ModelManagerModal
        isOpen={isModelManagerOpen}
        onClose={() => setIsModelManagerOpen(false)}
        models={models}
        onUpdateModels={setModels}
      />

      <TestCaseManagerModal
        isOpen={isTestCaseManagerOpen}
        onClose={() => setIsTestCaseManagerOpen(false)}
        testCases={testCases}
        onUpdateTestCases={setTestCases}
        onResetDefaults={handleResetDefaults}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        models={models}
        testCases={testCases}
        results={results}
        stats={aggregatedStats}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">OpenAI DocBenchmark Studio</span>
            <span>—</span>
            <span>Kapalı Ağ Modelleri İçin Doküman Analizi ve Doğruluk Değerlendirme Aracı</span>
          </div>
          <div>
            <span>Aktif Modeller: {activeModels.length} | Test Senaryoları: {testCases.length}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
