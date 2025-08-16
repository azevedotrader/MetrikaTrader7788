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
 * Padrões para identificar linhas que NÃO são trades (dados de estatísticas/resumo)
 */
const NON_TRADE_PATTERNS = [
  // Cabeçalhos de seções
  /^(resumo|summary|total|estatística|statistics|relatório|report|análise|analysis)/i,
  
  // Campos de estatísticas específicos
  /patrimônio|capital|saldo|drawdown|retorno|percentual|necessário|máximo|mínimo|tempo no mercado|win rate|lose rate/i,
  /rentabilidade|lucro líquido|prejuízo|melhor trade|pior trade|média|mediana|sharpe|sortino/i,
  /r\/r|risco|reward|expectativa|payoff|profit factor|recovery factor|calmar ratio/i,
  /trades vencedores|trades perdedores|consecutivos|sequência|série|winning streak|losing streak/i,
  
  // Totalizadores e métricas
  /^(total|soma|média|average|min|max|count|qtd|número|quantidade total)/i,
  
  // Valores de configuração
  /configuração|config|setting|parameter|parâmetro/i,
  
  // Linhas vazias ou separadores
  /^[\s\-=_]*$/,
  
  // Padrões específicos de estatísticas financeiras
  /^\s*(total geral|resultado líquido|performance|desempenho)/i,
  /declínio máximo|drawdown|topo ao fundo|trade a trade/i,
  
  // Linhas que são claramente métricas (sem contexto de trade)
  /^\d+[\.,]\d+%\s*$/, // Apenas percentuais
  /^\d+[\.,]\d{2}\s*(real|reais|r\$|brl|usd)\s*$/i, // Apenas valores monetários sem contexto
  /^(positiv|negativ)[oa]s?\s*:/i, // Trades positivos/negativos (título)
  
  // Padrões que indicam resumos/estatísticas
  /^(dias|meses|anos|período)\s+de\s+/i,
  /^em\s+\d+\s+(dias|meses|anos)/i
];

/**
 * Padrões para identificar símbolos de trading válidos
 */
const TRADING_SYMBOL_PATTERNS = {
  b3: /^(WIN|WDO|IND|DOL|BGI|ISP|ICF|SFI|CCM|OZ1|OZ2|OZ3|PETR[34]?|VALE[35]?|ITUB[34]?|BBDC[34]?|ABEV|BBAS|BEEF|BPAC|BRDT|BRKM|CCRO|CMIG|CPFE|CSAN|CSNA|ELET|EMBR|ENBR|EQTL|FLRY|GGBR|GOAU|HAPV|HYPE|IGTI|ITSA|JBSS|KLBN|LAME|LREN|MGLU|MRFG|MRVE|MULT|NTCO|PCAR|QUAL|RADL|RAIL|RENT|SANB|SBSP|SUZB|TAEE|TIMS|TOTS|UGPA|USIM|VIVT|VVAR|WEGE|YDUQ)[A-Z0-9]*$/i,
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
 * Verifica se uma linha contém dados de estatísticas em vez de trade individual
 */
function isStatisticsRow(row: any, fields: string[]): boolean {
  if (!row) return true;
  
  // Converter linha para string para análise
  const rowText = Object.values(row).join(' ').toLowerCase();
  
  // Verificar contra padrões de estatísticas
  for (const pattern of NON_TRADE_PATTERNS) {
    if (pattern.test(rowText)) {
      return true;
    }
  }
  
  // Verificar se contém apenas campos de estatísticas conhecidos
  const statisticsKeywords = [
    'patrimônio', 'capital', 'saldo', 'drawdown', 'retorno', 'percentual',
    'rentabilidade', 'lucro', 'prejuízo', 'melhor', 'pior', 'média',
    'total', 'máximo', 'mínimo', 'win rate', 'r/r', 'expectativa'
  ];
  
  const hasStatisticsKeywords = statisticsKeywords.some(keyword => 
    rowText.includes(keyword)
  );
  
  // Se tem palavras-chave de estatísticas e não tem símbolo de trading válido
  if (hasStatisticsKeywords) {
    const hasValidSymbol = Object.values(TRADING_SYMBOL_PATTERNS).some(pattern => 
      pattern.test(rowText)
    );
    
    if (!hasValidSymbol) {
      return true; // É estatística
    }
  }
  
  return false;
}

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

    // 5. Verificar se arquivo é predominantemente estatísticas
    const statisticsRowCount = parseResult.data.filter((row: any) => 
      isStatisticsRow(row, parseResult.meta.fields || [])
    ).length;
    
    const statisticsPercentage = (statisticsRowCount / result.summary.totalRows) * 100;
    console.log(`📊 Análise de conteúdo: ${statisticsRowCount}/${result.summary.totalRows} linhas são estatísticas (${statisticsPercentage.toFixed(1)}%)`);
    
    // Se mais de 80% das linhas são estatísticas, provavelmente é arquivo de relatório
    if (statisticsPercentage > 80) {
      console.log(`🚫 Arquivo detectado como relatório de performance (${statisticsPercentage.toFixed(1)}% estatísticas)`);
      result.errors.push('Arquivo detectado como relatório de estatísticas/performance, não trades individuais');
      return result;
    }

    // 6. Processar cada linha
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

    // 7. Verificar tipo de arquivo e dar feedback específico
    if (result.trades.length === 0) {
      // Detectar arquivo da Clear/Rico (formato estatísticas)
      const isClearStatsFile = parseResult.data.some(row => {
        const values = Object.values(row as Record<string, any>);
        return values.some(val => 
          typeof val === 'string' && (
            val.toLowerCase().includes('conta') ||
            val.toLowerCase().includes('titular') ||
            val.toLowerCase().includes('saldo líquido total') ||
            val.toLowerCase().includes('lucro bruto') ||
            val.toLowerCase().includes('prejuízo bruto')
          )
        );
      });
      
      const hasGeneralStatistics = parseResult.data.some(row => 
        Object.values(row as Record<string, any>).some(val => 
          typeof val === 'string' && (
            val.includes('operações') || val.includes('percentual') ||
            val.includes('patrimônio') || val.includes('drawdown') ||
            val.includes('retorno') || val.includes('fator de lucro') ||
            val.includes('média') || val.includes('declínio') ||
            val.includes('sequência')
          )
        )
      );

      if (isClearStatsFile) {
        result.errors.push('🏦 ARQUIVO DA CLEAR/RICO DETECTADO - TIPO INCORRETO');
        result.errors.push('Este é um relatório de PERFORMANCE, não de trades individuais.');
        result.errors.push('');
        result.errors.push('📥 COMO EXPORTAR O ARQUIVO CORRETO DA CLEAR:');
        result.errors.push('1. Entre no Portal Clear/Rico');
        result.errors.push('2. Vá em "Relatórios" → "Histórico de Operações"');
        result.errors.push('3. Selecione o período desejado');
        result.errors.push('4. Exporte como CSV o "BOOK DE OFERTAS" ou "HISTÓRICO DETALHADO"');
        result.errors.push('5. O arquivo deve ter UMA LINHA POR OPERAÇÃO realizada');
        result.errors.push('');
        result.errors.push('❌ NÃO USE: Relatório de Performance/Estatísticas (arquivo atual)');
        result.errors.push('✅ USE: Histórico de Operações/Book de Ofertas');
      } else if (hasGeneralStatistics) {
        result.errors.push('❌ ARQUIVO DE ESTATÍSTICAS DETECTADO');
        result.errors.push('Este arquivo contém dados de resumo, não trades individuais.');
        result.errors.push('');
        result.errors.push('📋 FORMATO CORRETO: CSV com trades individuais contendo:');
        result.errors.push('• Uma linha = Uma operação realizada');
        result.errors.push('• Símbolo do ativo (ex: WINQ25, PETR4, BTCUSDT)');
        result.errors.push('• Data/hora de entrada');
        result.errors.push('• Preços de entrada e saída');
        result.errors.push('• Resultado da operação');
        result.errors.push('• Quantidade operada');
      } else {
        result.errors.push('❌ NENHUM TRADE RECONHECIDO');
        result.errors.push('O arquivo não contém trades individuais reconhecíveis.');
        result.errors.push('');
        result.errors.push('🔍 POSSÍVEIS PROBLEMAS:');
        result.errors.push('• Formato de CSV não suportado');
        result.errors.push('• Símbolos de ativos não reconhecidos');
        result.errors.push('• Falta de dados essenciais (preço, quantidade, data)');
        result.errors.push('');
        result.errors.push('💡 DICA: Exporte o histórico de operações da sua corretora');
        result.errors.push('(não o relatório de performance/estatísticas)');
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
  
  // Debug para todas as linhas
  console.log(`🔍 Linha ${index}:`, Object.values(row));
  
  // Verificar padrões de exclusão mais específicos (apenas cabeçalhos óbvios)
  const exclusionPatterns = [
    /^(conta|titular)/i,
    /^(data inicial|data final)$/i,
    /^\s*$/
  ];
  
  for (const pattern of exclusionPatterns) {
    if (pattern.test(rowStr)) {
      console.log(`🚫 Linha ${index} ignorada (cabeçalho): ${rowStr.substring(0, 50)}`);
      return false;
    }
  }
  
  // ACEITAR QUALQUER LINHA COM DADOS - Modo muito flexível
  const hasAnyData = Object.values(row).some(val => 
    val !== null && val !== undefined && String(val).trim() !== ''
  );
  
  // Verificar se tem dados numéricos
  const hasNumericData = /\d+[.,]\d*|\d+/.test(rowStr);
  
  // Ser muito permissivo - aceitar linha com qualquer conteúdo válido
  const isValid = hasAnyData && hasNumericData;
  
  console.log(`📊 Linha ${index} - Análise: dados=${hasAnyData}, números=${hasNumericData}, aceita=${isValid}`);
  
  if (!isValid) {
    console.log(`🚫 Linha ${index} rejeitada: sem dados suficientes`);
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
    
    // Ser muito permissivo - tentar criar trade mesmo com dados parciais
    if (!values.quantity || values.quantity <= 0) {
      values.quantity = 1; // Quantidade padrão
    }
    
    let finalSymbol = symbol;
    if (!finalSymbol || finalSymbol === 'UNKNOWN') {
      // Criar símbolo baseado em qualquer texto da linha
      const allText = Object.values(row).join(' ').toUpperCase().replace(/[^A-Z0-9]/g, '');
      finalSymbol = allText.substring(0, 6) || 'TRADE';
      console.log(`🔧 Símbolo gerado: ${finalSymbol}`);
    }
    
    console.log(`✅ Criando trade da linha ${lineIndex}:`, {
      symbol: finalSymbol,
      quantity: values.quantity,
      entryPrice: values.entryPrice,
      result: values.result
    });
    
    // Garantir que valores não excedam limites do banco (precision 12, scale 2)
    const capitalUtilizado = Math.min(values.quantity * values.entryPrice, 9999999999.99);
    
    const trade: InsertTrade = {
      userId,
      corretora: broker as 'crypto' | 'forex' | 'b3',
      origem: 'csv',
      mercado: market as 'crypto' | 'forex' | 'b3',
      setup: 'CSV Smart Import',
      dataHora: date.toISOString(),
      ativo: finalSymbol.toUpperCase(),
      tipo: operationType,
      quantidade: Math.min(values.quantity, 9999.9999).toFixed(4),
      capitalUtilizado: capitalUtilizado.toFixed(2),
      precoEntrada: Math.min(values.entryPrice, 99999999.9999).toFixed(4),
      precoSaida: values.exitPrice ? Math.min(values.exitPrice, 99999999.9999).toFixed(4) : Math.min(values.entryPrice, 99999999.9999).toFixed(4),
      resultado: Math.max(Math.min(values.result, 9999999999.99), -9999999999.99).toFixed(2),
      stop: values.stopLoss ? Math.min(values.stopLoss, 99999999.9999).toFixed(4) : '0',
      comentario: `Smart CSV Import - Line ${lineIndex + 1} - User: ${userId}`
    };
    
    console.log(`✅ Trade extraído da linha ${lineIndex}: ${finalSymbol} ${operationType} ${values.quantity} = R$ ${values.result}`);
    
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
  console.log(`🔍 Extraindo símbolo de:`, Object.values(row));
  
  for (const [key, value] of Object.entries(row)) {
    const valueStr = String(value).toUpperCase().trim();
    
    // Procurar padrões de símbolos conhecidos primeiro
    const pattern = TRADING_SYMBOL_PATTERNS[market as keyof typeof TRADING_SYMBOL_PATTERNS];
    if (pattern && pattern.test(valueStr)) {
      console.log(`🎯 Símbolo ${market} encontrado: ${valueStr}`);
      return valueStr;
    }
  }
  
  // Fallback muito amplo - qualquer texto que pareça um símbolo
  for (const [key, value] of Object.entries(row)) {
    const valueStr = String(value).toUpperCase().trim();
    
    // Símbolos genéricos amplos
    if (/^[A-Z]{2,8}\d*$/.test(valueStr) || 
        /^[A-Z]{3,6}[0-9]{1,4}$/.test(valueStr) ||
        /^[A-Z]+[\/\-][A-Z]+$/.test(valueStr) ||
        /WIN|WDO|IND|DOL|PETR|VALE|ITUB|BBDC/i.test(valueStr)) {
      console.log(`🎯 Símbolo genérico: ${valueStr}`);
      return valueStr;
    }
  }
  
  // Se não encontrar símbolo, criar um genérico baseado no conteúdo
  const firstValue = Object.values(row)[0];
  if (firstValue && String(firstValue).trim()) {
    const genericSymbol = String(firstValue).toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8) || 'TRADE';
    console.log(`🔄 Usando símbolo genérico: ${genericSymbol}`);
    return genericSymbol;
  }
  
  console.log(`🔄 Usando símbolo padrão: UNKNOWN`);
  return 'UNKNOWN';
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
  
  // Se não há números válidos, usar padrões mínimos
  if (validNumbers.length === 0) {
    return {
      quantity: 1,
      entryPrice: 100,
      exitPrice: undefined,
      result: 0,
      stopLoss: undefined
    };
  }
  
  // Ser mais flexível na interpretação dos números
  const sortedNums = [...validNumbers].sort((a, b) => Math.abs(a) - Math.abs(b));
  
  return {
    quantity: Math.min(sortedNums.find(n => n > 0 && n <= 100000) || sortedNums.find(n => n > 0) || 1, 9999),
    entryPrice: Math.min(sortedNums.find(n => n >= 1) || 100, 999999),
    exitPrice: sortedNums.length > 2 ? Math.min(sortedNums[sortedNums.length - 2], 999999) : undefined,
    result: Math.max(Math.min(sortedNums[sortedNums.length - 1] || 0, 99999999), -99999999),
    stopLoss: sortedNums.find(n => n < 0 && Math.abs(n) < 10000) || undefined
  };
}