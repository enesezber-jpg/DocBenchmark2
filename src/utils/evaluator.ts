import { MetricBreakdown, TestCase } from '../types';

export function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[ıİ]/g, 'i')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u')
    .replace(/[şŞ]/g, 's')
    .replace(/[öÖ]/g, 'o')
    .replace(/[çÇ]/g, 'c')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractNumbers(str: string): number[] {
  if (!str) return [];
  // Match standard numbers, currencies, percentages e.g. 50, 18.200.000, 54000000, 18.2M
  const matches = str.match(/(?:-?\d{1,3}(?:\.\d{3})+(?:,\d+)?|-?\d+(?:\.\d+)?)/g);
  if (!matches) return [];

  const results: number[] = [];
  for (const m of matches) {
    let clean = m;
    // Turkish formatted number with thousand dot: 18.200.000 or 54.000.000
    if (/\.\d{3}(?:\.|$)/.test(clean)) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      clean = clean.replace(',', '.');
    }
    const num = parseFloat(clean);
    if (!isNaN(num)) {
      results.push(num);
    }
  }
  return results;
}

export function evaluateTestCase(rawOutput: string, testCase: TestCase): MetricBreakdown {
  const normOutput = normalizeText(rawOutput);
  const normGroundTruth = normalizeText(testCase.groundTruth);

  // Exact match check
  const exactMatchScore = normOutput === normGroundTruth ? 100 : 0;

  // Entity evaluation
  const expectedEntities = testCase.expectedEntities || [];
  const matchedEntities: string[] = [];
  const missingEntities: string[] = [];

  expectedEntities.forEach((entity) => {
    const normEntity = normalizeText(entity);
    if (normOutput.includes(normEntity)) {
      matchedEntities.push(entity);
    } else {
      // Partial entity token match
      const entityTokens = normEntity.split(' ').filter(Boolean);
      const allTokensPresent = entityTokens.length > 1 && entityTokens.every(tok => normOutput.includes(tok));
      if (allTokensPresent) {
        matchedEntities.push(entity);
      } else {
        missingEntities.push(entity);
      }
    }
  });

  const entityRecall = expectedEntities.length > 0
    ? (matchedEntities.length / expectedEntities.length) * 100
    : 100;

  // Precision heuristic: penalize excessive verbosity if ground truth is concise
  const groundTokens = normGroundTruth.split(' ').filter(Boolean).length;
  const outputTokens = normOutput.split(' ').filter(Boolean).length;
  const verbosityPenalty = outputTokens > groundTokens * 3 ? Math.min(25, (outputTokens / groundTokens) * 5) : 0;
  const entityPrecision = Math.max(20, Math.min(100, (matchedEntities.length > 0 ? (matchedEntities.length / (matchedEntities.length + (verbosityPenalty > 0 ? 1 : 0))) * 100 : 0)));

  const entityF1 = entityRecall + entityPrecision > 0
    ? (2 * (entityRecall * entityPrecision)) / (entityRecall + entityPrecision)
    : 0;

  // Numerical Accuracy evaluation
  let numericalAccuracyScore: number | undefined = undefined;
  if (testCase.expectedNumbers && testCase.expectedNumbers.length > 0) {
    const extracted = extractNumbers(rawOutput);
    let matchedCount = 0;

    testCase.expectedNumbers.forEach((item) => {
      const tolerance = (item.tolerancePct || 1) / 100;
      const found = extracted.some((num) => {
        if (item.value === 0) return Math.abs(num) < 0.001;
        const diffPct = Math.abs(num - item.value) / Math.abs(item.value);
        return diffPct <= tolerance;
      });
      if (found) matchedCount++;
    });

    numericalAccuracyScore = (matchedCount / testCase.expectedNumbers.length) * 100;
  }

  // JSON Schema evaluation
  let jsonStructureScore: number | undefined = undefined;
  if (testCase.evaluationMode === 'json_schema') {
    let parsed: any = null;
    try {
      // Find JSON block or parse directly
      let jsonStr = rawOutput.trim();
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      } else {
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
      }

      parsed = JSON.parse(jsonStr);
      let validKeys = 0;
      const expectedSchema = testCase.expectedJsonSchema || {};
      const expectedKeyNames = Object.keys(expectedSchema);

      if (expectedKeyNames.length > 0) {
        expectedKeyNames.forEach((key) => {
          if (parsed[key] !== undefined && parsed[key] !== null) {
            const expectedVal = normalizeText(String(expectedSchema[key]));
            const actualVal = normalizeText(String(parsed[key]));
            if (actualVal === expectedVal || actualVal.includes(expectedVal) || expectedVal.includes(actualVal)) {
              validKeys += 1;
            } else {
              validKeys += 0.5; // Key exists with non-null value
            }
          }
        });
        jsonStructureScore = Math.min(100, Math.round((validKeys / expectedKeyNames.length) * 100));
      } else {
        jsonStructureScore = 100;
      }
    } catch {
      jsonStructureScore = 0; // Invalid JSON
    }
  }

  // Hallucination evaluation
  const detectedHallucinations: string[] = [];
  let hallucinationPenalty = 0;

  if (testCase.negativeKeywords && testCase.negativeKeywords.length > 0) {
    testCase.negativeKeywords.forEach((kw) => {
      const normKw = normalizeText(kw);
      if (normOutput.includes(normKw)) {
        detectedHallucinations.push(kw);
        hallucinationPenalty += 25;
      }
    });
  }

  // If this is negative_fact evaluation, model MUST state absence
  if (testCase.evaluationMode === 'negative_fact') {
    const absenceIndicators = [
      'yer almamaktadir',
      'belirtilmemektedir',
      'hukum bulunmamaktadir',
      'bilgi verilmemistir',
      'kapsaminda degildir',
      'metinde gecmemektedir',
      'bulunmuyor',
      'belirtilmemis',
      'not mentioned',
      'does not mention'
    ];
    const statedAbsence = absenceIndicators.some(indicator => normOutput.includes(indicator));
    if (!statedAbsence) {
      hallucinationPenalty += 40;
    }
  }

  hallucinationPenalty = Math.min(50, hallucinationPenalty);

  // Calculate composite accuracy
  let compositeAccuracy = 0;
  if (testCase.evaluationMode === 'json_schema') {
    compositeAccuracy = (jsonStructureScore ?? 0) * 0.7 + entityRecall * 0.3;
  } else if (testCase.evaluationMode === 'numerical') {
    const numScore = numericalAccuracyScore ?? 0;
    compositeAccuracy = numScore * 0.6 + entityRecall * 0.4;
  } else if (testCase.evaluationMode === 'negative_fact') {
    const baseScore = entityRecall > 0 ? 100 : 30;
    compositeAccuracy = Math.max(0, baseScore - hallucinationPenalty);
  } else {
    // entity_f1 or general
    compositeAccuracy = entityF1 * 0.7 + entityRecall * 0.3;
  }

  // Subtract hallucination penalty
  compositeAccuracy = Math.max(0, Math.min(100, Math.round(compositeAccuracy - hallucinationPenalty)));

  let notes = '';
  if (exactMatchScore === 100) {
    notes = 'Mükemmel birebir eşleşme.';
  } else if (compositeAccuracy >= 90) {
    notes = 'Çok yüksek doğruluk; beklenen anahtar verilerin tamamına yakını çekildi.';
  } else if (compositeAccuracy >= 70) {
    notes = 'Yeterli düzeyde çıkarma; bazı nüanslar veya ikincil parametreler eksik.';
  } else if (compositeAccuracy >= 40) {
    notes = 'Kısmi doğruluk; kritik sayı veya varlık eksiklikleri tespit edildi.';
  } else {
    notes = 'Düşük doğruluk veya yanıt şema/metin kriterlerini karşılayamadı.';
  }

  if (detectedHallucinations.length > 0) {
    notes += ` Dikkat: Metinde olmayan ${detectedHallucinations.length} asılsız iddia/terim tespit edildi.`;
  }

  return {
    exactMatchScore,
    entityRecallScore: Math.round(entityRecall),
    entityPrecisionScore: Math.round(entityPrecision),
    entityF1Score: Math.round(entityF1),
    numericalAccuracyScore: numericalAccuracyScore !== undefined ? Math.round(numericalAccuracyScore) : undefined,
    jsonStructureScore: jsonStructureScore !== undefined ? Math.round(jsonStructureScore) : undefined,
    hallucinationPenalty,
    compositeAccuracy,
    matchedEntities,
    missingEntities,
    detectedHallucinations,
    notes,
  };
}
