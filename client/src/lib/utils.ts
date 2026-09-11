import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Múltiplo R de um trade.
 *
 * O campo `resultado` JÁ guarda o múltiplo: ao registrar "GBPJPY long 4R take"
 * o app grava resultado = 4. O campo `risco` guarda o mesmo número quando o
 * texto trazia "4R"/"3x", e fica vazio quando o valor foi digitado puro
 * ("-0,2").
 *
 * O cálculo anterior fazia `resultado / risco`, o que dava:
 *   - 1R para todo trade com múltiplo explícito (4/4 = 1), achatando um +8R
 *     para +1R;
 *   - 0R para todo trade sem `risco`, removendo perdas parciais da soma —
 *     por isso o total só errava para cima.
 *
 * Somar `resultado` reproduz exatamente o fechamento manual da semana.
 */
export function tradeR(trade: { resultado?: string | number | null }): number {
  const r = parseFloat(String(trade?.resultado ?? 0));
  return Number.isFinite(r) ? r : 0;
}

export function somaR(trades: Array<{ resultado?: string | number | null }> | null | undefined): number {
  return (trades || []).reduce((soma, t) => soma + tradeR(t), 0);
}
