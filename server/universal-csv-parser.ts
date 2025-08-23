/**
 * Sistema Universal de Parsing CSV - Robusto e Flexível
 * ===================================================
 * 
 * Detecta automaticamente:
 * - Encoding (UTF-8, ISO-8859-1, Windows-1252, etc.)
 * - Delimitador (vírgula, ponto e vírgula, tab, pipe)
 * - Aspas e escape characters
 * - Formato de números (brasileiro 1.234,56 vs internacional 1234.56)
 * - Linhas de cabeçalho extras
 * - Estrutura de dados e colunas relevantes
 */

import fs from 'fs';
import Papa from 'papaparse';
import chardet from 'chardet';
import iconv from 'iconv-lite';
import { validateDateColumn, DateValidationResult } from './date-validator';

export interface ParsedCSVResult {
  data: any[];
  headers: string[];
  totalRows: number;
  skippedRows: number;
  detectedDelimiter: string;
  detectedEncoding: string;
  detectedQuoteChar: string;
  numberFormat: 'brazilian' | 'international';
  dateValidation: DateValidationResult;
  keyColumns: {
    resultado?: string;      // "Res. Operação" ou similar
    total?: string;          // "Total" (saldo acumulado)
    ativo?: string;          // Nome do ativo
    data?: string;           // Data da operação
    tipo?: string;           // Compra/Venda
    quantidade?: string;     // Quantidade
    preco?: string;          // Preço
  };
  errors: string[];
}

/**
 * Delimitadores possíveis em ordem de prioridade
 */
const POSSIBLE_DELIMITERS = [';', ',', '\t', '|', ':'];

/**
 * Possíveis caracteres de aspas
 */
const POSSIBLE_QUOTES = ['"', "'", '`'];

/**
 * Detecta automaticamente o encoding do arquivo
 */
function detectFileEncoding(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  const detected = chardet.detect(buffer);
  
  // Mapear detecções comuns para encodings suportados
  const encodingMap: { [key: string]: string } = {
    'UTF-8': 'utf8',
    'ISO-8859-1': 'latin1',
    'windows-1252': 'win1252',
    'windows-1251': 'win1251',
    'ASCII': 'ascii'
  };
  
  if (detected && encodingMap[detected]) {
    console.log(`🔍 Encoding detectado: ${detected} -> ${encodingMap[detected]}`);
    return encodingMap[detected];
  }
  
  // Fallback para UTF-8
  console.log(`⚠️ Encoding não reconhecido (${detected}), usando UTF-8 como fallback`);
  return 'utf8';
}

/**
 * Lê o arquivo com encoding detectado
 */
function readFileWithEncoding(filePath: string): string {
  const detectedEncoding = detectFileEncoding(filePath);
  const buffer = fs.readFileSync(filePath);
  
  try {
    if (detectedEncoding === 'utf8') {
      return buffer.toString('utf8');
    } else {
      return iconv.decode(buffer, detectedEncoding as any);
    }
  } catch (error) {
    console.warn(`⚠️ Erro ao decodificar com ${detectedEncoding}, tentando UTF-8`);
    return buffer.toString('utf8');
  }
}

/**
 * Detecta automaticamente o delimitador mais provável
 */
function detectDelimiter(content: string): { delimiter: string; confidence: number } {
  const lines = content.split('\n').slice(0, 20).filter(line => line.trim()); // Mais linhas para análise
  const results: { delimiter: string; count: number; consistency: number }[] = [];
  
  // Detectar padrões específicos B3 primeiro
  const sampleContent = lines.join('\n');
  if (sampleContent.includes('WIN') || sampleContent.includes('WDO') || sampleContent.includes('BGI')) {
    // Arquivo B3 - testar delimitadores em ordem de probabilidade
    for (const delimiter of [';', ',', '\t', '|']) {
      if (sampleContent.includes(delimiter)) {
        console.log(`🎯 Arquivo B3 detectado, testando delimitador: "${delimiter}"`);
        return { delimiter, confidence: 0.9 };
      }
    }
  }
  
  for (const delimiter of POSSIBLE_DELIMITERS) {
    let fieldCounts: number[] = [];
    
    for (const line of lines) {
      if (line.trim() && !line.toLowerCase().includes('conta:') && !line.toLowerCase().includes('titular:')) {
        const fields = line.split(delimiter);
        // Só considerar se realmente criou múltiplos campos
        if (fields.length > 1) {
          fieldCounts.push(fields.length);
        }
      }
    }
    
    if (fieldCounts.length > 0) {
      // Calcular consistência (variância baixa = boa consistência)
      const avg = fieldCounts.reduce((a, b) => a + b, 0) / fieldCounts.length;
      const variance = fieldCounts.reduce((acc, count) => acc + Math.pow(count - avg, 2), 0) / fieldCounts.length;
      const consistency = variance === 0 ? 1 : (1 / (1 + variance)); // Inverso da variância
      
      results.push({
        delimiter,
        count: avg,
        consistency
      });
    }
  }
  
  // Se não encontrou nenhum bom resultado, forçar vírgula como fallback
  if (results.length === 0) {
    console.warn(`⚠️ Nenhum delimitador detectado claramente, usando vírgula como fallback`);
    return { delimiter: ',', confidence: 0.3 };
  }
  
  // Ordenar por consistência e número de campos
  results.sort((a, b) => {
    // Priorizar delimitadores que criam mais campos
    const scoreA = a.consistency * a.count;
    const scoreB = b.consistency * b.count;
    return scoreB - scoreA;
  });
  
  const best = results[0];
  let confidence = best ? best.consistency * (best.count > 1 ? 1 : 0.5) : 0;
  
  // Bonus para delimitadores mais comuns
  if (best?.delimiter === ';' || best?.delimiter === ',') {
    confidence = Math.min(confidence * 1.2, 1);
  }
  
  console.log(`🔍 Delimitadores testados:`, results);
  console.log(`✅ Melhor delimitador: "${best?.delimiter || ','}" (confiança: ${(confidence * 100).toFixed(1)}%)`);
  
  return {
    delimiter: best?.delimiter || ',',
    confidence
  };
}

/**
 * Detecta o formato de números (brasileiro vs internacional)
 */
function detectNumberFormat(data: any[]): 'brazilian' | 'international' {
  let brazilianCount = 0;
  let internationalCount = 0;
  
  for (const row of data.slice(0, 20)) { // Analisar primeiras 20 linhas
    for (const value of Object.values(row)) {
      const str = String(value);
      
      // Padrão brasileiro: 1.234,56 ou -1.234,56
      if (/^-?\d{1,3}(\.\d{3})*,\d{2}$/.test(str)) {
        brazilianCount++;
      }
      // Padrão internacional: 1234.56 ou -1234.56
      else if (/^-?\d+\.\d{2}$/.test(str) && !str.includes(',')) {
        internationalCount++;
      }
    }
  }
  
  const format = brazilianCount > internationalCount ? 'brazilian' : 'international';
  console.log(`🔢 Formato detectado: ${format} (BR: ${brazilianCount}, INT: ${internationalCount})`);
  return format;
}

/**
 * Normaliza número brasileiro para formato padrão
 */
function normalizeNumber(value: any, format: 'brazilian' | 'international'): number | null {
  if (value == null || value === '') return null;
  
  const str = String(value).trim();
  if (!str) return null;
  
  try {
    if (format === 'brazilian') {
      // Converter 1.234,56 -> 1234.56
      const normalized = str
        .replace(/\./g, '') // Remove pontos de milhares
        .replace(',', '.'); // Converte vírgula decimal para ponto
      
      const num = parseFloat(normalized);
      return isNaN(num) ? null : num;
    } else {
      // Formato internacional - apenas remover caracteres não numéricos exceto ponto e hífen
      const normalized = str.replace(/[^\d.-]/g, '');
      const num = parseFloat(normalized);
      return isNaN(num) ? null : num;
    }
  } catch {
    return null;
  }
}

/**
 * Identifica colunas chave baseado nos nomes dos cabeçalhos
 */
function identifyKeyColumns(headers: string[]): ParsedCSVResult['keyColumns'] {
  const keyColumns: ParsedCSVResult['keyColumns'] = {};
  
  const patterns = {
    resultado: [
      /res\.?\s*opera[çc][ãa]o/i,
      /resultado/i,
      /result/i,
      /profit/i,
      /pl\b/i,
      /p&l/i
    ],
    total: [
      /total/i,
      /saldo/i,
      /balance/i,
      /acumulado/i
    ],
    ativo: [
      /ativo/i,
      /s[ií]mbolo/i,
      /symbol/i,
      /instrument/i,
      /papel/i,
      /ticker/i
    ],
    data: [
      /data/i,
      /date/i,
      /hora/i,
      /time/i,
      /timestamp/i,
      /quando/i
    ],
    tipo: [
      /tipo/i,
      /type/i,
      /side/i,
      /opera[çc][ãa]o/i,
      /compra/i,
      /venda/i,
      /buy/i,
      /sell/i
    ],
    quantidade: [
      /quantidade/i,
      /qtd/i,
      /qty/i,
      /quantity/i,
      /volume/i,
      /size/i
    ],
    preco: [
      /pre[çc]o/i,
      /price/i,
      /valor/i,
      /value/i,
      /cota[çc][ãa]o/i
    ]
  };
  
  for (const [key, patternList] of Object.entries(patterns)) {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      for (const pattern of patternList) {
        if (pattern.test(header)) {
          (keyColumns as any)[key] = header;
          console.log(`🎯 Coluna identificada: ${key} = "${header}"`);
          break;
        }
      }
      if ((keyColumns as any)[key]) break;
    }
  }
  
  return keyColumns;
}

/**
 * Remove linhas de cabeçalho extras e linhas vazias
 */
function cleanAndFilterRows(data: any[], headers: string[]): { cleanData: any[]; skippedRows: number } {
  let skippedRows = 0;
  const cleanData: any[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    // Pular linhas completamente vazias
    const values = Object.values(row);
    const hasContent = values.some(v => v != null && String(v).trim() !== '');
    
    if (!hasContent) {
      skippedRows++;
      continue;
    }
    
    // Pular linhas que são repetições do cabeçalho
    const isHeaderRepeat = headers.every((header, idx) => {
      const cellValue = String(values[idx] || '').toLowerCase().trim();
      const headerValue = header.toLowerCase().trim();
      return cellValue === headerValue;
    });
    
    if (isHeaderRepeat) {
      skippedRows++;
      console.log(`🚫 Pulando repetição de cabeçalho na linha ${i + 1}`);
      continue;
    }
    
    // Pular linhas que são claramente metadados ou resumos
    const rowText = values.join(' ').toLowerCase();
    const skipPatterns = [
      /^(total|resumo|summary|subtotal|grand total)/i,
      /^(relatório|report|data de|período)/i,
      /^(conta|account|titular|cliente)/i
    ];
    
    const shouldSkip = skipPatterns.some(pattern => pattern.test(rowText));
    if (shouldSkip) {
      skippedRows++;
      console.log(`🚫 Pulando linha de metadados: ${rowText.substring(0, 50)}...`);
      continue;
    }
    
    cleanData.push(row);
  }
  
  console.log(`🧹 Limpeza: ${cleanData.length} linhas válidas, ${skippedRows} puladas`);
  return { cleanData, skippedRows };
}

/**
 * Função principal de parsing universal
 */
export async function parseCSVUniversal(filePath: string): Promise<ParsedCSVResult> {
  const errors: string[] = [];
  
  try {
    console.log(`\n🔍 SISTEMA UNIVERSAL DE PARSING CSV`);
    console.log(`${'='.repeat(50)}`);
    
    // 1. Detectar encoding e ler arquivo
    console.log(`\n📖 Etapa 1: Leitura com encoding automático`);
    const content = readFileWithEncoding(filePath);
    
    if (!content.trim()) {
      throw new Error('Arquivo vazio ou não pôde ser lido');
    }
    
    // 2. Detectar delimitador
    console.log(`\n🔧 Etapa 2: Detecção de delimitador`);
    const { delimiter, confidence } = detectDelimiter(content);
    
    if (confidence < 0.5) {
      errors.push(`⚠️ Baixa confiança na detecção do delimitador (${(confidence * 100).toFixed(1)}%)`);
    }
    
    // 3. Tentar diferentes configurações de parsing
    console.log(`\n📊 Etapa 3: Parsing com Papa Parse`);
    
    let bestResult: Papa.ParseResult<any> | null = null;
    let bestConfig: any = null;
    
    // Configurações para testar
    const configurations = [
      { delimiter, quoteChar: '"', header: true },
      { delimiter, quoteChar: "'", header: true },
      { delimiter, quoteChar: '"', header: false },
      { delimiter: ',', quoteChar: '"', header: true }, // Fallback
      { delimiter: ';', quoteChar: '"', header: true }  // Fallback
    ];
    
    for (const config of configurations) {
      try {
        const result = Papa.parse<any>(content, {
          ...config,
          skipEmptyLines: true,
          transform: (value: any) => value?.trim() || ''
        });
        
        if (result && result.data && result.data.length > 0 && (!bestResult || result.data.length > bestResult.data.length)) {
          bestResult = result;
          bestConfig = config;
        }
      } catch (parseError) {
        console.warn(`⚠️ Configuração falhou:`, config, parseError);
      }
    }
    
    if (!bestResult) {
      throw new Error('Nenhuma configuração de parsing funcionou');
    }
    
    console.log(`✅ Melhor configuração: delimitador="${bestConfig.delimiter}", aspas="${bestConfig.quoteChar}"`);
    console.log(`📋 Linhas parseadas: ${bestResult.data.length}`);
    
    // 4. Processar headers
    const headers = bestConfig.header 
      ? (bestResult.meta.fields || Object.keys(bestResult.data[0] || {}))
      : Object.keys(bestResult.data[0] || {});
    
    console.log(`📝 Cabeçalhos detectados:`, headers);
    
    // 5. Limpar e filtrar dados
    console.log(`\n🧹 Etapa 4: Limpeza e filtragem`);
    const { cleanData, skippedRows } = cleanAndFilterRows(bestResult.data, headers);
    
    // 6. Detectar formato de números
    console.log(`\n🔢 Etapa 5: Detecção de formato numérico`);
    const numberFormat = detectNumberFormat(cleanData);
    
    // 7. VALIDAÇÃO OBRIGATÓRIA DE DATAS
    console.log(`\n📊 Etapa 6: Validação Obrigatória de Datas`);
    const dateValidation = validateDateColumn(cleanData, headers);
    
    if (!dateValidation.isValid) {
      console.error(`❌ ARQUIVO REJEITADO: Não contém datas válidas`);
      throw new Error(`Arquivo inválido: não contém datas de trades válidas. ${dateValidation.errors.join(' ')}`);
    }
    
    console.log(`✅ DATAS VÁLIDAS ENCONTRADAS:`);
    console.log(`   - Coluna de data: "${dateValidation.dateColumn}"`);
    console.log(`   - Datas válidas: ${dateValidation.validDatesCount}/${dateValidation.totalRowsChecked}`);
    console.log(`   - Formato detectado: ${dateValidation.detectedFormat}`);
    
    // 8. Identificar colunas chave
    console.log(`\n🎯 Etapa 7: Identificação de colunas relevantes`);
    const keyColumns = identifyKeyColumns(headers);
    
    // 9. Normalizar números em todas as linhas
    console.log(`\n⚙️ Etapa 8: Normalização de números`);
    const normalizedData = cleanData.map((row, index) => {
      const normalizedRow: any = {};
      
      for (const [key, value] of Object.entries(row)) {
        // Tentar normalizar como número
        const normalizedNum = normalizeNumber(value, numberFormat);
        normalizedRow[key] = normalizedNum !== null ? normalizedNum : value;
      }
      
      return normalizedRow;
    });
    
    console.log(`✅ PARSING CONCLUÍDO COM SUCESSO`);
    console.log(`${'='.repeat(50)}\n`);
    
    return {
      data: normalizedData,
      headers,
      totalRows: normalizedData.length,
      skippedRows,
      detectedDelimiter: bestConfig.delimiter,
      detectedEncoding: detectFileEncoding(filePath),
      detectedQuoteChar: bestConfig.quoteChar,
      numberFormat,
      dateValidation,
      keyColumns,
      errors
    };
    
  } catch (error) {
    console.error(`❌ Erro no parsing universal:`, error);
    errors.push(`Erro crítico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    
    // Retornar resultado mínimo em caso de erro
    return {
      data: [],
      headers: [],
      totalRows: 0,
      skippedRows: 0,
      detectedDelimiter: ',',
      detectedEncoding: 'utf8',
      detectedQuoteChar: '"',
      numberFormat: 'brazilian',
      dateValidation: {
        isValid: false,
        dateColumn: null,
        validDatesCount: 0,
        totalRowsChecked: 0,
        detectedFormat: null,
        errors: ['Erro crítico no parsing']
      },
      keyColumns: {},
      errors
    };
  }
}