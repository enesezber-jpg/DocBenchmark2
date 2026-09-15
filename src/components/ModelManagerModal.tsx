import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Server, 
  Activity, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  RefreshCw,
  Search,
  Sparkles,
  DownloadCloud,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ModelEndpoint, ModelServerType } from '../types';
import { PRESET_SERVER_CONFIGS } from '../data/defaultModels';
import { 
  testEndpointConnection, 
  fetchModelsFromBaseUrl, 
  DiscoveredModel 
} from '../utils/apiClient';

interface ModelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: ModelEndpoint[];
  onUpdateModels: (updated: ModelEndpoint[]) => void;
}

export const ModelManagerModal: React.FC<ModelManagerModalProps> = ({
  isOpen,
  onClose,
  models,
  onUpdateModels,
}) => {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<Record<string, { ok: boolean; latency: number; message: string }>>({});
  
  // Auto-Discovery state
  const [discoveryUrl, setDiscoveryUrl] = useState('http://192.168.1.100:8000/v1');
  const [discoveryApiKey, setDiscoveryApiKey] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredList, setDiscoveredList] = useState<DiscoveredModel[]>([]);
  const [discoveryMessage, setDiscoveryMessage] = useState<string | null>(null);
  const [discoveryIsSimulated, setDiscoveryIsSimulated] = useState(false);

  // Add single model form state
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    serverType: ModelServerType;
    baseUrl: string;
    apiKey: string;
    modelIdentifier: string;
    temperature: number;
    maxTokens: number;
    contextWindow: number;
    isSimulated: boolean;
  }>({
    name: '',
    serverType: 'vllm',
    baseUrl: 'http://192.168.1.100:8000/v1',
    apiKey: '',
    modelIdentifier: 'Qwen/Qwen2.5-72B-Instruct',
    temperature: 0.1,
    maxTokens: 2048,
    contextWindow: 32768,
    isSimulated: false,
  });

  const [formFetchingModels, setFormFetchingModels] = useState(false);
  const [formDiscoveredModels, setFormDiscoveredModels] = useState<DiscoveredModel[]>([]);

  if (!isOpen) return null;

  // Handle auto-discovery from Base URL
  const handleDiscoverModels = async (urlToFetch?: string, keyToFetch?: string) => {
    const targetUrl = urlToFetch || discoveryUrl;
    const targetKey = keyToFetch !== undefined ? keyToFetch : discoveryApiKey;

    if (!targetUrl.trim()) return;

    setIsDiscovering(true);
    setDiscoveryMessage(null);
    try {
      const result = await fetchModelsFromBaseUrl(targetUrl, targetKey);
      setDiscoveredList(result.models);
      setDiscoveryIsSimulated(Boolean(result.isSimulated));
      setDiscoveryMessage(result.message || `${result.models.length} model listelendi.`);
    } catch (err: any) {
      setDiscoveryMessage(err.message || 'Modeller listelenirken hata oluştu.');
    } finally {
      setIsDiscovering(false);
    }
  };

  // Fetch models inside the Add Form
  const handleFetchFormModels = async () => {
    if (!formData.baseUrl.trim()) return;
    setFormFetchingModels(true);
    try {
      const result = await fetchModelsFromBaseUrl(formData.baseUrl, formData.apiKey);
      setFormDiscoveredModels(result.models);
      if (result.models.length > 0) {
        // Auto-select first model if not yet set
        const first = result.models[0];
        setFormData((prev) => ({
          ...prev,
          modelIdentifier: first.id,
          name: prev.name || `${formData.serverType.toUpperCase()} - ${first.name}`,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFormFetchingModels(false);
    }
  };

  // Add a single discovered model to the benchmark
  const handleAddDiscoveredModel = (disc: DiscoveredModel) => {
    const exists = models.some((m) => m.baseUrl === discoveryUrl && m.modelIdentifier === disc.id);
    if (exists) return;

    // Detect server type from url
    let serverType: ModelServerType = 'custom';
    const lower = discoveryUrl.toLowerCase();
    if (lower.includes('11434') || lower.includes('ollama')) serverType = 'ollama';
    else if (lower.includes('8000') || lower.includes('vllm')) serverType = 'vllm';
    else if (lower.includes('1234') || lower.includes('lmstudio')) serverType = 'lmstudio';
    else if (lower.includes('8080') || lower.includes('localai')) serverType = 'localai';

    const newEndpoint: ModelEndpoint = {
      id: `model-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${disc.name || disc.id} (${serverType.toUpperCase()})`,
      serverType,
      baseUrl: discoveryUrl,
      apiKey: discoveryApiKey,
      modelIdentifier: disc.id,
      temperature: 0.1,
      maxTokens: 2048,
      contextWindow: 32768,
      isEnabled: true,
      isSimulated: discoveryIsSimulated,
      lastPingStatus: 'online',
    };

    onUpdateModels([...models, newEndpoint]);
  };

  // Add all discovered models to the benchmark
  const handleAddAllDiscovered = () => {
    let serverType: ModelServerType = 'custom';
    const lower = discoveryUrl.toLowerCase();
    if (lower.includes('11434') || lower.includes('ollama')) serverType = 'ollama';
    else if (lower.includes('8000') || lower.includes('vllm')) serverType = 'vllm';
    else if (lower.includes('1234') || lower.includes('lmstudio')) serverType = 'lmstudio';
    else if (lower.includes('8080') || lower.includes('localai')) serverType = 'localai';

    const newOnes: ModelEndpoint[] = [];

    discoveredList.forEach((disc) => {
      const alreadyExists = models.some(
        (m) => m.baseUrl === discoveryUrl && m.modelIdentifier === disc.id
      );
      if (!alreadyExists) {
        newOnes.push({
          id: `model-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: `${disc.name || disc.id} (${serverType.toUpperCase()})`,
          serverType,
          baseUrl: discoveryUrl,
          apiKey: discoveryApiKey,
          modelIdentifier: disc.id,
          temperature: 0.1,
          maxTokens: 2048,
          contextWindow: 32768,
          isEnabled: true,
          isSimulated: discoveryIsSimulated,
          lastPingStatus: 'online',
        });
      }
    });

    if (newOnes.length > 0) {
      onUpdateModels([...models, ...newOnes]);
    }
  };

  const handleTestPing = async (model: ModelEndpoint) => {
    setTestingId(model.id);
    const result = await testEndpointConnection(model);
    setPingResults((prev) => ({
      ...prev,
      [model.id]: result,
    }));

    const updated = models.map((m) => {
      if (m.id === model.id) {
        return {
          ...m,
          lastPingMs: result.latency,
          lastPingStatus: result.ok ? ('online' as const) : ('offline' as const),
        };
      }
      return m;
    });
    onUpdateModels(updated);
    setTestingId(null);
  };

  const handleToggleEnable = (id: string) => {
    const updated = models.map((m) => {
      if (m.id === id) {
        return { ...m, isEnabled: !m.isEnabled };
      }
      return m;
    });
    onUpdateModels(updated);
  };

  const handleDeleteModel = (id: string) => {
    onUpdateModels(models.filter((m) => m.id !== id));
  };

  const handleSelectPreset = (preset: typeof PRESET_SERVER_CONFIGS[0]) => {
    setDiscoveryUrl(preset.defaultUrl);
    setDiscoveryApiKey(preset.defaultKey);
    setFormData((prev) => ({
      ...prev,
      serverType: preset.type as ModelServerType,
      baseUrl: preset.defaultUrl,
      apiKey: preset.defaultKey,
      modelIdentifier: preset.suggestedModels[0] || prev.modelIdentifier,
      name: `${preset.label.split(' ')[0]} - ${preset.suggestedModels[0] || 'Model'}`,
    }));

    // Trigger auto-discovery immediately for this preset URL
    handleDiscoverModels(preset.defaultUrl, preset.defaultKey);
  };

  const handleSaveNewModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.baseUrl || !formData.modelIdentifier) return;

    const newModel: ModelEndpoint = {
      id: `model-${Date.now()}`,
      name: formData.name,
      serverType: formData.serverType,
      baseUrl: formData.baseUrl,
      apiKey: formData.apiKey,
      modelIdentifier: formData.modelIdentifier,
      temperature: formData.temperature,
      maxTokens: formData.maxTokens,
      contextWindow: formData.contextWindow,
      isEnabled: true,
      isSimulated: formData.isSimulated,
      lastPingStatus: 'untested',
    };

    onUpdateModels([...models, newModel]);
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Kapalı Ağ OpenAI Model Uç Noktaları & Otomatik Model Keşfi
              </h2>
              <p className="text-xs text-slate-500">
                Base URL verin, sistem sunucunuzdaki tüm modelleri (<code className="font-mono text-slate-700">/v1/models</code>) otomatik listelesin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* 1. AUTO-DISCOVERY SCANNER TOOL */}
          <div className="p-4 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Base URL ile Modelleri Otomatik Tara ve Listele</span>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[11px] text-slate-500 font-medium">Hızlı Şablonlar:</span>
                {PRESET_SERVER_CONFIGS.slice(0, 4).map((preset) => (
                  <button
                    key={preset.type}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 text-[10px] font-medium transition-colors"
                  >
                    {preset.type.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* URL Input Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-6">
                <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
                  Base URL (OpenAI Uyumlu Uç Nokta)
                </label>
                <input
                  type="text"
                  value={discoveryUrl}
                  onChange={(e) => setDiscoveryUrl(e.target.value)}
                  placeholder="http://192.168.1.100:8000/v1 veya http://localhost:11434/v1"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
                  API Key (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={discoveryApiKey}
                  onChange={(e) => setDiscoveryApiKey(e.target.value)}
                  placeholder="sk-local (boş kalabilir)"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-3 flex items-end">
                <button
                  type="button"
                  onClick={() => handleDiscoverModels()}
                  disabled={isDiscovering || !discoveryUrl.trim()}
                  className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs text-white shadow-xs transition-all ${
                    isDiscovering
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 active:scale-98'
                  }`}
                >
                  {isDiscovering ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Taranıyor...
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

            {/* Discovery Status Message */}
            {discoveryMessage && (
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-indigo-100">
                <span className="text-slate-600 font-medium">{discoveryMessage}</span>
                {discoveredList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAddAllDiscovered}
                    className="inline-flex items-center gap-1 text-indigo-700 hover:text-indigo-900 font-bold"
                  >
                    <DownloadCloud className="w-3.5 h-3.5" />
                    Tümünü Benchmark'a Ekle ({discoveredList.length} Model)
                  </button>
                )}
              </div>
            )}

            {/* Discovered Models List Cards */}
            {discoveredList.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {discoveredList.map((disc) => {
                  const isAlreadyAdded = models.some(
                    (m) => m.baseUrl === discoveryUrl && m.modelIdentifier === disc.id
                  );

                  return (
                    <div
                      key={disc.id}
                      className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-2 shadow-2xs hover:border-indigo-300 transition-colors"
                    >
                      <div className="overflow-hidden">
                        <div className="font-semibold text-slate-900 truncate" title={disc.id}>
                          {disc.name || disc.id}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 truncate">
                          ID: {disc.id} {disc.owned_by ? `(${disc.owned_by})` : ''}
                        </div>
                      </div>

                      {isAlreadyAdded ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium shrink-0">
                          <Check className="w-3 h-3" />
                          Eklendi
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddDiscoveredModel(disc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-[10px] shrink-0 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Benchmark'a Ekle
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. REGISTERED MODELS LIST */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">
                  Benchmark'ta Kayıtlı Modeller ({models.length})
                </span>
                <span className="text-[11px] text-slate-500 ml-2">
                  ({models.filter((m) => m.isEnabled).length} aktif)
                </span>
              </div>
              {!isAdding && (
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-medium shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Özel Model Tanımla
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {models.map((m) => {
                const isPinging = testingId === m.id;
                const pingResult = pingResults[m.id];

                return (
                  <div key={m.id} className="p-3.5 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={m.isEnabled}
                          onChange={() => handleToggleEnable(m.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          title="Benchmark'a Dahil Et"
                        />
                        <span className="font-bold text-slate-900 text-xs">{m.name}</span>
                        <span className="uppercase text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                          {m.serverType}
                        </span>
                        {m.isSimulated && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-medium">
                            Simülasyon
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 pl-6 flex flex-wrap items-center gap-x-3">
                        <span>URL: {m.baseUrl}</span>
                        <span>Model: {m.modelIdentifier}</span>
                        <span>Sıcaklık: {m.temperature}</span>
                      </div>
                    </div>

                    {/* Actions & Status */}
                    <div className="flex items-center gap-2 pl-6 sm:pl-0">
                      {/* Test Ping Button */}
                      <button
                        type="button"
                        onClick={() => handleTestPing(m)}
                        disabled={isPinging}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-medium shadow-2xs transition-colors"
                      >
                        <Activity className={`w-3 h-3 ${isPinging ? 'animate-spin text-indigo-600' : 'text-slate-400'}`} />
                        {isPinging ? 'Test Ediliyor...' : 'Bağlantı Testi'}
                      </button>

                      {/* Ping result status */}
                      {pingResult && (
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded flex items-center gap-1 ${
                            pingResult.ok
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                          title={pingResult.message}
                        >
                          {pingResult.ok ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {pingResult.ok ? `${pingResult.latency}ms` : 'Ulaşılamadı'}
                        </span>
                      )}

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteModel(m.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Modeli Kaldır"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. DETAILED MANUAL / CUSTOM ADD FORM */}
          {isAdding && (
            <form onSubmit={handleSaveNewModel} className="p-5 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                <h3 className="font-semibold text-slate-900 text-xs">Özel Model Parametreleri Tanımla</h3>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-slate-500 hover:text-slate-800 text-xs"
                >
                  İptal
                </button>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-slate-700">Base URL (Kapalı Ağ IP/Port)</label>
                    <button
                      type="button"
                      onClick={handleFetchFormModels}
                      disabled={formFetchingModels || !formData.baseUrl}
                      className="text-[11px] text-indigo-700 hover:text-indigo-900 font-semibold inline-flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${formFetchingModels ? 'animate-spin' : ''}`} />
                      Bu URL'deki Modelleri Listele
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.baseUrl}
                    onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                    placeholder="http://192.168.1.50:8000/v1 veya http://localhost:11434/v1"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                {/* Model Identifier (Select or text) */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Model Kimliği (Model ID)
                  </label>
                  {formDiscoveredModels.length > 0 ? (
                    <div className="space-y-1.5">
                      <select
                        value={formData.modelIdentifier}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({
                            ...formData,
                            modelIdentifier: val,
                            name: formData.name || val,
                          });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-indigo-300 bg-white text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      >
                        {formDiscoveredModels.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name || m.id} {m.owned_by ? `(${m.owned_by})` : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-emerald-700 font-medium">
                        ✓ Sunucudan {formDiscoveredModels.length} model listelendi. Listeden seçebilir veya aşağıya manuel yazabilirsiniz.
                      </p>
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      value={formData.modelIdentifier}
                      onChange={(e) => setFormData({ ...formData, modelIdentifier: e.target.value })}
                      placeholder="Qwen/Qwen2.5-72B-Instruct veya llama3.3:70b"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Model Görünen Başlığı</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Örn: vLLM - Qwen 2.5 72B"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Sunucu Türü</label>
                  <select
                    value={formData.serverType}
                    onChange={(e) => setFormData({ ...formData, serverType: e.target.value as ModelServerType })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="vllm">vLLM</option>
                    <option value="ollama">Ollama</option>
                    <option value="lmstudio">LM Studio</option>
                    <option value="localai">LocalAI</option>
                    <option value="tgi">Text Generation Inference (TGI)</option>
                    <option value="custom">Özel OpenAI Uyumlu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">API Key (Opsiyonel)</label>
                  <input
                    type="text"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder="sk-local (boş bırakılabilir)"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Sıcaklık (Temperature)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                >
                  Modeli Kaydet
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 text-xs shadow-xs"
          >
            Tamamla
          </button>
        </div>

      </div>
    </div>
  );
};
