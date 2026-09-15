import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  FileText, 
  Trash2, 
  Upload, 
  BookOpen,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { TestCase, BenchmarkCategory, EvaluationMode } from '../types';
import { getCategoryLabel } from '../utils/stats';

interface TestCaseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  testCases: TestCase[];
  onUpdateTestCases: (updated: TestCase[]) => void;
  onResetDefaults: () => void;
}

export const TestCaseManagerModal: React.FC<TestCaseManagerModalProps> = ({
  isOpen,
  onClose,
  testCases,
  onUpdateTestCases,
  onResetDefaults,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newCase, setNewCase] = useState<{
    title: string;
    category: BenchmarkCategory;
    documentTitle: string;
    documentContent: string;
    prompt: string;
    groundTruth: string;
    evaluationMode: EvaluationMode;
    weight: number;
    expectedEntitiesStr: string;
  }>({
    title: '',
    category: 'legal',
    documentTitle: '',
    documentContent: '',
    prompt: '',
    groundTruth: '',
    evaluationMode: 'entity_f1',
    weight: 3,
    expectedEntitiesStr: '',
  });

  if (!isOpen) return null;

  const handleDeleteCase = (id: string) => {
    onUpdateTestCases(testCases.filter((tc) => tc.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setNewCase((prev) => ({
        ...prev,
        documentTitle: file.name.replace(/\.[^/.]+$/, ''),
        documentContent: content,
      }));
    };
    reader.readAsText(file);
  };

  const handleSaveNewCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCase.title || !newCase.documentContent || !newCase.prompt || !newCase.groundTruth) {
      return;
    }

    const entities = newCase.expectedEntitiesStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const created: TestCase = {
      id: `custom-case-${Date.now()}`,
      title: newCase.title,
      category: newCase.category,
      documentTitle: newCase.documentTitle || 'Özel Doküman',
      documentContent: newCase.documentContent,
      prompt: newCase.prompt,
      groundTruth: newCase.groundTruth,
      evaluationMode: newCase.evaluationMode,
      expectedEntities: entities.length > 0 ? entities : undefined,
      weight: newCase.weight,
      isCustom: true,
    };

    onUpdateTestCases([...testCases, created]);
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Doküman Analiz Test Senaryoları & Referans Değerler
              </h2>
              <p className="text-xs text-slate-500">
                Modellerin doğruluk puanını ölçecek test dokümanlarını ve altın standart cevapları yönetin
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

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Top Actions */}
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800">
              Mevcut Test Senaryoları ({testCases.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onResetDefaults}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-medium text-xs"
              >
                Varsayılanları Geri Yükle
              </button>
              {!isAdding && (
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Özel Test Senaryosu Ekle
                </button>
              )}
            </div>
          </div>

          {/* Test Case Cards */}
          <div className="space-y-3">
            {testCases.map((tc) => (
              <div
                key={tc.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {getCategoryLabel(tc.category)}
                      </span>
                      <h4 className="font-bold text-slate-900 text-xs">{tc.title}</h4>
                      {tc.isCustom && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium">
                          Özel Senaryo
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Doküman: <span className="font-medium text-slate-700">{tc.documentTitle}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteCase(tc.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Senaryoyu Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[11px]">
                  <div className="p-2 rounded bg-slate-50">
                    <span className="font-semibold text-slate-700 block mb-0.5">Soru / İstem:</span>
                    <p className="text-slate-600 line-clamp-2">{tc.prompt}</p>
                  </div>
                  <div className="p-2 rounded bg-emerald-50/60 border border-emerald-100">
                    <span className="font-semibold text-emerald-800 block mb-0.5">Referans Doğruluk Değeri:</span>
                    <p className="text-emerald-950 font-mono line-clamp-2">{tc.groundTruth}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Form */}
          {isAdding && (
            <form onSubmit={handleSaveNewCase} className="p-5 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                <h3 className="font-bold text-slate-900 text-xs">Yeni Özel Test Senaryosu Oluştur</h3>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-slate-500 hover:text-slate-800 text-xs"
                >
                  İptal
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Senaryo Başlığı</label>
                  <input
                    type="text"
                    required
                    value={newCase.title}
                    onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                    placeholder="Örn: Gizlilik Sözleşmesi Cezai Şart Çıkarımı"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Kategori</label>
                  <select
                    value={newCase.category}
                    onChange={(e) => setNewCase({ ...newCase, category: e.target.value as BenchmarkCategory })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="legal">Hukuk & Sözleşme</option>
                    <option value="financial">Finansal & Bilanço</option>
                    <option value="technical">Teknik Şartname</option>
                    <option value="structured_json">Yapısal JSON</option>
                    <option value="hallucination">Halüsinasyon & Negatif</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-slate-700">Doküman Metni</label>
                    <label className="cursor-pointer inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-medium">
                      <Upload className="w-3 h-3" />
                      Dosyadan Yükle (.txt, .md, .json)
                      <input
                        type="file"
                        accept=".txt,.md,.json,.csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <textarea
                    required
                    rows={4}
                    value={newCase.documentContent}
                    onChange={(e) => setNewCase({ ...newCase, documentContent: e.target.value })}
                    placeholder="Analiz edilecek dokümanın tam metnini buraya yapıştırınız..."
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Modele İletilecek Soru / Görev (Prompt)</label>
                  <textarea
                    required
                    rows={2}
                    value={newCase.prompt}
                    onChange={(e) => setNewCase({ ...newCase, prompt: e.target.value })}
                    placeholder="Örn: Bu sözleşmede cezai şart oranı ve yetkili mahkeme nedir?"
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Referans Doğruluk Değeri (Altın Standart / Ground Truth)
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={newCase.groundTruth}
                    onChange={(e) => setNewCase({ ...newCase, groundTruth: e.target.value })}
                    placeholder="Modelin çıktısının karşılaştırılacağı kesin doğru cevap..."
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Zorunlu Beklenen Anahtar Varlıklar (Virgülle ayırın)
                  </label>
                  <input
                    type="text"
                    value={newCase.expectedEntitiesStr}
                    onChange={(e) => setNewCase({ ...newCase, expectedEntitiesStr: e.target.value })}
                    placeholder="Örn: %15, Ankara Mahkemeleri, 30 gün"
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
                  Senaryoyu Kaydet
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
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
