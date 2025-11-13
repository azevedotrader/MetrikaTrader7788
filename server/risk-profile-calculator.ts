/**
 * SISTEMA DE CÁLCULO DE PERFIL DE RISCO PERSONALIZADO
 * 
 * Algoritmo determinístico que transforma respostas do questionário WhatsApp
 * em perfil de risco customizado para cada trader
 */

export type QuestionnaireAnswers = {
  q1: "A" | "B" | "C"; // Experiência
  q2: "A" | "B" | "C"; // Objetivo
  q3: string[]; // Mercados (A, B, C, D, E)
  q4: "A" | "B" | "C"; // Timeframe
  q5_winRate?: number; // Win rate (0-100)
  q5_riskReward?: number; // Risk/Reward ratio
  q6: "A" | "B" | "C"; // Perfil psicológico
  q7: "A" | "B" | "C"; // Reação a perdas
};

export type CalculatedRiskProfile = {
  profile: "conservador" | "moderado" | "agressivo";
  timeHorizon: "curto" | "medio" | "longo";
  riskPerTrade: number; // Decimal (ex: 0.01 = 1%)
  dailyProfitTarget: number; // Decimal (ex: 0.02 = 2%)
  horizonDays: number;
  scoringBreakdown: {
    experienceScore: number;
    objectiveScore: number;
    marketScore: number;
    timeframeScore: number;
    psychologyScore: number;
    totalScore: number;
  };
};

/**
 * TABELA DE SCORING
 * Cada resposta tem um peso que contribui para o perfil final
 */

// Pergunta 1: Experiência (0-30 pontos)
const EXPERIENCE_SCORES = {
  A: 0, // Iniciante - Conservador
  B: 15, // Intermediário - Moderado
  C: 30, // Avançado - Agressivo
};

// Pergunta 2: Objetivo (0-30 pontos) - PESO ALTO
const OBJECTIVE_SCORES = {
  A: 0, // Preservação - Conservador
  B: 15, // Equilíbrio - Moderado
  C: 30, // Crescimento - Agressivo
};

// Pergunta 3: Mercados (0-15 pontos) - Baseado na volatilidade dos mercados
const MARKET_VOLATILITY = {
  A: 1, // Ações - Baixa volatilidade
  B: 2, // Futuros - Média volatilidade
  C: 3, // Opções - Alta volatilidade
  D: 3, // Forex - Alta volatilidade
  E: 4, // Cripto - Altíssima volatilidade
};

// Pergunta 4: Timeframe (0-10 pontos)
const TIMEFRAME_SCORES = {
  A: 10, // Day Trade - Agressivo
  B: 5, // Swing Trade - Moderado
  C: 0, // Position Trade - Conservador
};

// Perguntas 6 e 7: Perfil Psicológico (0-15 pontos cada = 30 total)
const PSYCHOLOGY_SCORES = {
  A: 0, // Muito abalado / Duvida estratégia - Conservador
  B: 7.5, // Desconfortável / Mais cauteloso - Moderado
  C: 15, // Focado / Segue plano - Agressivo
};

/**
 * Calcula pontuação de mercados baseado na volatilidade média
 */
function calculateMarketScore(markets: string[]): number {
  if (!markets || markets.length === 0) return 5; // Default moderado

  const totalVolatility = markets.reduce((sum, market) => {
    return sum + (MARKET_VOLATILITY[market as keyof typeof MARKET_VOLATILITY] || 2);
  }, 0);

  const avgVolatility = totalVolatility / markets.length;

  // Normalizar para escala 0-15
  // Volatilidade 1 (ações) = 0 pontos
  // Volatilidade 4 (cripto) = 15 pontos
  return Math.min(15, ((avgVolatility - 1) / 3) * 15);
}

/**
 * Converte pontuação total em perfil de risco
 * Score: 0-40 = Conservador
 * Score: 41-75 = Moderado
 * Score: 76-115 = Agressivo
 */
function scoreToProfile(score: number): "conservador" | "moderado" | "agressivo" {
  if (score <= 40) return "conservador";
  if (score <= 75) return "moderado";
  return "agressivo";
}

/**
 * Determina horizonte temporal baseado em timeframe e experiência
 */
function calculateTimeHorizon(
  timeframe: "A" | "B" | "C",
  experience: "A" | "B" | "C"
): "curto" | "medio" | "longo" {
  // Day Trade sempre curto prazo
  if (timeframe === "A") return "curto";

  // Swing Trade: iniciante = longo, intermediário/avançado = médio
  if (timeframe === "B") {
    return experience === "A" ? "longo" : "medio";
  }

  // Position Trade sempre longo prazo
  return "longo";
}

/**
 * MATRIZ DE RISCO PERSONALIZADA
 * Ajusta parâmetros baseado no perfil E nas métricas opcionais do usuário
 */
const BASE_RISK_MATRIX = {
  conservador: {
    curto: { riskPerTrade: 0.01, dailyTarget: 0.02, horizonDays: 30 },
    medio: { riskPerTrade: 0.0075, dailyTarget: 0.015, horizonDays: 90 },
    longo: { riskPerTrade: 0.005, dailyTarget: 0.01, horizonDays: 180 },
  },
  moderado: {
    curto: { riskPerTrade: 0.02, dailyTarget: 0.04, horizonDays: 30 },
    medio: { riskPerTrade: 0.015, dailyTarget: 0.03, horizonDays: 60 },
    longo: { riskPerTrade: 0.01, dailyTarget: 0.02, horizonDays: 90 },
  },
  agressivo: {
    curto: { riskPerTrade: 0.03, dailyTarget: 0.06, horizonDays: 15 },
    medio: { riskPerTrade: 0.02, dailyTarget: 0.04, horizonDays: 45 },
    longo: { riskPerTrade: 0.015, dailyTarget: 0.03, horizonDays: 60 },
  },
};

/**
 * Ajusta risco baseado em win rate e risk/reward customizados
 */
function adjustRiskByMetrics(
  baseRisk: number,
  baseDailyTarget: number,
  winRate?: number,
  riskReward?: number
): { riskPerTrade: number; dailyTarget: number } {
  let adjustedRisk = baseRisk;
  let adjustedTarget = baseDailyTarget;

  // Se win rate é alto (>60%), pode aumentar risco levemente
  if (winRate && winRate > 60) {
    adjustedRisk = baseRisk * 1.2; // +20%
    adjustedTarget = baseDailyTarget * 1.2;
  }

  // Se win rate é baixo (<45%), reduzir risco
  if (winRate && winRate < 45) {
    adjustedRisk = baseRisk * 0.8; // -20%
    adjustedTarget = baseDailyTarget * 0.8;
  }

  // Se risk/reward é alto (>2.5), pode aumentar target
  if (riskReward && riskReward > 2.5) {
    adjustedTarget = baseDailyTarget * 1.3;
  }

  // Limites de segurança
  adjustedRisk = Math.min(0.05, Math.max(0.003, adjustedRisk)); // Entre 0.3% e 5%
  adjustedTarget = Math.min(0.10, Math.max(0.005, adjustedTarget)); // Entre 0.5% e 10%

  return {
    riskPerTrade: Math.round(adjustedRisk * 10000) / 10000, // 4 decimais
    dailyTarget: Math.round(adjustedTarget * 10000) / 10000,
  };
}

/**
 * FUNÇÃO PRINCIPAL: Calcula perfil de risco personalizado
 */
export function calculateRiskProfile(answers: QuestionnaireAnswers): CalculatedRiskProfile {
  // Calcular pontuações individuais
  const experienceScore = EXPERIENCE_SCORES[answers.q1];
  const objectiveScore = OBJECTIVE_SCORES[answers.q2];
  const marketScore = calculateMarketScore(answers.q3);
  const timeframeScore = TIMEFRAME_SCORES[answers.q4];
  const psychologyScore = PSYCHOLOGY_SCORES[answers.q6] + PSYCHOLOGY_SCORES[answers.q7];

  const totalScore = experienceScore + objectiveScore + marketScore + timeframeScore + psychologyScore;

  // Determinar perfil e horizonte
  const profile = scoreToProfile(totalScore);
  const timeHorizon = calculateTimeHorizon(answers.q4, answers.q1);

  // Buscar parâmetros base
  const baseParams = BASE_RISK_MATRIX[profile][timeHorizon];

  // Ajustar com métricas customizadas (se fornecidas)
  const adjustedParams = adjustRiskByMetrics(
    baseParams.riskPerTrade,
    baseParams.dailyTarget,
    answers.q5_winRate,
    answers.q5_riskReward
  );

  return {
    profile,
    timeHorizon,
    riskPerTrade: adjustedParams.riskPerTrade,
    dailyProfitTarget: adjustedParams.dailyTarget,
    horizonDays: baseParams.horizonDays,
    scoringBreakdown: {
      experienceScore,
      objectiveScore,
      marketScore,
      timeframeScore,
      psychologyScore,
      totalScore,
    },
  };
}

/**
 * Valida se as respostas do questionário estão completas
 */
export function validateQuestionnaireAnswers(answers: Partial<QuestionnaireAnswers>): {
  isValid: boolean;
  missingQuestions: number[];
} {
  const missing: number[] = [];

  if (!answers.q1) missing.push(1);
  if (!answers.q2) missing.push(2);
  if (!answers.q3 || answers.q3.length === 0) missing.push(3);
  if (!answers.q4) missing.push(4);
  // q5 é opcional
  if (!answers.q6) missing.push(6);
  if (!answers.q7) missing.push(7);

  return {
    isValid: missing.length === 0,
    missingQuestions: missing,
  };
}

/**
 * Formata explicação do perfil para o usuário
 */
export function formatProfileExplanation(result: CalculatedRiskProfile): string {
  const profileNames = {
    conservador: "🛡️ Conservador",
    moderado: "⚖️ Moderado",
    agressivo: "🚀 Agressivo",
  };

  const horizonNames = {
    curto: "Curto Prazo",
    medio: "Médio Prazo",
    longo: "Longo Prazo",
  };

  return `
✅ *Perfil Criado com Sucesso!*

📊 *Seu Perfil*: ${profileNames[result.profile]}
⏱️ *Horizonte*: ${horizonNames[result.timeHorizon]} (${result.horizonDays} dias)

💰 *Parâmetros de Risco*:
• Risco por Trade: ${(result.riskPerTrade * 100).toFixed(2)}%
• Meta Diária: ${(result.dailyProfitTarget * 100).toFixed(2)}%

📈 *Score Total*: ${result.scoringBreakdown.totalScore.toFixed(1)} pontos

_Este perfil foi personalizado com base nas suas respostas e nas suas características como trader._
  `.trim();
}
