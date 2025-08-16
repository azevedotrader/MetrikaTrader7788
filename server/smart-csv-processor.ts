/**
 * Sistema Inteligente de Processamento CSV Universal
 * ================================================
 * 
 * Resolve os problemas atuais:
 * 1. Identifica trades REAIS vs dados de resumo/estatísticas
 * 2. Preserva datas originais do CSV
 * 3. Funciona com QUALQUER formato de CSV
 * 4. Detecta automaticamente o tipo de broker/mercado
 */

import Papa from 'papaparse';
import { InsertTrade } from '@shared/schema';
import fs from 'fs';

export interface SmartCSVResult {
  trades: InsertTrade[];
  summary: {
    totalRows: number;
    tradesFound: number;
    statisticsSkipped: number;
    dateRange: { start: string; end: string } | null;
    detectedBroker: string;
    detectedMarket: string;
  };
  errors: string[];
}

/**
 * Padrões para identificar linhas que NÃO são trades
 */
const NON_TRADE_PATTERNS = [
  // Cabeçalhos de seções
  /^(resumo|summary|total|estatística|statistics|relatório|report)/i,
  
  // Campos de estatísticas
  /patrimônio|capital|saldo|drawdown|retorno|percentual|necessário|máximo|mínimo|tempo no mercado/i,
  
  // Totalizadores
  /^(total|soma|média|average|min|max|count|qtd)/i,
  
  // Valores de configuração
  /configuração|config|setting|parameter|parâmetro/i,
  
  // Linhas vazias ou separadores
  /^[\s\-=_]*$/,
  
  // Linhas que começam com números mas são métricas
  /^\d+[\.,]\d+%\s*$/, // Apenas percentuais
  /^\d+[\.,]\d{2}\s*(real|reais|r\$|brl|usd)\s*$/i // Apenas valores monetários sem contexto
];

/**
 * Padrões para identificar símbolos de trading válidos
 */
const TRADING_SYMBOL_PATTERNS = {
  b3: /^(WIN|WDO|IND|DOL|BGI|ISP|ICF|SFI|CCM|OZ1|OZ2|OZ3|PETR[34]|VALE[35]|ITUB[34]|BBDC[34])[A-Z0-9]*$/i,
  crypto: /^(BTC|ETH|BNB|ADA|SOL|DOT|MATIC|LINK|UNI|AAVE|ATOM|XRP|LTC|BCH|EOS|TRX|XLM|XMR|DASH|ZEC|ETC)[\/\-]?(USDT|BUSD|BRL|USD)?$/i,
  forex: /^(EUR|GBP|USD|JPY|CAD|AUD|CHF|NZD|SEK|NOK|DKK|PLN|CZK|HUF|TRY|ZAR|MXN|BRL)[\/\-]?(USD|EUR|GBP|JPY|CAD|AUD|CHF|BRL)$/i
};

/**
 * Padrões para identificar tipos de operação
 */
const OPERATION_TYPE_PATTERNS = {
  buy: /^(c|compra|buy|long|entrada|open)$/i,
  sell: /^(v|venda|sell|short|saída|close)$/i
};

/**
 * Função principal para processar CSV de forma inteligente
 */
export async function processSmartCSV(
  filePath: string,
  userId: string,
  brokerHint: string = 'auto'
): Promise<SmartCSVResult> {
  console.log(`🧠 Iniciando processamento inteligente: ${filePath}`);
  
  const result: SmartCSVResult = {
    trades: [],
    summary: {
      totalRows: 0,
      tradesFound: 0,
      statisticsSkipped: 0,
      dateRange: null,
      detectedBroker: brokerHint,
      detectedMarket: 'b3'
    },
    errors: []
  };

  try {
    // 1. Ler arquivo CSV
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    
    // 2. Detectar delimitador automaticamente
    const delimiter = detectDelimiter(csvContent);
    console.log(`🔍 Delimitador detectado: "${delimiter}"`);
    
    // 3. Parse com Papa
    const parseResult = Papa.parse(csvContent, {
      delimiter: delimiter,
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      transform: (value: string) => value.trim()
    });

    if (parseResult.errors.length > 0) {
      console.warn('⚠️ Erros no parse:', parseResult.errors);
      result.errors.push(...parseResult.errors.map(e => typeof e === 'string' ? e : e.message || 'Erro de parse'));
    }

    result.summary.totalRows = parseResult.data.length;
    console.log(`📊 Linhas totais encontradas: ${result.summary.totalRows}`);

    // 4. Detectar broker/mercado baseado nas colunas e dados
    const detectedInfo = detectBrokerAndMarket(parseResult.data, parseResult.meta.fields || []);
    result.summary.detectedBroker = detectedInfo.broker;
    result.summary.detectedMarket = detectedInfo.market;
    
    console.log(`🎯 Detectado - Broker: ${detectedInfo.broker}, Mercado: ${detectedInfo.market}`);

    // 5. Processar cada linha
    let dates: Date[] = [];
    
    for (let index = 0; index < parseResult.data.length; index++) {
      const row = parseResult.data[index];
      try {
        // Verificar se é uma linha válida de trade
        if (!isValidTradeRow(row, index)) {
          result.summary.statisticsSkipped++;
          continue;
        }

        // Extrair trade da linha
        const trade = extractTradeFromRow(
          row, 
          userId, 
          detectedInfo.broker, 
          detectedInfo.market,
          index
        );

        if (trade) {
          result.trades.push(trade);
          result.summary.tradesFound++;
          
          // Coletar data para range
          const tradeDate = new Date(trade.dataHora);
          if (!isNaN(tradeDate.getTime())) {
            dates.push(tradeDate);
          }
        }
      } catch (error: any) {
        console.error(`❌ Erro na linha ${index}:`, error);
        result.errors.push(`Linha ${index}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    // 6. Calcular range de datas
    if (dates.length > 0) {
      dates.sort((a, b) => a.getTime() - b.getTime());
      result.summary.dateRange = {
        start: dates[0].toISOString().split('T')[0],
        end: dates[dates.length - 1].toISOString().split('T')[0]
      };
    }

    // 7. Verificar se é arquivo de estatísticas e dar feedback adequado
    if (result.trades.length === 0) {
      const hasStatisticsData = parseResult.data.some(row => 
        Object.values(row as Record<string, any>).some(val => 
          typeof val === 'string' && (
            val.includes('lucro') || val.includes('prejuízo') || 
            val.includes('operações') || val.includes('percentual') ||
            val.includes('patrimônio') || val.includes('drawdown') ||
            val.includes('retorno') || val.includes('saldo') ||
            val.includes('fator de lucro') || val.includes('média') ||
            val.includes('declínio') || val.includes('sequência')
          )
        )
      );

      if (hasStatisticsData) {
        result.errors.push('❌ ARQUIVO DE ESTATÍSTICAS DETECTADO');
        result.errors.push('Este arquivo contém dados de performance/resumo, não trades individuais.');
        result.errors.push('📋 FORMATO ESPERADO: CSV com trades individuais contendo:');
        result.errors.push('• Símbolo do ativo (ex: WINQ25, PETR4, BTCUSDT)');
        result.errors.push('• Data/hora de entrada e saída');
        result.errors.push('• Preços de entrada e saída');
        result.errors.push('• Resultado da operação (lucro/prejuízo)');
        result.errors.push('• Quantidade operada');
        result.errors.push('💡 DICA: Exporte o histórico de trades individuais da sua corretora, não o relatório de performance.');
      } else {
        result.errors.push('Nenhum trade válido identificado no arquivo');
        result.errors.push('Verifique se o arquivo contém dados de trades individuais com símbolos reconhecíveis');
      }
    }

    console.log(`✅ Processamento concluído:`);
    console.log(`   - Trades encontrados: ${result.summary.tradesFound}`);
    console.log(`   - Linhas ignoradas: ${result.summary.statisticsSkipped}`);
    console.log(`   - Range de datas: ${result.summary.dateRange?.start} a ${result.summary.dateRange?.end}`);

    return result;

  } catch (error) {
    console.error('❌ Erro no processamento:', error);
    result.errors.push(error instanceof Error ? error.message : 'Erro desconhecido no processamento');
    return result;
  }
}

/**
 * Detecta o delimitador do CSV
 */
function detectDelimiter(content: string): string {
  const delimiters = [';', ',', '\t', '|', ':'];
  const sample = content.substring(0, 2000); // Primeira amostra
  
  let bestDelimiter = ',';
  let maxCount = 0;
  
  for (const delimiter of delimiters) {
    const count = (sample.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delimiter;
    }
  }
  
  return bestDelimiter;
}

/**
 * Detecta broker e mercado baseado nos dados
 */
function detectBrokerAndMarket(data: any[], headers: string[]): { broker: string; market: string } {
  const headerStr = headers.join(' ').toLowerCase();
  const sampleData = data.slice(0, 10).map(row => Object.values(row).join(' ')).join(' ').toLowerCase();
  
  // Detectar por símbolos nos dados
  for (const [market, pattern] of Object.entries(TRADING_SYMBOL_PATTERNS)) {
    if (pattern.test(sampleData)) {
      return { 
        broker: market, 
        market: market as 'b3' | 'crypto' | 'forex' 
      };
    }
  }
  
  // Detectar por termos específicos nos cabeçalhos
  if (/clear|b3|bovespa|win|wdo|ind|dol/.test(headerStr)) {
    return { broker: 'b3', market: 'b3' };
  }
  
  if (/crypto|bitcoin|ethereum|usdt|binance|okx|bybit/.test(headerStr)) {
    return { broker: 'crypto', market: 'crypto' };
  }
  
  if (/forex|fx|tickmill|meta|mt4|mt5|eur|gbp|usd/.test(headerStr)) {
    return { broker: 'forex', market: 'forex' };
  }
  
  // Default
  return { broker: 'b3', market: 'b3' };
}

/**
 * Verifica se uma linha representa um trade válido
 */
function isValidTradeRow(row: any, index: number): boolean {
  const rowStr = Object.values(row).join(' ').toLowerCase();
  
  // Verificar padrões de exclusão
  for (const pattern of NON_TRADE_PATTERNS) {
    if (pattern.test(rowStr)) {
      console.log(`🚫 Linha ${index} ignorada (padrão): ${rowStr.substring(0, 50)}...`);
      return false;
    }
  }
  
  // Verificar se tem pelo menos um símbolo de trading válido
  const hasValidSymbol = Object.values(TRADING_SYMBOL_PATTERNS).some(pattern => 
    pattern.test(rowStr)
  );
  
  // Verificar se tem dados numéricos (quantidade, preço, resultado)
  const hasNumericData = /\d+[.,]\d+|\d+/.test(rowStr);
  
  // Verificar se tem data
  const hasDate = /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}/.test(rowStr);
  
  const isValid = hasValidSymbol || (hasNumericData && hasDate);
  
  if (!isValid) {
    console.log(`🚫 Linha ${index} ignorada (critérios): ${rowStr.substring(0, 50)}...`);
  }
  
  return isValid;
}

/**
 * Extrai dados de trade de uma linha
 */
function extractTradeFromRow(
  row: any, 
  userId: string, 
  broker: string, 
  market: string,
  lineIndex: number
): InsertTrade | null {
  try {
    // 1. Extrair data
    const date = extractDate(row);
    
    // 2. Extrair símbolo
    const symbol = extractSymbol(row, market);
    
    // 3. Extrair tipo de operação
    const operationType = extractOperationType(row);
    
    // 4. Extrair valores numéricos
    const values = extractNumericValues(row);
    
    if (!symbol || !values.quantity) {
      console.log(`⚠️ Linha ${lineIndex}: Dados insuficientes para trade`);
      return null;
    }
    
    // Garantir que valores não excedam limites do banco (precision 12, scale 2)
    const capitalUtilizado = Math.min(values.quantity * values.entryPrice, 9999999999.99);
    
    const trade: InsertTrade = {
      userId,
      corretora: broker as 'crypto' | 'forex' | 'b3',
      origem: 'csv',
      mercado: market as 'crypto' | 'forex' | 'b3',
      setup: 'CSV Smart Import',
      dataHora: date.toISOString(),
      ativo: symbol.toUpperCase(),
      tipo: operationType,
      quantidade: Math.min(values.quantity, 9999.9999).toFixed(4),
      capitalUtilizado: capitalUtilizado.toFixed(2),
      precoEntrada: Math.min(values.entryPrice, 99999999.9999).toFixed(4),
      precoSaida: values.exitPrice ? Math.min(values.exitPrice, 99999999.9999).toFixed(4) : Math.min(values.entryPrice, 99999999.9999).toFixed(4),
      resultado: Math.max(Math.min(values.result, 9999999999.99), -9999999999.99).toFixed(2),
      stop: values.stopLoss ? Math.min(values.stopLoss, 99999999.9999).toFixed(4) : '0',
      comentario: `Smart CSV Import - Line ${lineIndex + 1} - User: ${userId}`
    };
    
    console.log(`✅ Trade extraído da linha ${lineIndex}: ${symbol} ${operationType} ${values.quantity} = R$ ${values.result}`);
    
    return trade;
    
  } catch (error) {
    console.error(`❌ Erro ao extrair trade da linha ${lineIndex}:`, error);
    return null;
  }
}

/**
 * Extrai data da linha
 */
function extractDate(row: any): Date {
  const datePatterns = [
    /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}/,  // DD/MM/YYYY
    /\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}/,  // YYYY-MM-DD
    /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2}/   // DD/MM/YY
  ];
  
  for (const [key, value] of Object.entries(row)) {
    const valueStr = String(value);
    
    for (const pattern of datePatterns) {
      const match = valueStr.match(pattern);
      if (match) {
        const dateStr = match[0];
        
        // Parse brasileiro: DD/MM/YYYY
        if (/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(dateStr)) {
          const parts = dateStr.split(/[\/\-\.]/);
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          const year = parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2]);
          
          const date = new Date(year, month - 1, day);
          if (!isNaN(date.getTime()) && year >= 2020 && year <= 2030) {
            console.log(`📅 Data extraída: ${dateStr} → ${date.toISOString().split('T')[0]}`);
            return date;
          }
        }
        
        // Parse ISO: YYYY-MM-DD
        if (/\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}/.test(dateStr)) {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            console.log(`📅 Data extraída (ISO): ${dateStr} → ${date.toISOString().split('T')[0]}`);
            return date;
          }
        }
      }
    }
  }
  
  console.log('⚠️ Data não encontrada, usando hoje');
  return new Date();
}

/**
 * Extrai símbolo de trading
 */
function extractSymbol(row: any, market: string): string | null {
  const pattern = TRADING_SYMBOL_PATTERNS[market as keyof typeof TRADING_SYMBOL_PATTERNS];
  
  for (const [key, value] of Object.entries(row)) {
    const valueStr = String(value).toUpperCase();
    
    if (pattern.test(valueStr)) {
      console.log(`🎯 Símbolo encontrado: ${valueStr} (mercado: ${market})`);
      return valueStr;
    }
  }
  
  // Fallback: procurar qualquer padrão de símbolo
  for (const [key, value] of Object.entries(row)) {
    const valueStr = String(value).toUpperCase();
    
    // Símbolos genéricos
    if (/^[A-Z]{3,8}\d*$/.test(valueStr) || /^[A-Z]+[\/\-][A-Z]+$/.test(valueStr)) {
      console.log(`🎯 Símbolo genérico encontrado: ${valueStr}`);
      return valueStr;
    }
  }
  
  return null;
}

/**
 * Extrai tipo de operação
 */
function extractOperationType(row: any): 'compra' | 'venda' {
  for (const [key, value] of Object.entries(row)) {
    const valueStr = String(value);
    
    if (OPERATION_TYPE_PATTERNS.sell.test(valueStr)) {
      return 'venda';
    }
    
    if (OPERATION_TYPE_PATTERNS.buy.test(valueStr)) {
      return 'compra';
    }
  }
  
  // Default para compra
  return 'compra';
}

/**
 * Extrai valores numéricos
 */
function extractNumericValues(row: any): {
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  result: number;
  stopLoss?: number;
} {
  const numbers: number[] = [];
  
  // Extrair todos os números da linha
  for (const [key, value] of Object.entries(row)) {
    const valueStr = String(value);
    
    // Limpar e converter número brasileiro
    const cleanStr = valueStr
      .replace(/[^\d.,\-]/g, '')
      .replace(/\.(?=\d{3})/g, '') // Remove pontos de milhares
      .replace(',', '.'); // Converte vírgula decimal
    
    const num = parseFloat(cleanStr);
    if (!isNaN(num) && isFinite(num) && Math.abs(num) < 10000000000) { // Limitar para evitar overflow no DB
      numbers.push(num);
    }
  }
  
  // Filtrar números válidos para trading
  const validNumbers = numbers.filter(n => Math.abs(n) < 10000000000);
  
  // Ordenar números por magnitude
  validNumbers.sort((a, b) => Math.abs(a) - Math.abs(b));
  
  return {
    quantity: Math.min(validNumbers.find(n => n > 0 && n <= 10000) || 1, 9999), // Quantidade limitada
    entryPrice: Math.min(validNumbers.find(n => n > 10) || 100, 999999), // Preço limitado
    exitPrice: validNumbers.length > 2 ? Math.min(validNumbers[validNumbers.length - 2], 999999) : undefined,
    result: Math.max(Math.min(validNumbers.find(n => n < 0) || validNumbers[validNumbers.length - 1] || 0, 99999999), -99999999), // Resultado limitado
    stopLoss: validNumbers.find(n => n < 0 && Math.abs(n) < 1000) || undefined
  };
}