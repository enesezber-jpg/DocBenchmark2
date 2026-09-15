import { ModelEndpoint, TestCase, SingleEvaluationResult, ModelAggregatedStats, BenchmarkCategory } from '../types';

export function calculateModelStats(
  models: ModelEndpoint[],
  testCases: TestCase[],
  results: Record<string, SingleEvaluationResult>
): ModelAggregatedStats[] {
  const statsList: ModelAggregatedStats[] = [];

  models.forEach((model) => {
    let totalScore = 0;
    let totalLatency = 0;
    let totalTokens = 0;
    let totalTokPerSec = 0;
    let successfulCount = 0;
    let failedCount = 0;
    let hallucinationCount = 0;

    const categoryScores: Record<BenchmarkCategory, { sum: number; count: number }> = {
      legal: { sum: 0, count: 0 },
      financial: { sum: 0, count: 0 },
      technical: { sum: 0, count: 0 },
      structured_json: { sum: 0, count: 0 },
      hallucination: { sum: 0, count: 0 },
    };

    testCases.forEach((tc) => {
      const key = `${model.id}_${tc.id}`;
      const res = results[key];

      if (res && res.status === 'success') {
        successfulCount++;
        totalScore += res.metrics.compositeAccuracy;
        totalLatency += res.latencyMs;

        if (res.tokensUsed) {
          totalTokens += res.tokensUsed.completionTokens || 0;
          totalTokPerSec += res.tokensUsed.tokensPerSec || 0;
        }

        if (res.metrics.detectedHallucinations && res.metrics.detectedHallucinations.length > 0) {
          hallucinationCount += res.metrics.detectedHallucinations.length;
        }

        const cat = tc.category;
        if (categoryScores[cat]) {
          categoryScores[cat].sum += res.metrics.compositeAccuracy;
          categoryScores[cat].count += 1;
        }
      } else if (res && res.status === 'error') {
        failedCount++;
      }
    });

    const evaluatedCount = successfulCount;
    const avgAccuracy = evaluatedCount > 0 ? Math.round(totalScore / evaluatedCount) : 0;
    const avgLatency = evaluatedCount > 0 ? Math.round(totalLatency / evaluatedCount) : 0;
    const avgTokPerSec = evaluatedCount > 0 ? Number((totalTokPerSec / evaluatedCount).toFixed(1)) : 0;

    const catAverages: Record<BenchmarkCategory, number> = {
      legal: categoryScores.legal.count > 0 ? Math.round(categoryScores.legal.sum / categoryScores.legal.count) : 0,
      financial: categoryScores.financial.count > 0 ? Math.round(categoryScores.financial.sum / categoryScores.financial.count) : 0,
      technical: categoryScores.technical.count > 0 ? Math.round(categoryScores.technical.sum / categoryScores.technical.count) : 0,
      structured_json: categoryScores.structured_json.count > 0 ? Math.round(categoryScores.structured_json.sum / categoryScores.structured_json.count) : 0,
      hallucination: categoryScores.hallucination.count > 0 ? Math.round(categoryScores.hallucination.sum / categoryScores.hallucination.count) : 0,
    };

    statsList.push({
      modelId: model.id,
      modelName: model.name,
      totalTests: testCases.length,
      successfulTests: successfulCount,
      failedTests: failedCount,
      averageAccuracy: avgAccuracy,
      categoryAverages: catAverages,
      averageLatencyMs: avgLatency,
      averageTokensPerSec: avgTokPerSec,
      totalTokensProcessed: totalTokens,
      hallucinationCount,
    });
  });

  // Sort by average accuracy descending, then by average latency ascending
  statsList.sort((a, b) => {
    if (b.averageAccuracy !== a.averageAccuracy) {
      return b.averageAccuracy - a.averageAccuracy;
    }
    return a.averageLatencyMs - b.averageLatencyMs;
  });

  // Assign ranks
  statsList.forEach((stat, index) => {
    stat.rank = index + 1;
  });

  return statsList;
}

export function getCategoryLabel(category: BenchmarkCategory): string {
  switch (category) {
    case 'legal':
      return 'Hukuk & Sözleşme';
    case 'financial':
      return 'Finansal & Bilanço';
    case 'technical':
      return 'Teknik Şartname';
    case 'structured_json':
      return 'Yapısal JSON';
    case 'hallucination':
      return 'Negatif / Halüsinasyon';
    default:
      return category;
  }
}
