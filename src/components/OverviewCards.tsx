import React from 'react';
import { Award, Zap, Database, ShieldAlert, TrendingUp } from 'lucide-react';
import { ModelAggregatedStats } from '../types';

interface OverviewCardsProps {
  stats: ModelAggregatedStats[];
  totalRuns: number;
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({ stats, totalRuns }) => {
  if (stats.length === 0 || totalRuns === 0) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-6 text-center">
        <TrendingUp className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-800">Henüz Kıyaslama Yapılmadı</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Modellerinizi doküman analizi test senaryolarında yarıştırmak için yukarıdaki 
          "Benchmark Başlat" butonuna tıklayınız.
        </p>
      </div>
    );
  }

  // Find champions
  const topAccuracy = [...stats].sort((a, b) => b.averageAccuracy - a.averageAccuracy)[0];
  const fastest = [...stats]
    .filter((s) => s.averageLatencyMs > 0)
    .sort((a, b) => a.averageLatencyMs - b.averageLatencyMs)[0];
  const bestStructured = [...stats].sort((a, b) => b.categoryAverages.structured_json - a.categoryAverages.structured_json)[0];
  const leastHallucination = [...stats].sort((a, b) => a.hallucinationCount - b.hallucinationCount)[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. Top Accuracy */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500">En Yüksek Doğruluk</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">
            %{topAccuracy ? topAccuracy.averageAccuracy : 0}
          </span>
          <span className="text-xs font-semibold text-emerald-600">Lider Model</span>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-800 truncate" title={topAccuracy?.modelName}>
            {topAccuracy ? topAccuracy.modelName : '-'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {topAccuracy?.successfulTests}/{topAccuracy?.totalTests} test başarıyla tamamlandı
          </p>
        </div>
      </div>

      {/* 2. Fastest Inference */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500">En Hızlı Çıkarım</span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">
            {fastest ? `${fastest.averageLatencyMs} ms` : '-'}
          </span>
          <span className="text-xs font-medium text-slate-500">
            {fastest?.averageTokensPerSec ? `~${fastest.averageTokensPerSec} tok/s` : ''}
          </span>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-800 truncate" title={fastest?.modelName}>
            {fastest ? fastest.modelName : '-'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Düşük gecikmeli doküman yanıtı
          </p>
        </div>
      </div>

      {/* 3. Best Structured JSON */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500">Yapısal / JSON Şema Uyumu</span>
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">
            %{bestStructured ? bestStructured.categoryAverages.structured_json : 0}
          </span>
          <span className="text-xs font-semibold text-blue-600">Şema Başarısı</span>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-800 truncate" title={bestStructured?.modelName}>
            {bestStructured ? bestStructured.modelName : '-'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Fatura & tablo verilerini hatasız ayrıştırma
          </p>
        </div>
      </div>

      {/* 4. Halüsinasyon Direnci */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500">Doğruluk & Metne Sadakat</span>
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">
            {leastHallucination?.hallucinationCount === 0 ? '0 İhlal' : `${leastHallucination?.hallucinationCount} İhlal`}
          </span>
          <span className="text-xs font-medium text-emerald-600">
            %{leastHallucination ? leastHallucination.categoryAverages.hallucination : 0} Sadakat
          </span>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-800 truncate" title={leastHallucination?.modelName}>
            {leastHallucination ? leastHallucination.modelName : '-'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Metinde olmayan bilgiyi uydurmama başarısı
          </p>
        </div>
      </div>

    </div>
  );
};
