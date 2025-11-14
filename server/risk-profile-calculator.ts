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
 * Parâmetros de Gestão de Risco para o sistema de Bankroll Management
 */
export type RiskManagementParameters = {
  risk_per_operation: number; // Percentual do capital a arriscar por operação (ex: 0.01 = 1%)
  max_daily_risk: number; // Percentual máximo de perda permitido no dia (ex: 0.03 = 3%)
  max_weekly_risk: number; // Percentual máximo de perda permitido na semana (ex: 0.06 = 6%)
  min_risk_reward_ratio: number; // Relação mínima de risco/retorno (ex: 2.0 = 1:2)
  drawdown_trigger_losses: number; // Número de perdas consecutivas que aciona redução de risco
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
  A: 3, // Forex - Alta volatilidade
  B: 1.5, // B3 - Baixa a média volatilidade
  C: 4, // Cripto - Altíssima volatilidade
  D: 2, // Outro - Média volatilidade
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
  // Volatilidade 1.5 (B3) = 0 pontos
  // Volatilidade 4 (Cripto) = 15 pontos
  return Math.min(15, ((avgVolatility - 1.5) / 2.5) * 15);
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
 * Valida e normaliza métricas customizadas (win rate e R:R)
 */
function validateCustomMetrics(winRate?: number, riskReward?: number): {
  validWinRate?: number;
  validRiskReward?: number;
} {
  let validWinRate: number | undefined;
  let validRiskReward: number | undefined;

  // Validar win rate (0-100)
  if (winRate !== undefined && winRate !== null) {
    validWinRate = Math.min(100, Math.max(0, winRate));
  }

  // Validar risk/reward (deve ser positivo)
  if (riskReward !== undefined && riskReward !== null && riskReward > 0) {
    validRiskReward = Math.min(10, Math.max(0.5, riskReward)); // Limitar entre 0.5 e 10
  }

  return { validWinRate, validRiskReward };
}

/**
 * Ajusta risco baseado em win rate e risk/reward customizados
 * CORRIGIDO: Trata winRate=0 corretamente (não é undefined)
 */
function adjustRiskByMetrics(
  baseRisk: number,
  baseDailyTarget: number,
  winRate?: number,
  riskReward?: number
): { riskPerTrade: number; dailyTarget: number } {
  let adjustedRisk = baseRisk;
  let adjustedTarget = baseDailyTarget;

  // Validar e normalizar métricas
  const { validWinRate, validRiskReward } = validateCustomMetrics(winRate, riskReward);

  // Ajustar baseado em win rate (CRÍTICO: verifica !== undefined, não truthy)
  if (validWinRate !== undefined) {
    if (validWinRate > 60) {
      // Win rate alto: +20% risco e target
      adjustedRisk = baseRisk * 1.2;
      adjustedTarget = baseDailyTarget * 1.2;
    } else if (validWinRate < 45) {
      // Win rate baixo: -20% risco e target (PROTEÇÃO CRÍTICA)
      adjustedRisk = baseRisk * 0.8;
      adjustedTarget = baseDailyTarget * 0.8;
    }
    // Se win rate está entre 45-60%, usa valores base (sem ajuste)
  }

  // Se risk/reward é alto (>2.5), pode aumentar target
  if (validRiskReward !== undefined && validRiskReward > 2.5) {
    adjustedTarget = baseDailyTarget * 1.3;
  }

  // Limites de segurança ABSOLUTOS (proteção contra qualquer configuração perigosa)
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
  let profile = scoreToProfile(totalScore);
  const timeHorizon = calculateTimeHorizon(answers.q4, answers.q1);

  // REGRA DE PROTEÇÃO: Iniciantes (A) nunca podem ser agressivos
  // Mesmo com score alto, limite a "moderado"
  if (answers.q1 === "A" && profile === "agressivo") {
    profile = "moderado";
  }

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
 * CÁLCULO DE PARÂMETROS DE GESTÃO DE RISCO
 * Baseado principalmente na Pergunta 2 (perfil: Conservador/Moderado/Arrojado)
 * Com ajustes finos baseados nas demais respostas
 */
export function calculateRiskManagementParameters(answers: QuestionnaireAnswers): RiskManagementParameters {
  // PASSO 1: Definir parâmetros base conforme Pergunta 2 (Objetivo/Perfil)
  let baseParams: RiskManagementParameters;
  
  if (answers.q2 === "A") {
    // Conservador - Preservação de Capital
    baseParams = {
      risk_per_operation: 0.005,    // 0.5% por operação
      max_daily_risk: 0.015,        // 1.5% máximo no dia
      max_weekly_risk: 0.03,        // 3% máximo na semana
      min_risk_reward_ratio: 2.5,   // Mínimo 1:2.5
      drawdown_trigger_losses: 3    // Reduz risco após 3 perdas consecutivas
    };
  } else if (answers.q2 === "B") {
    // Moderado - Equilíbrio Risco/Retorno
    baseParams = {
      risk_per_operation: 0.01,     // 1% por operação
      max_daily_risk: 0.03,         // 3% máximo no dia
      max_weekly_risk: 0.06,        // 6% máximo na semana
      min_risk_reward_ratio: 2.0,   // Mínimo 1:2
      drawdown_trigger_losses: 4    // Reduz risco após 4 perdas consecutivas
    };
  } else {
    // Arrojado - Crescimento Agressivo
    baseParams = {
      risk_per_operation: 0.02,     // 2% por operação
      max_daily_risk: 0.06,         // 6% máximo no dia
      max_weekly_risk: 0.12,        // 12% máximo na semana
      min_risk_reward_ratio: 1.5,   // Mínimo 1:1.5
      drawdown_trigger_losses: 5    // Reduz risco após 5 perdas consecutivas
    };
  }

  // PASSO 2: APLICAR MODIFICADORES
  
  // Modificador por Experiência (Pergunta 1)
  if (answers.q1 === "A") {
    // Iniciante: SEMPRE reduz risco em 50% (proteção máxima)
    baseParams.risk_per_operation *= 0.5;
  }

  // Modificador por Psicologia de Perda (Pergunta 6)
  if (answers.q6 === "A") {
    // Muito abalado com perdas: reduz max_daily_risk em 50%
    baseParams.max_daily_risk *= 0.5;
  }

  // Modificador por Psicologia de Drawdown (Pergunta 7)
  if (answers.q7 === "A") {
    // Duvida da estratégia após drawdown: reduz gatilho em 1 (mínimo 1)
    baseParams.drawdown_trigger_losses = Math.max(1, baseParams.drawdown_trigger_losses - 1);
  } else if (answers.q7 === "C") {
    // Segue o plano rigorosamente: aumenta gatilho em 1
    baseParams.drawdown_trigger_losses = baseParams.drawdown_trigger_losses + 1;
  }

  // Modificador por Timeframe (Pergunta 4)
  if (answers.q4 === "A") {
    // Day Trade: aumenta max_daily_risk em 20%
    baseParams.max_daily_risk *= 1.20;
  } else if (answers.q4 === "B" || answers.q4 === "C") {
    // Swing/Position Trade: aumenta max_weekly_risk em 20%
    baseParams.max_weekly_risk *= 1.20;
  }

  // Modificador por Win Rate e R:R (Pergunta 5) - OPCIONAL
  const { validWinRate, validRiskReward } = validateCustomMetrics(answers.q5_winRate, answers.q5_riskReward);
  
  if (validWinRate !== undefined && validRiskReward !== undefined) {
    // Calcular expectativa matemática
    const winRateDecimal = validWinRate / 100;
    const lossRate = 1 - winRateDecimal;
    const expectativa = (winRateDecimal * validRiskReward) - (lossRate * 1);
    
    // Se expectativa é baixa (< 0.1), aumentar exigência de R:R em 25%
    if (expectativa < 0.1) {
      baseParams.min_risk_reward_ratio *= 1.25;
    }
  }

  // PASSO 3: Limites de segurança absolutos (proteção final)
  baseParams.risk_per_operation = Math.min(0.03, Math.max(0.003, baseParams.risk_per_operation)); // Entre 0.3% e 3%
  baseParams.max_daily_risk = Math.min(0.08, Math.max(0.01, baseParams.max_daily_risk)); // Entre 1% e 8%
  baseParams.max_weekly_risk = Math.min(0.15, Math.max(0.02, baseParams.max_weekly_risk)); // Entre 2% e 15%
  baseParams.min_risk_reward_ratio = Math.min(5.0, Math.max(1.2, baseParams.min_risk_reward_ratio)); // Entre 1.2 e 5.0
  baseParams.drawdown_trigger_losses = Math.min(7, Math.max(1, baseParams.drawdown_trigger_losses)); // Entre 1 e 7

  // PASSO 4: Arredondar valores para 4 casas decimais
  return {
    risk_per_operation: Math.round(baseParams.risk_per_operation * 10000) / 10000,
    max_daily_risk: Math.round(baseParams.max_daily_risk * 10000) / 10000,
    max_weekly_risk: Math.round(baseParams.max_weekly_risk * 10000) / 10000,
    min_risk_reward_ratio: Math.round(baseParams.min_risk_reward_ratio * 100) / 100,
    drawdown_trigger_losses: Math.round(baseParams.drawdown_trigger_losses)
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

/**
 * Formata explicação dos parâmetros de gestão de risco com valores em R$
 */
export function formatRiskParametersExplanation(params: RiskManagementParameters, bankrollValue: number): string {
  // Calcular valores em R$ baseados na banca
  const riskPerOperationReais = bankrollValue * params.risk_per_operation;
  const maxDailyRiskReais = bankrollValue * params.max_daily_risk;
  const maxWeeklyRiskReais = bankrollValue * params.max_weekly_risk;
  const minGainPerReal = params.min_risk_reward_ratio;

  return `
🎯 *SEU PLANO DE GERENCIAMENTO DE RISCO PERSONALIZADO*

Baseado no seu perfil, aqui estão suas regras de ouro:

📊 *RISCO POR OPERAÇÃO: ${(params.risk_per_operation * 100).toFixed(2)}%*
   → Nunca arrisque mais que R$ ${riskPerOperationReais.toFixed(2)} por trade

🚨 *RISCO MÁXIMO DIÁRIO: ${(params.max_daily_risk * 100).toFixed(2)}%*
   → Se perder R$ ${maxDailyRiskReais.toFixed(2)} no dia, PARE de operar

📅 *RISCO MÁXIMO SEMANAL: ${(params.max_weekly_risk * 100).toFixed(2)}%*
   → Se perder R$ ${maxWeeklyRiskReais.toFixed(2)} na semana, reavalie sua estratégia

💰 *RELAÇÃO RISCO/RETORNO MÍNIMA: 1:${params.min_risk_reward_ratio.toFixed(1)}*
   → Para cada R$1 arriscado, busque ganhar R$${minGainPerReal.toFixed(1)}

⚠️ *REGRA DE DRAWDOWN:*
   → Após ${params.drawdown_trigger_losses} perdas seguidas, reduza seu risco pela metade até obter 1 ganho

━━━━━━━━━━━━━━━━━━━━

💡 *Lembre-se: A disciplina é o único caminho para a consistência.*
  `.trim();
}
