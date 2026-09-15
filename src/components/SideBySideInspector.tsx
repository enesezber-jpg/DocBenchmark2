import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp,
  Scale,
  Code2,
  ListCheck
} from 'lucide-react';
import { 
  ModelEndpoint, 
  TestCase, 
  SingleEvaluationResult 
} from '../types';
import { getCategoryLabel } from '../utils/stats';

interface SideBySideInspectorProps {
  testCase: TestCase;
  models: ModelEndpoint[];
  results: Record<string, SingleEvaluationResult>;
  activeModelId: string;
  onSelectModelId: (modelId: string) => void;
}

export const SideBySideInspector: React.FC<SideBySideInspectorProps> = ({
  testCase,
  models,
  results,
  activeModelId,
  onSelectModelId,
}) => {
  const [showFullDoc, setShowFullDoc] = useState(false);
  const activeModel = models.find((m) => m.id === activeModelId) || models[0];

  const currentResult = activeModel ? results[`${activeModel.id}_${testCase.id}`] : undefined;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800">
              {getCategoryLabel(testCase.category)}
            </span>
            <h3 className="text-base font-bold text-slate-900">
              {testCase.title}
            </h3>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Doküman: <span className="font-medium text-slate-800">{testCase.documentTitle}</span>
          </p>
        </div>

        {/* Model Switcher Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-200/60 p-1 rounded-lg">
          {models.filter(m => m.isEnabled).map((m) => {
            const res = results[`${m.id}_${testCase.id}`];
            const hasScore = res && res.status === 'success';
            const isSelected = m.id === activeModelId;

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectModelId(m.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span>{m.name}</span>
                {hasScore && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    res.metrics.compositeAccuracy >= 85
                      ? 'bg-emerald-100 text-emerald-800'
                      : res.metrics.compositeAccuracy >= 65
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    %{res.metrics.compositeAccuracy}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 space-y-4">
        
        {/* Document Context Card */}
        <div className="border border-slate-200 rounded-lg bg-slate-50/50 overflow-hidden text-xs">
          <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Orijinal Doküman Metni</span>
            </div>
            <button
              type="button"
              onClick={() => setShowFullDoc(!showFullDoc)}
              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-0.5"
            >
              <span>{showFullDoc ? 'Kısalt' : 'Tümünü Göster'}</span>
              {showFullDoc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className={`p-3 font-mono text-slate-700 bg-white leading-relaxed ${showFullDoc ? 'max-h-96' : 'max-h-28'} overflow-y-auto whitespace-pre-wrap`}>
            {testCase.documentContent}
          </div>
        </div>

        {/* Prompt & Task Instruction */}
        <div className="p-3 rounded-lg border border-indigo-100 bg-indigo-50/50 text-xs">
          <span className="font-semibold text-indigo-900 block mb-1">
            Modele Gönderilen Görev / İstem (Prompt):
          </span>
          <p className="text-slate-800 whitespace-pre-wrap">{testCase.prompt}</p>
        </div>

        {/* Ground Truth vs. Selected Model Output */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* 1. Ground Truth */}
          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs flex flex-col">
            <div className="px-3 py-2 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
              <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Referans Doğruluk Değeri (Ground Truth)
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">Altın Standart</span>
            </div>
            <div className="p-3 bg-white flex-1 font-mono text-slate-800 whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-72">
              {testCase.groundTruth}
            </div>
            {testCase.expectedEntities && testCase.expectedEntities.length > 0 && (
              <div className="p-2.5 bg-slate-50 border-t border-slate-200">
                <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Beklenen Kritik Varlıklar / Rakamlar:
                </span>
                <div className="flex flex-wrap gap-1">
                  {testCase.expectedEntities.map((ent, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-700">
                      {ent}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Model's Actual Output & Diagnostics */}
          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs flex flex-col">
            <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-indigo-600" />
                <span>{activeModel?.name} Yanıtı</span>
              </span>
              {currentResult && currentResult.status === 'success' && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {currentResult.latencyMs}ms
                  </span>
                  <span className="text-slate-500 text-[11px] flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" />
                    {currentResult.tokensUsed?.tokensPerSec || 0} t/s
                  </span>
                  <span className="font-bold text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                    %{currentResult.metrics.compositeAccuracy} Doğruluk
                  </span>
                </div>
              )}
            </div>

            <div className="p-3 bg-white flex-1 font-mono text-slate-800 whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-72">
              {currentResult ? (
                currentResult.status === 'success' ? (
                  currentResult.rawOutput
                ) : (
                  <div className="text-rose-600 p-2 bg-rose-50 rounded border border-rose-200">
                    Hata Oluştu: {currentResult.errorMessage}
                  </div>
                )
              ) : (
                <div className="text-slate-400 italic py-6 text-center">
                  Bu model henüz bu test senaryosunda çalıştırılmadı.
                </div>
              )}
            </div>

            {/* Diagnostic Metrics Bar */}
            {currentResult && currentResult.status === 'success' && (
              <div className="p-2.5 bg-slate-50 border-t border-slate-200 space-y-2">
                {/* Notes */}
                <p className="text-[11px] text-slate-600 font-medium">
                  {currentResult.metrics.notes}
                </p>

                {/* Sub metrics tags */}
                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                    Varlık F1 Skoru: %{currentResult.metrics.entityF1Score}
                  </span>
                  {currentResult.metrics.numericalAccuracyScore !== undefined && (
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                      Sayısal Doğruluk: %{currentResult.metrics.numericalAccuracyScore}
                    </span>
                  )}
                  {currentResult.metrics.jsonStructureScore !== undefined && (
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                      JSON Şema Uyumu: %{currentResult.metrics.jsonStructureScore}
                    </span>
                  )}
                  {currentResult.metrics.hallucinationPenalty > 0 && (
                    <span className="px-2 py-0.5 rounded bg-rose-100 border border-rose-200 text-rose-800 font-semibold">
                      Halüsinasyon Cezası: -{currentResult.metrics.hallucinationPenalty} Puan
                    </span>
                  )}
                </div>

                {/* Matched vs Missing Entities */}
                <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                  {currentResult.metrics.matchedEntities.map((ent, i) => (
                    <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      {ent}
                    </span>
                  ))}
                  {currentResult.metrics.missingEntities.map((ent, i) => (
                    <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                      <XCircle className="w-2.5 h-2.5" />
                      {ent}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
