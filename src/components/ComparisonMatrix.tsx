import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ChevronRight,
  Filter,
  Sparkles,
  Zap,
  ShieldAlert
} from 'lucide-react';
import { 
  ModelEndpoint, 
  TestCase, 
  SingleEvaluationResult, 
  BenchmarkCategory 
} from '../types';
import { getCategoryLabel } from '../utils/stats';

interface ComparisonMatrixProps {
  models: ModelEndpoint[];
  testCases: TestCase[];
  results: Record<string, SingleEvaluationResult>;
  onSelectCell: (modelId: string, testCaseId: string) => void;
  selectedTestCaseId?: string;
  selectedModelId?: string;
}

export const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({
  models,
  testCases,
  results,
  onSelectCell,
  selectedTestCaseId,
  selectedModelId,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeModels = models.filter((m) => m.isEnabled);

  const filteredCases = testCases.filter((tc) => {
    const matchesCategory = activeCategory === 'all' || tc.category === activeCategory;
    const matchesSearch = 
      tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.documentTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'Tüm Senaryolar' },
    { id: 'legal', label: 'Hukuk & Sözleşme' },
    { id: 'financial', label: 'Finansal & Bilanço' },
    { id: 'technical', label: 'Teknik Şartname' },
    { id: 'structured_json', label: 'Yapısal JSON' },
    { id: 'hallucination', label: 'Halüsinasyon Testi' },
  ];

  const getScoreBadgeClass = (score: number) => {
    if (score >= 90) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 75) return 'bg-teal-50 text-teal-700 border-teal-200';
    if (score >= 60) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <span>Model Doğruluk & Performans Karşılaştırma Matrisi</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium">
              {filteredCases.length} Senaryo x {activeModels.length} Model
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hücrelere tıklayarak modelin orijinal doküman yanıtını ve çıkarım detaylarını inceleyebilirsiniz.
          </p>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Senaryo veya doküman ara..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-48 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 py-2 border-b border-slate-200 bg-white flex items-center gap-1 overflow-x-auto text-xs">
        <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/75">
              <th className="py-3 px-4 font-semibold text-slate-700 min-w-[280px]">
                Doküman & Test Senaryosu
              </th>
              {activeModels.map((model) => {
                // Calculate quick average for column
                let sum = 0;
                let count = 0;
                testCases.forEach((tc) => {
                  const res = results[`${model.id}_${tc.id}`];
                  if (res && res.status === 'success') {
                    sum += res.metrics.compositeAccuracy;
                    count++;
                  }
                });
                const colAvg = count > 0 ? Math.round(sum / count) : null;

                return (
                  <th
                    key={model.id}
                    className="py-3 px-4 font-semibold text-slate-800 min-w-[190px] border-l border-slate-200 text-center"
                  >
                    <div className="font-semibold text-slate-900 truncate" title={model.name}>
                      {model.name}
                    </div>
                    <div className="flex items-center justify-center gap-1.5 mt-1 text-[11px] font-normal text-slate-500">
                      <span className="uppercase tracking-wider font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700">
                        {model.serverType}
                      </span>
                      {colAvg !== null && (
                        <span className={`font-semibold px-1.5 py-0.2 rounded border ${getScoreBadgeClass(colAvg)}`}>
                          Ort. %{colAvg}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredCases.map((tc) => {
              return (
                <tr key={tc.id} className="hover:bg-slate-50/70 transition-colors">
                  
                  {/* Row: Test Case Info */}
                  <td className="py-3 px-4 align-top">
                    <div className="flex items-start gap-2">
                      <div className="p-1 rounded bg-slate-100 text-slate-600 mt-0.5">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium text-slate-900">
                          {tc.title}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span className="font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {getCategoryLabel(tc.category)}
                          </span>
                          <span className="truncate max-w-[200px]" title={tc.documentTitle}>
                            {tc.documentTitle}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Columns: Model Results */}
                  {activeModels.map((model) => {
                    const key = `${model.id}_${tc.id}`;
                    const res = results[key];
                    const isSelected = selectedTestCaseId === tc.id && selectedModelId === model.id;

                    return (
                      <td
                        key={model.id}
                        onClick={() => onSelectCell(model.id, tc.id)}
                        className={`py-3 px-3 align-top border-l border-slate-200 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50/80 ring-2 ring-indigo-500 ring-inset'
                            : 'hover:bg-slate-100/80'
                        }`}
                      >
                        {res ? (
                          res.status === 'success' ? (
                            <div className="space-y-1.5">
                              {/* Score and status */}
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-md border ${getScoreBadgeClass(
                                    res.metrics.compositeAccuracy
                                  )}`}
                                >
                                  %{res.metrics.compositeAccuracy}
                                </span>
                                
                                {res.latencyMs > 0 && (
                                  <span className="text-[11px] text-slate-500 flex items-center gap-0.5">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    {res.latencyMs}ms
                                  </span>
                                )}
                              </div>

                              {/* Metric mini-indicators */}
                              <div className="flex flex-wrap items-center gap-1 text-[10px]">
                                {res.metrics.exactMatchScore === 100 && (
                                  <span className="bg-emerald-100 text-emerald-800 px-1 rounded font-medium">
                                    Tam Eşleşme
                                  </span>
                                )}
                                {res.tokensUsed?.tokensPerSec ? (
                                  <span className="text-slate-500 flex items-center gap-0.5">
                                    <Zap className="w-2.5 h-2.5 text-amber-500" />
                                    {res.tokensUsed.tokensPerSec} t/s
                                  </span>
                                ) : null}
                                {res.metrics.detectedHallucinations && res.metrics.detectedHallucinations.length > 0 && (
                                  <span className="bg-rose-100 text-rose-700 px-1 rounded font-semibold flex items-center gap-0.5">
                                    <ShieldAlert className="w-2.5 h-2.5" />
                                    Uydurma
                                  </span>
                                )}
                              </div>

                              {/* Click hint */}
                              <div className="text-[10px] text-slate-400 flex items-center justify-end gap-0.5">
                                <span>Detay</span>
                                <ChevronRight className="w-2.5 h-2.5" />
                              </div>
                            </div>
                          ) : (
                            <div className="p-1.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[11px]">
                              <div className="flex items-center gap-1 font-semibold">
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                <span>Hata</span>
                              </div>
                              <p className="text-[10px] text-rose-600 truncate mt-0.5" title={res.errorMessage}>
                                {res.errorMessage || 'Bağlantı kesildi'}
                              </p>
                            </div>
                          )
                        ) : (
                          <div className="text-center py-2 text-slate-400 text-xs">
                            -
                          </div>
                        )}
                      </td>
                    );
                  })}

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};
