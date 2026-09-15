export type ModelServerType = 'vllm' | 'ollama' | 'lmstudio' | 'localai' | 'tgi' | 'custom';

export interface ModelEndpoint {
  id: string;
  name: string;
  description?: string;
  serverType: ModelServerType;
  baseUrl: string;
  apiKey?: string;
  modelIdentifier: string;
  temperature: number;
  maxTokens: number;
  contextWindow?: number;
  isEnabled: boolean;
  isSimulated?: boolean;
  lastPingMs?: number;
  lastPingStatus?: 'online' | 'offline' | 'error' | 'untested';
}

export type BenchmarkCategory = 
  | 'legal'           // Sözleşme ve Hukuk
  | 'financial'       // Finansal Rapor & Bilanço
  | 'technical'       // Teknik Şartname & Standart
  | 'structured_json' // Fatura & Yapısal JSON Çıkarımı
  | 'hallucination';  // Halüsinasyon & Negatif Doğrulama

export type EvaluationMode = 
  | 'entity_f1'        // Varlık ve Anahtar Bilgi Kapsama (F1)
  | 'numerical'        // Sayısal Değer ve Formül Doğruluğu (±Tolerans)
  | 'json_schema'      // JSON Format ve Şema Uyumluluğu
  | 'exact_match'      // Birebir Eşleşme
  | 'negative_fact';   // Olmayan Bilgiyi Teyit (Halüsinasyon Engeli)

export interface TestCase {
  id: string;
  title: string;
  category: BenchmarkCategory;
  documentTitle: string;
  documentContent: string;
  prompt: string;
  groundTruth: string;
  evaluationMode: EvaluationMode;
  expectedEntities?: string[];
  expectedNumbers?: { value: number; tolerancePct?: number; label?: string }[];
  expectedJsonSchema?: Record<string, string>;
  negativeKeywords?: string[]; // Kelimeler metinde yok, model uydurmamalı
  weight: number; // 1-5
  isCustom?: boolean;
}

export interface MetricBreakdown {
  exactMatchScore: number;       // 0 - 100
  entityRecallScore: number;     // 0 - 100
  entityPrecisionScore: number;  // 0 - 100
  entityF1Score: number;          // 0 - 100
  numericalAccuracyScore?: number;// 0 - 100
  jsonStructureScore?: number;    // 0 - 100
  hallucinationPenalty: number;   // 0 - 50 (negatif ceza)
  compositeAccuracy: number;      // 0 - 100 final score
  matchedEntities: string[];
  missingEntities: string[];
  detectedHallucinations?: string[];
  notes?: string;
}

export interface SingleEvaluationResult {
  modelId: string;
  testCaseId: string;
  rawOutput: string;
  latencyMs: number;
  tokensUsed?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    tokensPerSec: number;
  };
  metrics: MetricBreakdown;
  status: 'success' | 'error' | 'timeout';
  errorMessage?: string;
  evaluatedAt: string;
}

export interface ModelAggregatedStats {
  modelId: string;
  modelName: string;
  totalTests: number;
  successfulTests: number;
  failedTests: number;
  averageAccuracy: number;
  categoryAverages: Record<BenchmarkCategory, number>;
  averageLatencyMs: number;
  averageTokensPerSec: number;
  totalTokensProcessed: number;
  hallucinationCount: number;
  rank?: number;
}

export interface BenchmarkRun {
  id: string;
  startedAt: string;
  completedAt?: string;
  status: 'idle' | 'running' | 'completed' | 'paused' | 'stopped';
  selectedModelIds: string[];
  selectedTestCaseIds: string[];
  results: Record<string, SingleEvaluationResult>; // key: `${modelId}_${testCaseId}`
  executionMode: 'proxy' | 'direct' | 'simulation';
}
