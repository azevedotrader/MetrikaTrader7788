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
import { interpretStatisticsAsTradesWithCorrectValues } from './smart-statistics-interpreter';

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
 * Interface para representar uma linha validada de trade
 */
interface ValidatedTradeRow {
  dataHora: Date | null;
  ativo: string | null;
  quantidade: number | null;
  precoEntrada: number | null;
  precoSaida: number | null;
  capitalUtilizado: number | null;
  tipo: 'compra' | 'venda' | null;
  resultado: number | null;
}

/**
 * Função temporária para compatibilidade - será substituída por validação por schema
 */
function isStatisticsRow(row: any, fields: string[]): boolean {
  // Substituída por validação por schema
  return false;
}

/**
 * Função temporária para compatibilidade - será substituída por validação por schema
 */
function isValidTradeRow(row: any, index: number): boolean {
  // Substituída por validateTradeRow
  const validation = validateTradeRow(row, index);
  return validation !== null;
}

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
 * Valida uma linha baseada no schema mínimo de trade
 * Retorna os dados extraídos se válido, null se inválido
 */
function validateTradeRow(row: any, index: number): ValidatedTradeRow | null {
  console.log(`\n🔍 Validando linha ${index}:`, Object.values(row));
  
  // Extrair e validar cada campo
  const dataHora = extractAndValidateDate(row);
  const ativo = extractAndValidateSymbol(row);
  const quantidade = extractAndValidateQuantity(row);
  const valores = extractAndValidatePrices(row);
  const tipo = extractOperationType(row);
  
  // Schema mínimo: precisa ter data válida, ativo não vazio, quantidade > 0
  // e pelo menos um valor monetário válido
  const hasValidDate = dataHora !== null;
  const hasValidSymbol = ativo !== null && ativo !== '';
  const hasValidQuantity = quantidade !== null && quantidade > 0;
  const hasValidPrice = valores.precoEntrada !== null || 
                       valores.precoSaida !== null || 
                       valores.capitalUtilizado !== null;
  
  console.log(`  📋 Validação:`);
  console.log(`     Data: ${hasValidDate ? '✅' : '❌'} ${dataHora ? dataHora.toISOString() : 'null'}`);
  console.log(`     Ativo: ${hasValidSymbol ? '✅' : '❌'} ${ativo}`);
  console.log(`     Quantidade: ${hasValidQuantity ? '✅' : '❌'} ${quantidade}`);
  console.log(`     Preços: ${hasValidPrice ? '✅' : '❌'} entrada=${valores.precoEntrada}, saída=${valores.precoSaida}, capital=${valores.capitalUtilizado}`);
  
  const isValid = hasValidDate && hasValidSymbol && hasValidQuantity && hasValidPrice;
  
  if (isValid) {
    console.log(`  ✅ Linha ${index} ACEITA - passa no schema de trade`);
    return {
      dataHora,
      ativo,
      quantidade,
      precoEntrada: valores.precoEntrada,
      precoSaida: valores.precoSaida,
      capitalUtilizado: valores.capitalUtilizado,
      tipo,
      resultado: valores.resultado
    };
  } else {
    console.log(`  ❌ Linha ${index} REJEITADA - não passa no schema mínimo`);
    return null;
  }
}

/**
 * Função principal para processar CSV de forma inteligente
 */
export async function processSmartCSV(
  filePath: string,
  userId: string,
  brokerHint: string = 'auto',
  csvImportId?: string
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

    // 5. VALIDAÇÃO POR SCHEMA COM FALLBACK
    console.log(`\n🔍 INICIANDO VALIDAÇÃO POR SCHEMA (${result.summary.totalRows} linhas)`);
    console.log(`${'='.repeat(60)}`);
    
    // Validar todas as linhas usando o schema
    const validatedRows: { row: any; validation: ValidatedTradeRow; index: number }[] = [];
    const invalidRows: number[] = [];
    
    for (let index = 0; index < parseResult.data.length; index++) {
      const row = parseResult.data[index];
      console.log(`\n  Linha ${index + 1}:`);
      const validation = validateTradeRow(row, index);
      
      if (validation) {
        validatedRows.push({ row, validation, index });
        console.log(`    ✅ ACEITA - Data: ${validation.dataHora?.toISOString()}, Ativo: ${validation.ativo}`);
      } else {
        invalidRows.push(index);
        console.log(`    ❌ DESCARTADA - Não atende aos critérios mínimos`);
      }
    }
    
    const validPercentage = (validatedRows.length / result.summary.totalRows) * 100;
    
    console.log(`\n📊 RESULTADO DA VALIDAÇÃO:`);
    console.log(`   ✅ Linhas ACEITAS: ${validatedRows.length} (${validPercentage.toFixed(1)}%)`);
    console.log(`   ❌ Linhas DESCARTADAS: ${invalidRows.length} (${(100 - validPercentage).toFixed(1)}%)`);
    console.log(`${'='.repeat(60)}\n`);
    
    let rowsToProcess: any[] = [];
    let dates: Date[] = [];
    
    // DECISÃO SOBRE QUAL MÉTODO USAR
    if (validPercentage === 100) {
      // 100% passaram - usar apenas schema
      console.log(`✅ MODO SCHEMA PURO: 100% das linhas passaram, usando apenas validação por schema`);
      
      // Processar linhas validadas
      for (const { row, validation, index } of validatedRows) {
        const trade = extractTradeFromRow(
          row, 
          userId, 
          detectedInfo.broker, 
          detectedInfo.market,
          index,
          csvImportId
        );
        
        if (trade) {
          result.trades.push(trade);
          result.summary.tradesFound++;
          const tradeDate = new Date(trade.dataHora);
          if (!isNaN(tradeDate.getTime())) {
            dates.push(tradeDate);
          }
        }
      }
      
    } else if (validPercentage > 0 && validPercentage < 100) {
      // Apenas algumas passaram - usar filtro textual antigo
      console.log(`⚠️ MODO HÍBRIDO: Apenas ${validPercentage.toFixed(1)}% passaram, voltando para filtro textual`);
      console.log(`🔄 Aplicando filtros textuais antigos...`);
      
      // Aplicar filtros textuais antigos
      for (let index = 0; index < parseResult.data.length; index++) {
        const row = parseResult.data[index];
        const rowStr = Object.values(row).join(' ').toLowerCase();
        
        // Filtros textuais antigos
        const skipPatterns = [
          /patrimônio|capital|saldo|drawdown|retorno|percentual/i,
          /rentabilidade|lucro líquido|prejuízo|melhor trade|pior trade/i,
          /win rate|lose rate|expectativa|payoff|profit factor/i,
          /total geral|resultado líquido|performance|desempenho/i,
          /^resumo|^summary|^estatística|^statistics/i,
          /conta|titular|saldo líquido total/i
        ];
        
        let shouldSkip = false;
        for (const pattern of skipPatterns) {
          if (pattern.test(rowStr)) {
            console.log(`    🚫 Linha ${index + 1} filtrada por padrão textual: ${pattern}`);
            shouldSkip = true;
            result.summary.statisticsSkipped++;
            break;
          }
        }
        
        if (!shouldSkip) {
          try {
            const trade = extractTradeFromRow(
              row, 
              userId, 
              detectedInfo.broker, 
              detectedInfo.market,
              index,
              csvImportId
            );
            
            if (trade) {
              result.trades.push(trade);
              result.summary.tradesFound++;
              const tradeDate = new Date(trade.dataHora);
              if (!isNaN(tradeDate.getTime())) {
                dates.push(tradeDate);
              }
            }
          } catch (error: any) {
            console.error(`❌ Erro na linha ${index + 1}:`, error);
            result.errors.push(`Linha ${index + 1}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          }
        }
      }
      
      console.log(`📋 Após filtros textuais: ${result.trades.length} trades extraídos`);
      
    } else {
      // 0% passaram - tentar interpretador alternativo
      console.log(`⚠️ AVISO: Nenhuma linha passou na validação por schema`);
      console.log(`🧪 Tentando modo de interpretação alternativo...`);
      
      // Se nenhuma linha passou, tentar interpretador de estatísticas
      const statisticsTrades = interpretStatisticsAsTradesWithCorrectValues(
        parseResult.data,
        userId,
        brokerHint
      );
      
      if (statisticsTrades.length > 0) {
        result.trades = statisticsTrades;
        result.summary.tradesFound = statisticsTrades.length;
        result.summary.statisticsSkipped = parseResult.data.length;
        result.errors.push('ℹ️ Arquivo interpretado como estatísticas/relatório');
        
        // Calcular range de datas
        dates = statisticsTrades.map(t => new Date(t.dataHora));
      } else {
        result.errors.push('⚠️ Interpretador de estatísticas não conseguiu extrair dados válidos');
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
 * Extrai e valida data da linha
 */
function extractAndValidateDate(row: any): Date | null {
  const datePatterns = [
    // DD/MM/YYYY HH:MM:SS ou DD/MM/YYYY HH:MM
    {
      pattern: /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/,
      format: 'DD/MM/YYYY HH:MM:SS',
      parse: (match: RegExpMatchArray) => {
        const [_, day, month, year, hour, minute, second] = match;
        return new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hour),
          parseInt(minute),
          parseInt(second || '0')
        );
      }
    },
    // DD/MM/YYYY
    {
      pattern: /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})(?!\s*\d)/,
      format: 'DD/MM/YYYY',
      parse: (match: RegExpMatchArray) => {
        const [_, day, month, year] = match;
        return new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          12, 0, 0
        );
      }
    },
    // YYYY-MM-DD HH:MM:SS ou YYYY-MM-DD
    {
      pattern: /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
      format: 'YYYY-MM-DD [HH:MM:SS]',
      parse: (match: RegExpMatchArray) => {
        const [_, year, month, day, hour, minute, second] = match;
        return new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          hour ? parseInt(hour) : 12,
          minute ? parseInt(minute) : 0,
          second ? parseInt(second) : 0
        );
      }
    },
    // DD/MM/YY
    {
      pattern: /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})(?!\d)/,
      format: 'DD/MM/YY',
      parse: (match: RegExpMatchArray) => {
        const [_, day, month, year] = match;
        return new Date(
          2000 + parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          12, 0, 0
        );
      }
    }
  ];
  
  for (const [key, value] of Object.entries(row)) {
    if (!value) continue;
    const valueStr = String(value).trim();
    
    for (const { pattern, format, parse } of datePatterns) {
      const match = valueStr.match(pattern);
      if (match) {
        try {
          const date = parse(match);
          
          if (date && !isNaN(date.getTime())) {
            const year = date.getFullYear();
            if (year >= 2010 && year <= 2030) {
              console.log(`    📅 Data: "${valueStr}" → formato: ${format} → ${date.toISOString()}`);
              return date;
            } else {
              console.log(`    📅 Data: "${valueStr}" → formato: ${format} → ano ${year} fora do range (2010-2030)`);
            }
          } else {
            console.log(`    📅 Data: "${valueStr}" → formato: ${format} → data inválida`);
          }
        } catch (e) {
          console.log(`    📅 Data: "${valueStr}" → formato: ${format} → erro no parse: ${e}`);
        }
      }
    }
  }
  
  console.log(`    📅 Data: nenhuma data válida encontrada na linha`);
  return null;
}

/**
 * Extrai e valida símbolo do ativo
 */
function extractAndValidateSymbol(row: any): string | null {
  // Primeiro tenta encontrar símbolos conhecidos
  for (const [key, value] of Object.entries(row)) {
    if (!value) continue;
    const original = String(value);
    const valueStr = original.toUpperCase().trim();
    
    // Procurar padrões de símbolos conhecidos
    for (const [market, pattern] of Object.entries(TRADING_SYMBOL_PATTERNS)) {
      if (pattern.test(valueStr)) {
        // Extrair apenas o símbolo, não a linha toda
        const match = valueStr.match(pattern);
        if (match) {
          console.log(`    🎯 Ativo: "${original}" → mercado: ${market} → símbolo: ${match[0]}`);
          return match[0];
        }
      }
    }
  }
  
  // Procurar por padrões genéricos de símbolos
  for (const [key, value] of Object.entries(row)) {
    if (!value) continue;
    const original = String(value);
    const valueStr = original.trim();
    
    // Padrões genéricos de símbolos
    const genericPatterns = [
      { pattern: /^[A-Z]{2,8}\d*$/i, name: 'alfanumérico' },
      { pattern: /^[A-Z]{3,6}[0-9]{1,4}$/i, name: 'ticker+números' },
      { pattern: /^[A-Z]+[\/\-][A-Z]+$/i, name: 'par de moedas' }
    ];
    
    for (const { pattern, name } of genericPatterns) {
      const match = valueStr.match(pattern);
      if (match) {
        console.log(`    🎯 Ativo: "${original}" → padrão: ${name} → símbolo: ${match[0].toUpperCase()}`);
        return match[0].toUpperCase();
      }
    }
  }
  
  console.log(`    🎯 Ativo: nenhum símbolo válido encontrado`);
  return null;
}

/**
 * Extrai e valida quantidade
 */
function extractAndValidateQuantity(row: any): number | null {
  console.log(`    📦 Buscando quantidade...`);
  
  for (const [key, value] of Object.entries(row)) {
    if (!value) continue;
    
    // Procurar por campos que possam ser quantidade
    const keyLower = key.toLowerCase();
    if (keyLower.includes('quant') || keyLower.includes('qtd') || keyLower.includes('volume')) {
      console.log(`      Campo candidato: ${key} = "${value}"`);
      const num = parseNumericValue(String(value));
      if (num !== null && num > 0 && num <= 999999) {
        console.log(`    📦 Quantidade: campo "${key}" = ${num}`);
        return num;
      }
    }
  }
  
  // Se não encontrou por nome de campo, procurar números pequenos que possam ser quantidade
  const numbers = extractAllNumbers(row);
  const quantities = numbers.filter(n => n > 0 && n <= 10000);
  
  if (quantities.length > 0) {
    console.log(`    📦 Quantidade: heurística (número pequeno) = ${quantities[0]}`);
    return quantities[0];
  }
  
  console.log(`    📦 Quantidade: não encontrada`);
  return null;
}

/**
 * Extrai e valida preços
 */
function extractAndValidatePrices(row: any): {
  precoEntrada: number | null;
  precoSaida: number | null;
  capitalUtilizado: number | null;
  resultado: number | null;
} {
  console.log(`    💰 Buscando preços e valores...`);
  
  const result = {
    precoEntrada: null as number | null,
    precoSaida: null as number | null,
    capitalUtilizado: null as number | null,
    resultado: null as number | null
  };
  
  // Extrair todos os números da linha
  const numbers = extractAllNumbers(row);
  console.log(`      Números encontrados: [${numbers.join(', ')}]`);
  
  // Procurar por campos específicos
  for (const [key, value] of Object.entries(row)) {
    if (!value) continue;
    const keyLower = key.toLowerCase();
    const num = parseNumericValue(String(value));
    
    if (num !== null) {
      if (keyLower.includes('entrada') || keyLower.includes('entry') || (keyLower.includes('preço') && !keyLower.includes('saida'))) {
        result.precoEntrada = num;
        console.log(`      Preço Entrada: campo "${key}" = ${num}`);
      } else if (keyLower.includes('saida') || keyLower.includes('exit') || keyLower.includes('saída')) {
        result.precoSaida = num;
        console.log(`      Preço Saída: campo "${key}" = ${num}`);
      } else if (keyLower.includes('capital') || keyLower.includes('volume') || keyLower.includes('financeiro')) {
        result.capitalUtilizado = num;
        console.log(`      Capital: campo "${key}" = ${num}`);
      } else if (keyLower.includes('resultado') || keyLower.includes('profit') || keyLower.includes('lucro') || keyLower.includes('prejuízo')) {
        result.resultado = num;
        console.log(`      Resultado: campo "${key}" = ${num}`);
      }
    }
  }
  
  // Se não encontrou campos específicos, usar heurística
  if (!result.precoEntrada && !result.precoSaida && !result.capitalUtilizado) {
    const validNumbers = numbers.filter(n => Math.abs(n) > 0.01 && Math.abs(n) < 10000000);
    if (validNumbers.length > 0) {
      // Assumir que números maiores são preços ou capital
      const sorted = validNumbers.sort((a, b) => Math.abs(b) - Math.abs(a));
      if (sorted.length > 0) {
        result.capitalUtilizado = sorted[0];
        console.log(`      Capital: heurística (maior número) = ${sorted[0]}`);
      }
      if (sorted.length > 1) {
        result.precoEntrada = sorted[1];
        console.log(`      Preço Entrada: heurística (segundo maior) = ${sorted[1]}`);
      }
      if (sorted.length > 2) {
        result.precoSaida = sorted[2];
        console.log(`      Preço Saída: heurística (terceiro maior) = ${sorted[2]}`);
      }
    }
  }
  
  // Resultado é frequentemente o último número ou um número negativo/positivo pequeno
  if (result.resultado === null && numbers.length > 0) {
    const possibleResults = numbers.filter(n => Math.abs(n) < 100000);
    if (possibleResults.length > 0) {
      result.resultado = possibleResults[possibleResults.length - 1];
      console.log(`      Resultado: heurística (último número pequeno) = ${result.resultado}`);
    }
  }
  
  console.log(`    💰 Preços finais: entrada=${result.precoEntrada}, saída=${result.precoSaida}, capital=${result.capitalUtilizado}, resultado=${result.resultado}`);
  
  return result;
}

/**
 * Converte string para número, lidando com formato brasileiro
 */
function parseNumericValue(str: string): number | null {
  if (!str) return null;
  
  const original = str;
  
  // Limpar string inicial
  let cleaned = str.trim()
    .replace(/[R$\s]/gi, '') // Remove R$, espaços
    .replace(/[^\d.,\-+]/g, ''); // Mantém apenas números, vírgula, ponto, sinal
  
  if (!cleaned) {
    console.log(`    📊 Número: "${original}" → vazio → null`);
    return null;
  }
  
  // Detectar formato: brasileiro (1.234,56) ou americano (1,234.56)
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  
  let normalized = cleaned;
  let detectedFormat = 'desconhecido';
  
  if (lastComma > lastDot) {
    // Formato brasileiro: ponto para milhares, vírgula para decimal
    // Ex: 1.234,56 → 1234.56
    detectedFormat = 'brasileiro';
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    // Formato americano: vírgula para milhares, ponto para decimal  
    // Ex: 1,234.56 → 1234.56
    detectedFormat = 'americano';
    normalized = cleaned.replace(/,/g, '');
  } else if (lastComma === -1 && lastDot > 0) {
    // Apenas ponto, verificar se é decimal ou milhares
    const afterDot = cleaned.substring(lastDot + 1);
    if (afterDot.length === 3) {
      // Provavelmente separador de milhares
      // Ex: 1.234 → 1234
      detectedFormat = 'milhares (ponto)';
      normalized = cleaned.replace(/\./g, '');
    } else {
      // É decimal
      // Ex: 123.45 → 123.45
      detectedFormat = 'decimal (ponto)';
      normalized = cleaned;
    }
  } else if (lastDot === -1 && lastComma > 0) {
    // Apenas vírgula, verificar se é decimal ou milhares
    const afterComma = cleaned.substring(lastComma + 1);
    if (afterComma.length === 3) {
      // Provavelmente separador de milhares
      // Ex: 1,234 → 1234
      detectedFormat = 'milhares (vírgula)';
      normalized = cleaned.replace(/,/g, '');
    } else {
      // É decimal
      // Ex: 123,45 → 123.45
      detectedFormat = 'decimal (vírgula)';
      normalized = cleaned.replace(',', '.');
    }
  } else {
    // Número simples sem separadores
    detectedFormat = 'simples';
    normalized = cleaned;
  }
  
  const num = parseFloat(normalized);
  const result = isNaN(num) || !isFinite(num) ? null : num;
  
  console.log(`    📊 Número: "${original}" → limpo: "${cleaned}" → formato: ${detectedFormat} → normalizado: "${normalized}" → final: ${result}`);
  
  return result;
}

/**
 * Extrai todos os números de uma linha
 */
function extractAllNumbers(row: any): number[] {
  const numbers: number[] = [];
  
  for (const [key, value] of Object.entries(row)) {
    if (!value) continue;
    const num = parseNumericValue(String(value));
    if (num !== null && isFinite(num)) {
      numbers.push(num);
    }
  }
  
  return numbers;
}

/**
 * Extrai dados de trade de uma linha
 */
function extractTradeFromRow(
  row: any, 
  userId: string, 
  broker: string, 
  market: string,
  lineIndex: number,
  csvImportId?: string
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
      csvImportId,
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