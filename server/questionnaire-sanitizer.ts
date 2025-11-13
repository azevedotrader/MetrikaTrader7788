/**
 * SANITIZADOR PROFUNDO DE MÉTRICAS DE QUESTIONÁRIO
 * 
 * Limpa e valida win rate e risk/reward de qualquer formato (strings, arrays, objetos, nested)
 * para garantir apenas valores numéricos válidos dentro dos intervalos permitidos.
 * 
 * Intervalos válidos:
 * - Win Rate: 0-100
 * - Risk/Reward: 0.5-10
 */

export interface SanitizedMetrics {
  winRate?: number;
  riskReward?: number;
}

/**
 * Sanitiza profundamente um valor que pode ser número, string, array ou objeto
 * Retorna número válido ou undefined
 */
function deepSanitizeNumeric(value: any): number | undefined {
  // Null ou undefined
  if (value === null || value === undefined) {
    return undefined;
  }

  // Já é número
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  // String
  if (typeof value === 'string') {
    // Remove caracteres comuns de formatação: %, espaços, vírgulas locais
    const cleaned = value.replace(/[%\s]/g, '').replace(',', '.');
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : undefined;
  }

  // Array: tenta primeiro elemento
  if (Array.isArray(value) && value.length > 0) {
    return deepSanitizeNumeric(value[0]);
  }

  // Objeto: tenta propriedades comuns
  if (typeof value === 'object') {
    // Tenta acessar propriedades comuns: value, val, number, num
    for (const key of ['value', 'val', 'number', 'num']) {
      if (key in value && value[key] !== undefined) {
        return deepSanitizeNumeric(value[key]);
      }
    }
  }

  // Não conseguiu converter
  return undefined;
}

/**
 * Sanitiza métricas de questionário (win rate e risk/reward)
 * Aceita qualquer formato e retorna apenas valores válidos
 */
export function sanitizeQuestionnaireMetrics(
  winRate: any,
  riskReward: any
): SanitizedMetrics {
  // Sanitizar win rate
  const winRateNum = deepSanitizeNumeric(winRate);
  const validWinRate = 
    winRateNum !== undefined && winRateNum >= 0 && winRateNum <= 100
      ? winRateNum
      : undefined;

  // Sanitizar risk/reward
  const riskRewardNum = deepSanitizeNumeric(riskReward);
  const validRiskReward = 
    riskRewardNum !== undefined && riskRewardNum >= 0.5 && riskRewardNum <= 10
      ? riskRewardNum
      : undefined;

  return {
    winRate: validWinRate,
    riskReward: validRiskReward,
  };
}

/**
 * Sanitiza objeto completo de respostas parciais do questionário
 * USA WHITELIST: Remove qualquer campo não permitido + sanitiza métricas
 */
export function sanitizePartialAnswers(partialAnswers: any): any {
  if (!partialAnswers || typeof partialAnswers !== 'object') {
    return {};
  }

  // Sanitizar métricas opcionais
  const metrics = sanitizeQuestionnaireMetrics(
    partialAnswers.q5_winRate,
    partialAnswers.q5_riskReward
  );

  // Rebuildar objeto apenas com campos permitidos (whitelist) + validação de tipos
  const sanitized: any = {};
  
  // q1, q2, q4, q6, q7: Devem ser strings alfabéticas (A, B, ou C apenas)
  const singleChoiceFields = ['q1', 'q2', 'q4', 'q6', 'q7'];
  for (const field of singleChoiceFields) {
    if (field in partialAnswers) {
      const value = partialAnswers[field];
      
      // Caso 1: String direta (validar alfabética, rejeitar numéricos)
      if (typeof value === 'string') {
        const upper = value.toUpperCase();
        // REJEITAR strings numéricas ou não-alfabéticas
        if (/^[A-C]$/.test(upper)) {
          sanitized[field] = upper;
        }
      } 
      // Caso 2: Array (tomar primeiro elemento válido) - legacy format
      else if (Array.isArray(value) && value.length > 0) {
        const firstValid = value.find(v => {
          if (typeof v === 'string' && /^[A-C]$/i.test(v)) return true;
          if (typeof v === 'object' && v?.value && typeof v.value === 'string' && /^[A-C]$/i.test(v.value)) return true;
          return false;
        });
        
        if (firstValid) {
          const extracted = typeof firstValid === 'string' 
            ? firstValid.toUpperCase() 
            : String(firstValid.value).toUpperCase();
          sanitized[field] = extracted;
        }
      }
      // Caso 3: Objeto { value: 'A' } legacy format
      else if (typeof value === 'object' && value?.value && typeof value.value === 'string') {
        const upper = String(value.value).toUpperCase();
        if (/^[A-C]$/.test(upper)) {
          sanitized[field] = upper;
        }
      }
    }
  }

  // q3: Deve ser array de strings (mercados: A, B, C, D, E) - COM DEDUPE E LIMITE
  if ('q3' in partialAnswers) {
    const value = partialAnswers.q3;
    if (Array.isArray(value)) {
      // Filtrar apenas valores alfabéticos válidos (rejeitar numéricos)
      const validMarkets = value
        .map(v => {
          if (typeof v === 'string' && /^[A-E]$/i.test(v)) return v.toUpperCase();
          if (typeof v === 'object' && v?.value && /^[A-E]$/i.test(String(v.value))) {
            return String(v.value).toUpperCase();
          }
          return null;
        })
        .filter(v => v !== null);
      
      // DEDUPE e LIMITE (máximo 5 mercados, que é o total de opções)
      const uniqueMarkets = Array.from(new Set(validMarkets)).slice(0, 5);
      
      if (uniqueMarkets.length > 0) {
        sanitized.q3 = uniqueMarkets;
      }
    } else if (typeof value === 'string') {
      // Pode vir como string única, converter para array (validar alfabético)
      const upper = value.toUpperCase();
      if (/^[A-E]$/.test(upper)) {
        sanitized.q3 = [upper];
      }
    }
  }

  // Métricas opcionais sanitizadas
  sanitized.q5_winRate = metrics.winRate;
  sanitized.q5_riskReward = metrics.riskReward;

  return sanitized;
}

/**
 * Sanitiza campos custom de bankroll management (strings armazenadas no DB)
 * Retorna strings numéricas válidas ou null
 */
export function sanitizeCustomMetrics(
  customWinRate: string | null | undefined,
  customRiskReward: string | null | undefined
): { customWinRate: string | null; customRiskReward: string | null } {
  const metrics = sanitizeQuestionnaireMetrics(customWinRate, customRiskReward);

  return {
    customWinRate: metrics.winRate !== undefined ? metrics.winRate.toString() : null,
    customRiskReward: metrics.riskReward !== undefined ? metrics.riskReward.toString() : null,
  };
}
