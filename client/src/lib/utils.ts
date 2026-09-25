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

/**
 * Taxa de acerto (assertividade) em porcentagem.
 *
 * Breakeven (0x0) é nulo: não conta como acerto nem como erro, e também não
 * entra no total. Com 3 takes, 3 losses e 3 breakevens a taxa é 50%, não 33%.
 * Dividir pelo total de trades fazia o 0x0 derrubar a taxa sem que tivesse
 * havido prejuízo nenhum.
 */
export function taxaAcerto(trades: Array<{ resultado?: string | number | null }> | null | undefined): number {
  let acertos = 0;
  let erros = 0;
  for (const t of trades || []) {
    const r = parseFloat(String(t?.resultado ?? 0));
    if (!Number.isFinite(r)) continue;
    if (r > 0) acertos++;
    else if (r < 0) erros++;
  }
  const decididos = acertos + erros;
  return decididos > 0 ? (acertos / decididos) * 100 : 0;
}

/** Mesma regra, para quem já tem as contagens separadas. */
export function taxaAcertoDe(acertos: number, erros: number): number {
  const decididos = acertos + erros;
  return decididos > 0 ? (acertos / decididos) * 100 : 0;
}

/**
 * Formata um número exatamente como foi registrado, sem arredondar para
 * inteiro: 3.8 → "3,8", 0.25 → "0,25", 4 → "4". Até 4 casas, que é a
 * precisão do banco. Somas em ponto flutuante (25.499999…) saem certas.
 */
export function formatExato(valor: number, locale = "pt-BR", minCasas = 0): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: minCasas,
    maximumFractionDigits: 4,
  }).format(Number.isFinite(valor) ? valor : 0);
}

/** "+3,8R", "-0,25R", "0R" */
export function formatR(valor: number, locale = "pt-BR"): string {
  const v = Number.isFinite(valor) ? Math.round(valor * 10000) / 10000 : 0;
  return `${v > 0 ? "+" : ""}${formatExato(v, locale)}R`;
}

export function somaR(trades: Array<{ resultado?: string | number | null }> | null | undefined): number {
  return (trades || []).reduce((soma, t) => soma + tradeR(t), 0);
}
