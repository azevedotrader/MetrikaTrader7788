/**
 * Sistema Inteligente de Interpretação de Estatísticas CSV
 * ====================================================
 * 
 * Interpreta dados de performance/estatísticas como trades estruturados
 * Reconhece: datas, valores monetários, percentuais, ratios, métricas
 */

import { InsertTrade } from '@shared/schema';

export interface StatisticsInterpreter {
  interpretStatisticsAsTradesWithCorrectValues(
    csvData: any[],
    userId: string,
    broker: string
  ): InsertTrade[];
}

/**
 * Interpreta dados de estatísticas como trades com valores corretos
 */
export function interpretStatisticsAsTradesWithCorrectValues(
  csvData: any[],
  userId: string,
  broker: string = 'b3'
): InsertTrade[] {
  console.log(`🧠 Iniciando interpretação inteligente de estatísticas...`);
  
  const trades: InsertTrade[] = [];
  let globalDate = new Date();
  
  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];
    const rowValues = Object.values(row);
    
    if (rowValues.length < 2) continue;
    
    const [description, value] = rowValues;
    const descStr = String(description).toLowerCase().trim();
    const valueStr = String(value).trim();
    
    console.log(`🔍 Analisando: "${descStr}" = "${valueStr}"`);
    
    // Pular linhas vazias ou inválidas
    if (!descStr || !valueStr || valueStr === '-') {
      console.log(`⏭️ Pulando linha vazia/inválida`);
      continue;
    }
    
    // 1. DETECTAR E EXTRAIR DATAS
    const extractedDate = extractDateFromValue(valueStr);
    if (extractedDate) {
      globalDate = extractedDate;
      console.log(`📅 Data global atualizada: ${globalDate.toISOString().split('T')[0]}`);
      continue;
    }
    
    // 2. INTERPRETAR MÉTRICAS FINANCEIRAS COMO TRADES ESTRUTURADOS
    const interpretedTrade = interpretFinancialMetric(
      descStr,
      valueStr,
      globalDate,
      userId,
      broker,
      i
    );
    
    if (interpretedTrade) {
      trades.push(interpretedTrade);
      console.log(`✅ Trade criado: ${interpretedTrade.ativo} - ${interpretedTrade.resultado}`);
    }
  }
  
  console.log(`🎯 Interpretação concluída: ${trades.length} trades estruturados criados`);
  return trades;
}

/**
 * Extrai data do valor (suporta múltiplos formatos)
 */
function extractDateFromValue(valueStr: string): Date | null {
  const datePatterns = [
    // DD/MM/YYYY
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    // DD-MM-YYYY  
    /(\d{1,2})-(\d{1,2})-(\d{4})/,
    // YYYY-MM-DD
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
    // DD.MM.YYYY
    /(\d{1,2})\.(\d{1,2})\.(\d{4})/
  ];
  
  for (const pattern of datePatterns) {
    const match = valueStr.match(pattern);
    if (match) {
      const [, p1, p2, p3] = match;
      
      // Tentar diferentes interpretações
      const interpretations = [
        new Date(parseInt(p3), parseInt(p2) - 1, parseInt(p1)), // DD/MM/YYYY
        new Date(parseInt(p1), parseInt(p2) - 1, parseInt(p3))  // YYYY-MM-DD
      ];
      
      for (const date of interpretations) {
        if (date.getFullYear() >= 2020 && date.getFullYear() <= 2030) {
          return date;
        }
      }
    }
  }
  
  return null;
}

/**
 * Interpreta métrica financeira como trade estruturado
 */
function interpretFinancialMetric(
  description: string,
  value: string,
  date: Date,
  userId: string,
  broker: string,
  lineIndex: number
): InsertTrade | null {
  
  // Extrair valor numérico limpo
  const numericValue = extractCleanNumericValue(value);
  if (numericValue === null) {
    console.log(`⚠️ Valor não numérico: "${value}"`);
    return null;
  }
  
  // Determinar tipo de métrica e criar trade apropriado
  const tradeData = categorizeFinancialMetric(description, numericValue);
  if (!tradeData) {
    console.log(`❌ Métrica não reconhecida: "${description}"`);
    return null;
  }
  
  console.log(`🎯 Métrica identificada: ${tradeData.category} - Valor: ${numericValue}`);
  
  return {
    userId,
    corretora: broker as 'b3' | 'crypto' | 'forex',
    origem: 'csv-statistics',
    mercado: 'b3',
    setup: tradeData.category,
    dataHora: date.toISOString(),
    ativo: tradeData.symbol,
    tipo: numericValue >= 0 ? 'compra' : 'venda',
    quantidade: '1.0000',
    capitalUtilizado: Math.abs(numericValue).toFixed(2),
    precoEntrada: Math.abs(numericValue).toFixed(4),
    precoSaida: Math.abs(numericValue).toFixed(4),
    resultado: numericValue.toFixed(2),
    stop: '0.0000',
    alvo: Math.abs(numericValue * 1.1).toFixed(4),
    risco: Math.abs(numericValue * 0.02).toFixed(2),
    comentario: `Estatística interpretada: ${description} = ${value}`,
  };
}

/**
 * Extrai valor numérico limpo (suporta formato brasileiro e percentuais)
 */
function extractCleanNumericValue(value: string): number | null {
  // Remover espaços e caracteres especiais
  let cleanValue = value.replace(/\s+/g, '');
  
  // Detectar percentual
  const isPercentage = cleanValue.includes('%');
  cleanValue = cleanValue.replace(/%/g, '');
  
  // Converter formato brasileiro para internacional
  // Exemplo: "1.234,56" -> "1234.56"
  if (/\d+\.\d{3},\d{2}/.test(cleanValue)) {
    cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
  } else if (/\d+,\d{2}$/.test(cleanValue)) {
    // Exemplo: "123,45" -> "123.45"
    cleanValue = cleanValue.replace(',', '.');
  }
  
  // Extrair número
  const match = cleanValue.match(/-?\d+\.?\d*/);
  if (!match) return null;
  
  let numValue = parseFloat(match[0]);
  
  // Aplicar percentual se detectado
  if (isPercentage && numValue > -100 && numValue < 1000) {
    // Manter percentual como está para ratios e drawdowns
    return numValue;
  }
  
  return numValue;
}

/**
 * Categoriza métrica financeira e retorna dados estruturados
 */
function categorizeFinancialMetric(description: string, value: number): {
  category: string;
  symbol: string;
  type: 'performance' | 'risk' | 'return' | 'statistic';
} | null {
  
  const desc = description.toLowerCase();
  
  // PERFORMANCE METRICS
  if (desc.includes('rentabilidade total') || desc.includes('retorno total')) {
    return {
      category: 'Rentabilidade Total',
      symbol: 'RENT_TOTAL',
      type: 'return'
    };
  }
  
  if (desc.includes('lucro liquido') || desc.includes('lucro líquido')) {
    return {
      category: 'Lucro Líquido',
      symbol: 'LUCRO_LIQ',
      type: 'return'
    };
  }
  
  if (desc.includes('melhor trade') || desc.includes('maior ganho')) {
    return {
      category: 'Melhor Trade',
      symbol: 'BEST_TRADE',
      type: 'performance'
    };
  }
  
  if (desc.includes('pior trade') || desc.includes('maior perda')) {
    return {
      category: 'Pior Trade',
      symbol: 'WORST_TRADE',
      type: 'performance'
    };
  }
  
  // RISK METRICS  
  if (desc.includes('drawdown') || desc.includes('declínio máximo')) {
    return {
      category: 'Drawdown Máximo',
      symbol: 'DRAWDOWN',
      type: 'risk'
    };
  }
  
  if (desc.includes('r/r') || desc.includes('risco retorno') || desc.includes('risk reward')) {
    return {
      category: 'Ratio R/R',
      symbol: 'RR_RATIO',
      type: 'risk'
    };
  }
  
  // STATISTICS
  if (desc.includes('patrimônio máximo') || desc.includes('capital máximo')) {
    return {
      category: 'Patrimônio Máximo',
      symbol: 'PATRIM_MAX',
      type: 'statistic'
    };
  }
  
  if (desc.includes('win rate') || desc.includes('taxa de acerto')) {
    return {
      category: 'Win Rate',
      symbol: 'WIN_RATE',
      type: 'statistic'
    };
  }
  
  if (desc.includes('trades vencedores') || desc.includes('positivos')) {
    return {
      category: 'Trades Vencedores',
      symbol: 'TRADES_WIN',
      type: 'statistic'
    };
  }
  
  if (desc.includes('trades perdedores') || desc.includes('negativos')) {
    return {
      category: 'Trades Perdedores',
      symbol: 'TRADES_LOSS',
      type: 'statistic'
    };
  }
  
  // FALLBACK - Qualquer métrica com números
  if (value !== 0) {
    const shortDesc = description.substring(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, '');
    return {
      category: 'Métrica Geral',
      symbol: shortDesc || 'METRIC',
      type: 'statistic'
    };
  }
  
  return null;
}