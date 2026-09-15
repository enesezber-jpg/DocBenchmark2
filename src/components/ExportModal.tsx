import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  Copy, 
  Check, 
  Table, 
  FileCode 
} from 'lucide-react';
import { 
  ModelEndpoint, 
  TestCase, 
  SingleEvaluationResult, 
  ModelAggregatedStats 
} from '../types';
import { getCategoryLabel } from '../utils/stats';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: ModelEndpoint[];
  testCases: TestCase[];
  results: Record<string, SingleEvaluationResult>;
  stats: ModelAggregatedStats[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  models,
  testCases,
  results,
  stats,
}) => {
  const [format, setFormat] = useState<'markdown' | 'csv' | 'json'>('markdown');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate Markdown report
  const generateMarkdown = (): string => {
    let md = `# Kapalı Ağ OpenAI Doküman Analizi Benchmark Raporu\n`;
    md += `*Oluşturulma Tarihi:* ${new Date().toLocaleString('tr-TR')}\n\n`;

    md += `## 1. Yönetici Özeti & Model Sıralaması\n\n`;
    md += `| Sıra | Model Adı | Sunucu Türü | Ortalama Doğruluk | Ort. Gecikme | Hız (tok/s) | Halüsinasyon |\n`;
    md += `| :---: | :--- | :---: | :---: | :---: | :---: | :---: |\n`;

    stats.forEach((s) => {
      const m = models.find((mod) => mod.id === s.modelId);
      md += `| ${s.rank} | **${s.modelName}** | ${m?.serverType || '-'} | **%${s.averageAccuracy}** | ${s.averageLatencyMs} ms | ~${s.averageTokensPerSec} | ${s.hallucinationCount} |\n`;
    });

    md += `\n## 2. Doküman Kategorilerine Göre Doğruluk Dağılımı (%)\n\n`;
    md += `| Model | Hukuk & Sözleşme | Finans & Bilanço | Teknik Şartname | Yapısal JSON | Halüsinasyon Direnci |\n`;
    md += `| :--- | :---: | :---: | :---: | :---: | :---: |\n`;

    stats.forEach((s) => {
      md += `| ${s.modelName} | %${s.categoryAverages.legal} | %${s.categoryAverages.financial} | %${s.categoryAverages.technical} | %${s.categoryAverages.structured_json} | %${s.categoryAverages.hallucination} |\n`;
    });

    md += `\n## 3. Senaryo Bazlı Ayrıntılı Karşılaştırma Matrisi\n\n`;
    testCases.forEach((tc) => {
      md += `### Senaryo: ${tc.title} (${getCategoryLabel(tc.category)})\n`;
      md += `- **Doküman:** ${tc.documentTitle}\n`;
      md += `- **Referans Doğru (Ground Truth):** \`${tc.groundTruth.replace(/\n/g, ' ')}\`\n\n`;

      md += `| Model | Doğruluk | Gecikme | Sonuç Notu |\n`;
      md += `| :--- | :---: | :---: | :--- |\n`;

      models.filter(m => m.isEnabled).forEach((m) => {
        const res = results[`${m.id}_${tc.id}`];
        if (res && res.status === 'success') {
          md += `| ${m.name} | %${res.metrics.compositeAccuracy} | ${res.latencyMs}ms | ${res.metrics.notes || 'Başarılı'} |\n`;
        } else {
          md += `| ${m.name} | - | - | ${res?.errorMessage || 'Değerlendirilmedi'} |\n`;
        }
      });
      md += `\n`;
    });

    return md;
  };

  // Generate CSV
  const generateCSV = (): string => {
    let csv = 'Model ID,Model Adi,Senaryo ID,Senaryo Basligi,Kategori,Dogruluk %,Gecikme (ms),Token/s,Durum\n';
    models.filter(m => m.isEnabled).forEach((m) => {
      testCases.forEach((tc) => {
        const res = results[`${m.id}_${tc.id}`];
        const accuracy = res?.status === 'success' ? res.metrics.compositeAccuracy : 0;
        const latency = res?.status === 'success' ? res.latencyMs : 0;
        const tokSec = res?.tokensUsed?.tokensPerSec || 0;
        const status = res?.status || 'untested';
        csv += `"${m.id}","${m.name}","${tc.id}","${tc.title}","${tc.category}",${accuracy},${latency},${tokSec},"${status}"\n`;
      });
    });
    return csv;
  };

  // Generate JSON
  const generateJSON = (): string => {
    return JSON.stringify(
      {
        benchmarkInfo: {
          generatedAt: new Date().toISOString(),
          environment: 'Air-Gapped Closed Network Benchmark',
        },
        models: models.filter(m => m.isEnabled),
        testCases,
        summaryStats: stats,
        detailedResults: results,
      },
      null,
      2
    );
  };

  const getExportContent = () => {
    if (format === 'markdown') return generateMarkdown();
    if (format === 'csv') return generateCSV();
    return generateJSON();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getExportContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = getExportContent();
    const ext = format === 'markdown' ? 'md' : format;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `openai-docbenchmark-report-${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-xs">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Benchmark Raporunu Dışa Aktar
              </h2>
              <p className="text-xs text-slate-500">
                Modellerinizin doküman analizi başarı raporunu Markdown, CSV veya JSON formatında kaydedin
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

        {/* Format Selector */}
        <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setFormat('markdown')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                format === 'markdown' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Markdown (.md)
            </button>
            <button
              type="button"
              onClick={() => setFormat('csv')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                format === 'csv' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Excel / CSV (.csv)
            </button>
            <button
              type="button"
              onClick={() => setFormat('json')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                format === 'json' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              Ham JSON (.json)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 font-medium text-slate-700 shadow-2xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              {copied ? 'Kopyalandı!' : 'Metni Kopyala'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              İndir
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed select-all">
          <pre className="whitespace-pre-wrap">{getExportContent()}</pre>
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
