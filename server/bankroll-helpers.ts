import type { BankrollSummaryDTO } from "@shared/schema";

// Tabela de configuração de risco por perfil e prazo
// Prazo        Perfil  Risco por Trade Meta Diária     Horizonte (dias)
const RISK_MATRIX = {
  curto: {
    agressivo: { riskPerTrade: 0.03, dailyTarget: 0.06, horizonDays: 15 },
    moderado: { riskPerTrade: 0.02, dailyTarget: 0.04, horizonDays: 30 },
    conservador: { riskPerTrade: 0.01, dailyTarget: 0.02, horizonDays: 30 },
  },
  medio: {
    agressivo: { riskPerTrade: 0.02, dailyTarget: 0.04, horizonDays: 45 },
    moderado: { riskPerTrade: 0.015, dailyTarget: 0.03, horizonDays: 60 },
    conservador: { riskPerTrade: 0.0075, dailyTarget: 0.015, horizonDays: 90 },
  },
  longo: {
    agressivo: { riskPerTrade: 0.015, dailyTarget: 0.03, horizonDays: 60 },
    moderado: { riskPerTrade: 0.01, dailyTarget: 0.02, horizonDays: 90 }, // equilibrado
    conservador: { riskPerTrade: 0.005, dailyTarget: 0.01, horizonDays: 180 },
  },
};

/**
 * Calcula os parâmetros de risco baseado no perfil e prazo
 */
export function computeRiskMatrix(
  timeHorizon: "curto" | "medio" | "longo",
  profile?: "conservador" | "moderado" | "agressivo"
): {
  profile: "conservador" | "moderado" | "agressivo";
  riskPerTrade: number;
  dailyTarget: number;
  horizonDays: number;
} {
  // Se perfil não for fornecido, usa moderado como padrão
  const selectedProfile = profile || "moderado";
  
  // Validação runtime: se horizonte inválido, usa 'medio' como fallback seguro
  const validHorizon = RISK_MATRIX[timeHorizon] ? timeHorizon : "medio";
  
  const config = RISK_MATRIX[validHorizon][selectedProfile];
  
  return {
    profile: selectedProfile,
    riskPerTrade: config.riskPerTrade,
    dailyTarget: config.dailyTarget,
    horizonDays: config.horizonDays,
  };
}

/**
 * Gera projeção de crescimento do bankroll ao longo dos dias (determinística)
 * @param initialBalance Saldo inicial da banca
 * @param dailyTarget Meta diária de lucro (em %)
 * @param days Número de dias para projetar
 * @returns Array de objetos com dia e saldo projetado
 */
export function buildProjection(
  initialBalance: number,
  dailyTarget: number,
  days: number
): Array<{ day: number; balance: number }> {
  const projection: Array<{ day: number; balance: number }> = [];

  // Dia 0 - saldo inicial
  projection.push({ day: 0, balance: initialBalance });

  // Calcular crescimento composto diário (determinístico usando fórmula de juros compostos)
  for (let day = 1; day <= days; day++) {
    const balance = initialBalance * Math.pow(1 + dailyTarget, day);
    
    projection.push({
      day,
      balance: Math.round(balance * 100) / 100, // Arredondar para 2 casas decimais
    });
  }

  return projection;
}

/**
 * Calcula o saldo alvo final baseado na projeção
 */
export function calculateTargetBalance(
  initialBalance: number,
  dailyTarget: number,
  days: number
): number {
  // Usar fórmula de juros compostos para meta esperada (sem variação)
  const targetBalance = initialBalance * Math.pow(1 + dailyTarget, days);
  return Math.round(targetBalance * 100) / 100;
}

/**
 * Formata o resumo da gestão de capital para enviar via WhatsApp
 */
export function summarizeForWhatsApp(summary: BankrollSummaryDTO): string {
  const profileLabels = {
    conservador: "Conservador",
    moderado: "Moderado",
    agressivo: "Agressivo",
  };

  const timeHorizonLabels = {
    curto: "Curto Prazo",
    medio: "Médio Prazo",
    longo: "Longo Prazo",
  };

  const riskPerTradePercent = (summary.riskPerTrade * 100).toFixed(2);
  const dailyTargetPercent = (summary.dailyProfitTarget * 100).toFixed(2);
  
  // Calcular lucro esperado por trade (assumindo risk:reward de 1:2 em média)
  const avgRiskReward = 2;
  const expectedProfitPerTrade = summary.bankrollValue * summary.riskPerTrade * avgRiskReward;
  
  // Calcular crescimento diário estimado baseado na meta diária
  const dailyGrowthEstimate = (summary.dailyProfitTarget * 100).toFixed(2);

  return `💼 *Sua Gestão Personalizada:*

📊 *Perfil:* ${profileLabels[summary.profile]} (${timeHorizonLabels[summary.timeHorizon]})
💰 *Saldo:* R$ ${summary.bankrollValue.toFixed(2)}
📉 *Risco por Trade:* ${riskPerTradePercent}%
💵 *Lucro Esperado/Trade:* R$ ${expectedProfitPerTrade.toFixed(2)}
📈 *Crescimento Diário Estimado:* +${dailyGrowthEstimate}%
🎯 *Meta Final (${summary.horizonDays} dias):* R$ ${summary.targetBalance.toFixed(2)}

📊 Gráfico de projeção disponível no painel.

✅ *Ajuste automático ativado* - Sua gestão será ajustada automaticamente baseada em performance.`;
}

/**
 * Formata mensagem de ajuste automático para WhatsApp
 */
export function formatAdjustmentMessage(
  newRiskPercent: number,
  newTargetPercent: number,
  reason: "consecutive_wins" | "consecutive_losses"
): string {
  const reasonLabels = {
    consecutive_wins: "3 ganhos consecutivos 🎉",
    consecutive_losses: "3 perdas consecutivas ⚠️",
  };

  return `⚙️ *Gestão ajustada automaticamente:*

Motivo: ${reasonLabels[reason]}

Novos parâmetros:
• Risco por trade: ${newRiskPercent.toFixed(2)}%
• Meta diária: ${newTargetPercent.toFixed(2)}%

Continue operando com disciplina! 💪`;
}
