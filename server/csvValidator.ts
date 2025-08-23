/**
 * Validador CSV Robusto para Trading
 * ===================================
 * 
 * Sistema de validação estrito que EXIGE que CSVs contenham trades válidos
 * com datas de abertura e fechamento obrigatórias na mesma linha
 */

import Papa from 'papaparse';
import { parse } from 'csv-parse';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import * as fs from 'fs';
import * as chardet from 'chardet';

// Configurar dayjs
dayjs.extend(customParseFormat);

export interface CSVValidationResult {
  valid: boolean;
  reason?: string;
  headers?: string[];
  rows?: any[];
}

interface DateColumns {
  openColumn: string | null;
  closeColumn: string | null;
  openIndex: number;
  closeIndex: number;
}

/**
 * Nomes possíveis para colunas de abertura (EXATO como especificado)
 */
const OPEN_COLUMN_NAMES = [
  'abertura', 
  'open time', 
  'open', 
  'entry time', 
  'data abertura', 
  'opening time'
];

/**
 * Nomes possíveis para colunas de fechamento (EXATO como especificado)
 */
const CLOSE_COLUMN_NAMES = [
  'fechamento', 
  'close time', 
  'close', 
  'exit time', 
  'data fechamento', 
  'closing time'
];

/**
 * Formatos de data aceitos (EXATO como especificado)
 */
const DATE_FORMATS = [
  'DD/MM/YYYY HH:mm:ss',
  'DD/MM/YYYY HH:mm',
  'DD/MM/YYYY',
  'YYYY-MM-DD HH:mm:ss',
  'YYYY-MM-DD',
  'MM/DD/YYYY HH:mm:ss',
  'MM/DD/YYYY'
];

/**
 * Detecta o delimitador mais consistente
 */
function detectDelimiter(csvText: string): string {
  const delimiters = [";", ",", "\t", "|"];
  const lines = csvText.split("\n").slice(0, 10).filter(line => line.trim());
  
  let bestDelimiter = ",";
  let maxScore = 0;

  console.log(`🔍 Testando delimitadores em ${lines.length} linhas...`);

  for (const delimiter of delimiters) {
    const counts = lines.map(line => line.split(delimiter).length);
    
    if (counts.length === 0) continue;
    
    // Calcular consistência
    const maxCount = Math.max(...counts);
    const minCount = Math.min(...counts);
    const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
    
    // Score baseado em consistência entre linhas
    const consistency = minCount === maxCount ? 1 : (minCount / maxCount);
    const score = avgCount * consistency;
    
    console.log(`  ${delimiter === '\t' ? '\\t' : delimiter}: ${avgCount.toFixed(1)} campos, consistência: ${(consistency * 100).toFixed(0)}%`);
    
    if (score > maxScore && avgCount >= 2) {
      maxScore = score;
      bestDelimiter = delimiter;
    }
  }

  console.log(`✅ Delimitador escolhido: "${bestDelimiter === '\t' ? '\\t' : bestDelimiter}"`);
  return bestDelimiter;
}

/**
 * Detecta encoding do arquivo
 */
function detectEncoding(filePath: string): string {
  try {
    const buffer = fs.readFileSync(filePath, { encoding: null }).slice(0, 1024);
    const detected = chardet.detect(buffer);
    
    if (typeof detected === 'string') {
      const detectedLower = detected.toLowerCase();
      
      // Para arquivos brasileiros, priorizar Latin-1/ISO-8859-1
      if (detectedLower.includes('iso-8859') || detectedLower.includes('latin')) {
        console.log(`📁 Encoding detectado: ${detected} → usando latin1 (arquivo brasileiro)`);
        return 'latin1';
      }
      if (detectedLower.includes('windows') || detectedLower.includes('cp1252')) {
        console.log(`📁 Encoding detectado: ${detected} → usando latin1 (Windows)`);
        return 'latin1';
      }
      if (detectedLower.includes('utf')) {
        console.log(`📁 Encoding detectado: ${detected} → usando utf8`);
        return 'utf8';
      }
    }
    
    // Fallback: tentar detectar por caracteres brasileiros no buffer
    const content = buffer.toString('latin1');
    if (content.includes('ç') || content.includes('ã') || content.includes('õ') || 
        content.includes('á') || content.includes('é') || content.includes('í') ||
        content.includes('ó') || content.includes('ú') || content.includes('â') ||
        content.includes('ê') || content.includes('ô') || content.includes('R$')) {
      console.log(`📁 Caracteres brasileiros detectados → usando latin1`);
      return 'latin1';
    }
    
    console.log(`📁 Encoding detectado: ${detected} → usando utf8 (padrão)`);
    return 'utf8';
  } catch (error) {
    console.log(`⚠️ Erro na detecção de encoding, usando utf8`);
    return 'utf8';
  }
}

/**
 * Localiza a linha do cabeçalho real (pode haver metadados antes)
 */
function findHeaderRow(lines: string[], delimiter: string): number {
  console.log(`📋 Procurando cabeçalho real em ${lines.length} linhas...`);
  
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const fields = line.split(delimiter).map(f => f.trim().toLowerCase());
    
    // Indicadores de cabeçalho de trading
    const tradingIndicators = [
      'ativo', 'symbol', 'instrumento', 'ticket', 'pair',
      'abertura', 'open', 'entrada', 'entry', 'data',
      'fechamento', 'close', 'saida', 'exit',
      'quantidade', 'volume', 'size', 'lots', 'qtd',
      'preco', 'price', 'valor', 'cotacao',
      'resultado', 'profit', 'pnl', 'lucro', 'prejuizo'
    ];
    
    const matchCount = fields.filter(field => 
      tradingIndicators.some(indicator => field.includes(indicator))
    ).length;
    
    // Se encontrou pelo menos 3 indicadores e tem pelo menos 5 campos
    if (matchCount >= 3 && fields.length >= 5) {
      console.log(`✅ Cabeçalho encontrado na linha ${i + 1}`);
      return i;
    }
  }
  
  // Fallback: primeira linha com mais de 5 campos
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const fields = lines[i].split(delimiter);
    if (fields.length >= 5) {
      console.log(`⚠️ Usando linha ${i + 1} como cabeçalho (fallback)`);
      return i;
    }
  }
  
  return 0;
}

/**
 * Identifica colunas de abertura e fechamento (OBRIGATÓRIAS)
 */
function findDateColumns(headers: string[]): DateColumns {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  let openColumn: string | null = null;
  let closeColumn: string | null = null;
  let openIndex = -1;
  let closeIndex = -1;
  
  // Procurar coluna de abertura
  for (let i = 0; i < normalizedHeaders.length; i++) {
    const header = normalizedHeaders[i];
    for (const name of OPEN_COLUMN_NAMES) {
      if (header === name.toLowerCase() || header.includes(name.toLowerCase())) {
        openColumn = headers[i];
        openIndex = i;
        break;
      }
    }
    if (openColumn) break;
  }
  
  // Procurar coluna de fechamento
  for (let i = 0; i < normalizedHeaders.length; i++) {
    const header = normalizedHeaders[i];
    for (const name of CLOSE_COLUMN_NAMES) {
      if (header === name.toLowerCase() || header.includes(name.toLowerCase())) {
        closeColumn = headers[i];
        closeIndex = i;
        break;
      }
    }
    if (closeColumn) break;
  }
  
  console.log(`📅 Colunas de data: Abertura="${openColumn}" (índice ${openIndex}), Fechamento="${closeColumn}" (índice ${closeIndex})`);
  
  return { openColumn, closeColumn, openIndex, closeIndex };
}

/**
 * Tenta parsear data em múltiplos formatos
 */
function parseTradeDate(dateStr: string): dayjs.Dayjs | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  const cleaned = dateStr.trim();
  if (!cleaned || cleaned === '') return null;
  
  // Tentar cada formato especificado
  for (const format of DATE_FORMATS) {
    const parsed = dayjs(cleaned, format, true); // strict mode
    if (parsed.isValid()) {
      return parsed;
    }
  }
  
  return null;
}

/**
 * Converte número brasileiro/americano para number
 */
function parseNumber(value: string): number {
  if (!value || typeof value !== 'string') return 0;
  
  let cleaned = value.trim();
  if (!cleaned) return 0;
  
  // Remover símbolo R$ e outros caracteres não numéricos, mas manter .,+-
  cleaned = cleaned.replace(/[^\d.,\-+]/g, '');
  if (!cleaned) return 0;
  
  // Detectar formato brasileiro vs americano
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  
  // Se tem vírgula e ela está depois do último ponto, é formato brasileiro
  if (lastComma > lastDot && lastComma !== -1) {
    // Formato brasileiro: 1.234,56 ou 135.615,00
    // Remover pontos (separadores de milhares) e trocar vírgula por ponto decimal
    const result = cleaned.replace(/\./g, '').replace(',', '.');
    return parseFloat(result);
  } 
  // Se tem apenas vírgula (sem ponto), também é formato brasileiro
  else if (lastComma !== -1 && lastDot === -1) {
    // Formato brasileiro simples: 1234,56
    return parseFloat(cleaned.replace(',', '.'));
  }
  // Se tem apenas ponto ou ponto está depois da vírgula, é formato americano
  else {
    // Formato americano: 1,234.56 ou 1234.56
    return parseFloat(cleaned.replace(/,/g, ''));
  }
}

/**
 * Valida se uma linha representa um trade válido
 */
function validateTradeRow(row: any[], dateColumns: DateColumns): { valid: boolean; openDate?: dayjs.Dayjs; closeDate?: dayjs.Dayjs } {
  const { openIndex, closeIndex } = dateColumns;
  
  if (openIndex === -1 || closeIndex === -1) {
    return { valid: false };
  }
  
  const openDateStr = row[openIndex];
  const closeDateStr = row[closeIndex];
  
  const openDate = parseTradeDate(openDateStr);
  const closeDate = parseTradeDate(closeDateStr);
  
  if (!openDate || !closeDate) {
    return { valid: false };
  }
  
  // Verificar se open <= close
  if (openDate.isAfter(closeDate)) {
    return { valid: false };
  }
  
  return { valid: true, openDate, closeDate };
}

/**
 * Função principal de validação e parsing
 */
export async function validateAndParseCSV(filePathOrContent: string | File): Promise<CSVValidationResult> {
  console.log(`\n🔍 === INICIANDO VALIDAÇÃO CSV ESTRITA ===`);
  
  try {
    let csvContent: string;
    let encoding = 'utf8';
    
    // Determinar se é arquivo ou conteúdo
    if (typeof filePathOrContent === 'string') {
      if (fs.existsSync(filePathOrContent)) {
        // É um caminho de arquivo
        encoding = detectEncoding(filePathOrContent);
        csvContent = fs.readFileSync(filePathOrContent, { encoding: encoding as BufferEncoding });
      } else {
        // É conteúdo direto
        csvContent = filePathOrContent;
      }
    } else {
      // É um File object (browser)
      csvContent = await filePathOrContent.text();
    }
    
    if (!csvContent.trim()) {
      return { valid: false, reason: "Arquivo CSV está vazio" };
    }
    
    // 1. Detectar delimitador
    const delimiter = detectDelimiter(csvContent);
    
    // 2. Dividir em linhas e encontrar cabeçalho
    const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line);
    const headerRowIndex = findHeaderRow(lines, delimiter);
    
    if (headerRowIndex >= lines.length) {
      return { valid: false, reason: "Não foi possível localizar cabeçalho válido no arquivo" };
    }
    
    // 3. Extrair cabeçalhos
    const headerLine = lines[headerRowIndex];
    const headers = headerLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
    
    console.log(`📋 Cabeçalhos encontrados: [${headers.join(', ')}]`);
    
    if (headers.length < 2) {
      return { 
        valid: false, 
        reason: `Cabeçalho inválido: deve ter pelo menos 2 colunas, encontradas apenas ${headers.length}` 
      };
    }
    
    // 4. VALIDAÇÃO OBRIGATÓRIA: Identificar colunas de data
    const dateColumns = findDateColumns(headers);
    
    // REJEITAR se não tiver AMBAS as colunas de data
    if (!dateColumns.openColumn || !dateColumns.closeColumn) {
      const missingColumns = [];
      if (!dateColumns.openColumn) {
        missingColumns.push(`'Abertura' (procurei: ${OPEN_COLUMN_NAMES.join(', ')})`);
      }
      if (!dateColumns.closeColumn) {
        missingColumns.push(`'Fechamento' (procurei: ${CLOSE_COLUMN_NAMES.join(', ')})`);
      }
      
      return { 
        valid: false, 
        reason: `Arquivo inválido: trades sem colunas ${missingColumns.join(' e ')} válidas. Colunas encontradas: ${headers.join(', ')}` 
      };
    }
    
    console.log(`✅ Colunas de data obrigatórias encontradas!`);
    
    // 5. Parse com PapaParse
    let parseResult: Papa.ParseResult<any>;
    
    try {
      parseResult = Papa.parse(csvContent, {
        delimiter: delimiter,
        header: false,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        transform: (value: string) => value.trim()
      });
      
      if (parseResult.errors.length > 0) {
        console.log(`⚠️ Avisos do parser:`, parseResult.errors.slice(0, 3));
      }
    } catch (papaError) {
      console.log(`⚠️ PapaParse falhou, tentando csv-parse como fallback...`);
      
      // Fallback para csv-parse
      return new Promise((resolve) => {
        const rows: any[] = [];
        const parser = parse({
          delimiter: delimiter,
          skip_empty_lines: true,
          trim: true
        });
        
        parser.on('data', (row) => rows.push(row));
        parser.on('error', (err) => {
          resolve({ valid: false, reason: `Erro no parsing do CSV: ${err.message}` });
        });
        parser.on('end', () => {
          const result = processRows(rows.slice(headerRowIndex + 1), headers, dateColumns);
          resolve(result);
        });
        
        parser.write(csvContent);
        parser.end();
      });
    }
    
    // 6. Processar e validar dados
    const dataRows = parseResult.data.slice(headerRowIndex + 1);
    return processRows(dataRows, headers, dateColumns);
    
  } catch (error) {
    console.error(`❌ Erro na validação:`, error);
    return { valid: false, reason: `Erro interno na validação: ${error}` };
  }
}

/**
 * Processa as linhas de dados e valida ESTRITAMENTE
 */
function processRows(
  dataRows: any[], 
  headers: string[], 
  dateColumns: DateColumns
): CSVValidationResult {
  console.log(`\n📊 Validando ${dataRows.length} linhas de dados...`);
  
  if (dataRows.length === 0) {
    return { valid: false, reason: "CSV não contém dados de trades (apenas cabeçalho)" };
  }
  
  // Validar CADA linha de trade
  let validTrades = 0;
  let invalidTrades = 0;
  const normalizedRows: any[] = [];
  const errors: string[] = [];
  
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const lineNumber = i + 1;
    
    if (!Array.isArray(row) || row.length < headers.length) {
      // Linha com estrutura inválida - pular silenciosamente
      continue;
    }
    
    // VALIDAÇÃO ESTRITA: datas obrigatórias
    const validation = validateTradeRow(row, dateColumns);
    
    if (!validation.valid) {
      invalidTrades++;
      const openDateStr = row[dateColumns.openIndex] || 'vazio';
      const closeDateStr = row[dateColumns.closeIndex] || 'vazio';
      
      errors.push(`Linha ${lineNumber}: datas inválidas (Abertura: '${openDateStr}', Fechamento: '${closeDateStr}')`);
      
      // REJEITAR ARQUIVO se qualquer trade não tiver datas válidas
      if (invalidTrades === 1) {
        console.log(`❌ Trade inválido encontrado na linha ${lineNumber}`);
        return { 
          valid: false, 
          reason: `Linha ${lineNumber}: trade sem datas de 'Abertura' e 'Fechamento' válidas. Abertura: '${openDateStr}', Fechamento: '${closeDateStr}'` 
        };
      }
      continue;
    }
    
    // Normalizar a linha com conversão de números
    const normalizedRow: any = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      let value = row[j];
      
      // Converter números se possível
      if (typeof value === 'string' && value.trim() !== '') {
        // Verificar se parece um número
        if (/^[\d.,\-+\s]+$/.test(value.trim())) {
          const numValue = parseNumber(value);
          if (!isNaN(numValue)) {
            value = numValue;
          }
        }
      }
      
      normalizedRow[header] = value;
    }
    
    // Adicionar datas parseadas para facilitar processamento posterior
    normalizedRow._openDate = validation.openDate?.toISOString();
    normalizedRow._closeDate = validation.closeDate?.toISOString();
    
    normalizedRows.push(normalizedRow);
    validTrades++;
  }
  
  if (validTrades === 0) {
    return { 
      valid: false, 
      reason: "Nenhum trade válido encontrado. Todos os trades devem ter datas de Abertura e Fechamento válidas." 
    };
  }
  
  console.log(`✅ Validação concluída: ${validTrades} trades válidos de ${dataRows.length} linhas`);
  
  return {
    valid: true,
    headers: headers,
    rows: normalizedRows
  };
}