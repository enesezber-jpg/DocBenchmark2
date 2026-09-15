import React from 'react';
import { BarChart3, Scale, Layers, CheckCircle } from 'lucide-react';
import { ModelAggregatedStats, BenchmarkCategory } from '../types';
import { getCategoryLabel } from '../utils/stats';

interface CategoryBreakdownProps {
  stats: ModelAggregatedStats[];
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ stats }) => {
  if (stats.length === 0 || !stats.some(s => s.successfulTests > 0)) {
    return null;
  }

  const categories: BenchmarkCategory[] = [
    'legal',
    'financial',
    'technical',
    'structured_json',
    'hallucination',
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>Doküman Türlerine Göre Model Başarım Profili</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Hangi modelin sözleşmelerde, finansal tablolarda veya JSON çıkarımlarında daha başarılı olduğunu analiz edin.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {categories.map((cat) => {
          // Find best model for this category
          const bestModel = [...stats].sort(
            (a, b) => (b.categoryAverages[cat] || 0) - (a.categoryAverages[cat] || 0)
          )[0];

          return (
            <div key={cat} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-800">
                  {getCategoryLabel(cat)}
                </span>
                {bestModel && bestModel.categoryAverages[cat] > 0 && (
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    En İyi: {bestModel.modelName} (%{bestModel.categoryAverages[cat]})
                  </span>
                )}
              </div>

              {/* Bars per model */}
              <div className="space-y-2">
                {stats.map((model) => {
                  const score = model.categoryAverages[cat] || 0;
                  return (
                    <div key={model.modelId} className="flex items-center gap-3 text-xs">
                      <span className="w-36 sm:w-48 truncate text-slate-600 font-medium text-[11px]" title={model.modelName}>
                        {model.modelName}
                      </span>
                      <div className="flex-1 h-3 bg-slate-200/80 rounded-full overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            score >= 90
                              ? 'bg-emerald-500'
                              : score >= 75
                              ? 'bg-teal-500'
                              : score >= 60
                              ? 'bg-amber-500'
                              : 'bg-rose-400'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="w-10 text-right font-semibold text-slate-800 text-[11px]">
                        %{score}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
