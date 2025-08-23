/**
 * Extrator de Trades Inteligente - Foca na coluna "Res. Operação"
 * ============================================================
 * 
 * Este módulo foca especificamente em extrair trades da coluna 
 * "Res. Operação" mencionada pelo usuário, que contém o resultado 
 * individual de cada trade.
 */

import { InsertTrade } from '@shared/schema';
import { ParsedCSVResult } from './universal-csv-parser';
import { parseDetectedDate, normalizeDateToISO } from './date-validator';

/**
 * Extrai trades focando na coluna "Res. Operação" e colunas relacionadas
 */
export function extractTradesFromUniversalCSV(
  parsedData: ParsedCSVResult,
  userId: string,
  csvImportId: string,
  brokerHint?: string
): {
  trades: InsertTrade[];
  summary: {
    totalRows: number;
    tradesFound: number;
    statisticsSkipped: number;
    dateRange: { start: string; end: string } | null;
    detectedBroker: string;
    detectedMarket: string;
    processingMethod: string;
  };
  errors: string[];
} {
  console.log(`\n🎯 EXTRAÇÃO DE TRADES - FOCO EM "RES. OPERAÇÃO"`);
  console.log(`${'='.repeat(60)}`);
  
  const trades: InsertTrade[] = [];
  const errors: string[] = [...parsedData.errors];
  const dates: Date[] = [];
  
  // 1. Verificar validação de datas (obrigatória)
  if (!parsedData.dateValidation.isValid) {
    console.log(`❌ ARQUIVO REJEITADO: Não contém datas válidas`);
    errors.push(...parsedData.dateValidation.errors);
    
    return {
      trades: [],
      summary: {
        totalRows: parsedData.totalRows,
        tradesFound: 0,
        statisticsSkipped: parsedData.skippedRows,
        dateRange: null,
        detectedBroker: 'unknown',
        detectedMarket: 'unknown',
        processingMethod: 'Rejeitado - Sem datas válidas'
      },
      errors
    };
  }
  
  console.log(`✅ DATAS VÁLIDAS: coluna "${parsedData.dateValidation.dateColumn}" com ${parsedData.dateValidation.validDatesCount} datas`);
  
  // 2. Verificar se temos a coluna "Res. Operação" ou similar
  const resultColumn = parsedData.keyColumns.resultado;
  if (!resultColumn) {
    console.log(`⚠️ Coluna "Res. Operação" não encontrada`);
    console.log(`📋 Colunas disponíveis:`, parsedData.headers);
    errors.push('❌ Coluna "Res. Operação" não encontrada - necessária para cálculo de performance');
  }
  
  // Detectar broker e mercado baseado nos dados
  const detectedBroker = detectBrokerFromData(parsedData);
  const detectedMarket = detectMarketFromData(parsedData);
  
  console.log(`🏦 Broker detectado: ${detectedBroker}`);
  console.log(`📊 Mercado detectado: ${detectedMarket}`);
  
  // Processar cada linha
  for (let index = 0; index < parsedData.data.length; index++) {
    const row = parsedData.data[index];
    
    try {
      // Extrair resultado da operação (coluna principal)
      const resultado = extractResultFromRow(row, resultColumn, parsedData.numberFormat);
      
      // Pular linhas sem resultado válido
      if (resultado === null) {
        console.log(`⏭️ Linha ${index + 1}: sem resultado válido`);
        continue;
      }
      
      // Extrair outros dados da linha
      const tradeData = extractTradeDataFromRow(row, parsedData, index);
      
      if (!tradeData) {
        console.log(`⚠️ Linha ${index + 1}: dados insuficientes`);
        continue;
      }
      
      // Criar objeto trade
      const trade: InsertTrade = {
        userId,
        csvImportId,
        dataHora: tradeData.dataHora,
        ativo: tradeData.ativo,
        mercado: detectedMarket,
        setup: 'Importado CSV',
        capitalUtilizado: Math.abs(resultado) * 10, // Estimativa baseada no resultado
        resultado: resultado,
        quantidade: tradeData.quantidade || 1,
        tipo: resultado >= 0 ? 'compra' : 'venda', // Inferir tipo baseado no resultado
        comentario: `Trade importado - ${resultColumn}: ${resultado}`,
        precoEntrada: tradeData.precoEntrada,
        precoSaida: tradeData.precoSaida,
        corretora: detectedBroker,
        origem: 'csv'
      };
      
      trades.push(trade);
      
      if (tradeData.dataHora) {
        dates.push(new Date(tradeData.dataHora));
      }
      
      console.log(`✅ Trade ${trades.length}: ${trade.ativo} - R$ ${resultado.toFixed(2)}`);
      
    } catch (error) {
      console.error(`❌ Erro na linha ${index + 1}:`, error);
      errors.push(`Linha ${index + 1}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
  
  // Calcular range de datas
  let dateRange: { start: string; end: string } | null = null;
  if (dates.length > 0) {
    dates.sort((a, b) => a.getTime() - b.getTime());
    dateRange = {
      start: dates[0].toISOString().split('T')[0],
      end: dates[dates.length - 1].toISOString().split('T')[0]
    };
  }
  
  console.log(`\n📊 RESULTADO DA EXTRAÇÃO:`);
  console.log(`   ✅ Trades extraídos: ${trades.length}`);
  console.log(`   📅 Período: ${dateRange?.start} a ${dateRange?.end}`);
  console.log(`${'='.repeat(60)}\n`);
  
  return {
    trades,
    summary: {
      totalRows: parsedData.totalRows,
      tradesFound: trades.length,
      statisticsSkipped: parsedData.skippedRows,
      dateRange,
      detectedBroker,
      detectedMarket,
      processingMethod: 'Sistema Inteligente Universal - Foco em Res. Operação'
    },
    errors
  };
}

/**
 * Extrai o resultado da operação da linha
 */
function extractResultFromRow(
  row: any, 
  resultColumn: string | undefined, 
  numberFormat: 'brazilian' | 'international'
): number | null {
  if (!resultColumn || !(resultColumn in row)) {
    // Tentar encontrar resultado em qualquer coluna que contenha números
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === 'number') {
        // Verificar se parece um resultado de trade (não muito grande)
        if (Math.abs(value) > 0 && Math.abs(value) < 1000000) {
          return value;
        }
      }
    }
    return null;
  }
  
  const value = row[resultColumn];
  if (typeof value === 'number') {
    return value;
  }
  
  return null;
}

/**
 * Extrai dados complementares da linha
 */
function extractTradeDataFromRow(
  row: any, 
  parsedData: ParsedCSVResult, 
  index: number
): {
  dataHora: string;
  ativo: string;
  quantidade?: number;
  precoEntrada?: number;
  precoSaida?: number;
} | null {
  
  // Extrair ativo
  const ativo = extractAssetFromRow(row, parsedData.keyColumns.ativo);
  if (!ativo) {
    return null;
  }
  
  // Extrair data usando validação obrigatória
  const dataHora = extractDateFromRow(
    row, 
    parsedData.dateValidation.dateColumn, 
    parsedData.dateValidation.detectedFormat
  ) || new Date().toISOString();
  
  // Extrair quantidade
  const quantidade = extractQuantityFromRow(row, parsedData.keyColumns.quantidade);
  
  // Extrair preços
  const { precoEntrada, precoSaida } = extractPricesFromRow(row, parsedData.keyColumns.preco);
  
  return {
    dataHora,
    ativo,
    quantidade,
    precoEntrada,
    precoSaida
  };
}

/**
 * Extrai o ativo da linha
 */
function extractAssetFromRow(row: any, assetColumn?: string): string | null {
  if (assetColumn && row[assetColumn]) {
    const ativo = String(row[assetColumn]).trim();
    if (ativo && ativo.length > 0) {
      return ativo.toUpperCase();
    }
  }
  
  // Procurar em outras colunas por padrões de ativos
  for (const [key, value] of Object.entries(row)) {
    const str = String(value).trim().toUpperCase();
    
    // Padrões brasileiros
    if (/^(WIN|WDO|IND|DOL|BGI|ISP|ICF|SFI|CCM|OZ1|OZ2|OZ3)/.test(str)) {
      return str;
    }
    
    // Padrões de ações brasileiras
    if (/^[A-Z]{4}[0-9]{1,2}$/.test(str)) {
      return str;
    }
    
    // Padrões crypto
    if (/^(BTC|ETH|BNB|ADA|SOL|DOT)/.test(str)) {
      return str;
    }
  }
  
  // Fallback para índice da linha
  return `TRADE_${String(Date.now()).slice(-6)}`;
}

/**
 * Extrai data da linha usando o formato detectado
 */
function extractDateFromRow(
  row: any, 
  dateColumn: string | null, 
  detectedFormat: string | null
): string | null {
  if (!dateColumn || !row[dateColumn]) {
    return null;
  }
  
  try {
    const dateValue = row[dateColumn];
    
    if (dateValue instanceof Date) {
      return normalizeDateToISO(dateValue);
    }
    
    const dateStr = String(dateValue).trim();
    if (!dateStr) {
      return null;
    }
    
    // Usar o formato detectado pela validação
    const parsedDate = parseDetectedDate(dateStr, detectedFormat);
    
    if (parsedDate) {
      return normalizeDateToISO(parsedDate);
    }
    
    console.warn(`⚠️ Não foi possível parsear data: "${dateStr}"`);
    return null;
    
  } catch (error) {
    console.warn(`❌ Erro ao parsear data:`, error);
    return null;
  }
}

/**
 * Extrai quantidade da linha
 */
function extractQuantityFromRow(row: any, quantityColumn?: string): number | undefined {
  if (quantityColumn && row[quantityColumn]) {
    const value = row[quantityColumn];
    if (typeof value === 'number' && value > 0) {
      return value;
    }
  }
  
  // Procurar por números que pareçam quantidade (tipicamente pequenos)
  for (const value of Object.values(row)) {
    if (typeof value === 'number' && value > 0 && value <= 10000) {
      return value;
    }
  }
  
  return undefined;
}

/**
 * Extrai preços da linha
 */
function extractPricesFromRow(row: any, priceColumn?: string): { precoEntrada?: number; precoSaida?: number } {
  const prices: number[] = [];
  
  // Coletar todos os números que parecem preços
  for (const value of Object.values(row)) {
    if (typeof value === 'number' && value > 0 && value < 1000000) {
      prices.push(value);
    }
  }
  
  prices.sort((a, b) => a - b);
  
  if (prices.length >= 2) {
    return {
      precoEntrada: prices[0],
      precoSaida: prices[prices.length - 1]
    };
  } else if (prices.length === 1) {
    return {
      precoEntrada: prices[0]
    };
  }
  
  return {};
}

/**
 * Detecta broker baseado nos dados
 */
function detectBrokerFromData(parsedData: ParsedCSVResult): string {
  const headers = parsedData.headers.join(' ').toLowerCase();
  
  if (headers.includes('clear') || headers.includes('rico')) {
    return 'clear';
  }
  
  if (headers.includes('xp') || headers.includes('investimentos')) {
    return 'xp';
  }
  
  if (headers.includes('inter') || headers.includes('banco inter')) {
    return 'inter';
  }
  
  if (headers.includes('gate') || headers.includes('crypto')) {
    return 'crypto';
  }
  
  return 'auto';
}

/**
 * Detecta mercado baseado nos dados
 */
function detectMarketFromData(parsedData: ParsedCSVResult): string {
  const allText = parsedData.data
    .slice(0, 10) // Primeiras 10 linhas
    .map(row => Object.values(row).join(' '))
    .join(' ')
    .toLowerCase();
  
  // Padrões para B3
  if (/win|wdo|ind|dol|bgi|isp|icf|sfi|ccm|petr|vale|itub|bbdc/.test(allText)) {
    return 'b3';
  }
  
  // Padrões para Crypto
  if (/btc|eth|bnb|ada|sol|dot|usdt|busd/.test(allText)) {
    return 'crypto';
  }
  
  // Padrões para Forex
  if (/eur|gbp|usd|jpy|cad|aud|chf/.test(allText)) {
    return 'forex';
  }
  
  return 'b3'; // Default
}