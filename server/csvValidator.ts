/**
 * Validador CSV Robusto para Trading
 * ===================================
 * 
 * Sistema completo de validação que garante que CSVs contêm trades válidos
 * com datas de abertura e fechamento obrigatórias
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

interface DetectedFormat {
  delimiter: string;
  encoding: string;
  headerRowIndex: number;
  hasMetadata: boolean;
}

interface DateColumns {
  openColumn: string | null;
  closeColumn: string | null;
  openIndex: number;
  closeIndex: number;
}

/**
 * Nomes possíveis para colunas de abertura
 */
const OPEN_COLUMN_NAMES = [
  'abertura', 'open time', 'open', 'entry time', 'data abertura', 'opening time',
  'data_abertura', 'hora_abertura', 'entrada', 'inicio', 'start', 'begin'
];

/**
 * Nomes possíveis para colunas de fechamento
 */
const CLOSE_COLUMN_NAMES = [
  'fechamento', 'close time', 'close', 'exit time', 'data fechamento', 'closing time',
  'data_fechamento', 'hora_fechamento', 'saida', 'fim', 'end', 'finish'
];

/**
 * Formatos de data aceitos (usando dayjs)
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
  const lines = csvText.split("\n").slice(0, 5).filter(line => line.trim());
  
  let bestDelimiter = ",";
  let maxConsistency = 0;

  for (const delimiter of delimiters) {
    const counts = lines.map(line => line.split(delimiter).length);
    
    if (counts.length === 0) continue;
    
    // Verificar consistência: todas as linhas devem ter o mesmo número de campos
    const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((sum, count) => sum + Math.pow(count - avgCount, 2), 0) / counts.length;
    
    // Preferir delimitadores com maior número de campos e menor variância
    const consistency = avgCount / (variance + 1);
    
    if (consistency > maxConsistency && avgCount > 1) {
      maxConsistency = consistency;
      bestDelimiter = delimiter;
    }
  }

  console.log(`🔍 Delimitador detectado: "${bestDelimiter}" (consistência: ${maxConsistency.toFixed(2)})`);
  return bestDelimiter;
}

/**
 * Detecta encoding do arquivo
 */
function detectEncoding(filePath: string): string {
  try {
    const buffer = fs.readFileSync(filePath, { encoding: null }).slice(0, 1024);
    const detected = chardet.detect(buffer);
    
    // Mapear para encodings suportados
    if (typeof detected === 'string') {
      if (detected.toLowerCase().includes('utf')) return 'utf8';
      if (detected.toLowerCase().includes('iso-8859') || detected.toLowerCase().includes('latin')) return 'latin1';
      if (detected.toLowerCase().includes('windows') || detected.toLowerCase().includes('cp1252')) return 'latin1';
    }
    
    console.log(`📁 Encoding detectado: ${detected} → usando utf8`);
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
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const fields = lines[i].split(delimiter).map(f => f.trim().toLowerCase());
    
    // Procurar por indicadores de cabeçalho de trading
    const tradingIndicators = [
      'ativo', 'symbol', 'instrumento', 'ticket', 'pair',
      'abertura', 'open', 'entrada', 'start',
      'fechamento', 'close', 'saida', 'end',
      'quantidade', 'volume', 'size', 'lots',
      'preco', 'price', 'valor', 'cotacao',
      'resultado', 'profit', 'pnl', 'gain', 'loss'
    ];
    
    const matchCount = fields.filter(field => 
      tradingIndicators.some(indicator => field.includes(indicator))
    ).length;
    
    // Se encontrou pelo menos 2 indicadores de trading, é provavelmente o cabeçalho
    if (matchCount >= 2 && fields.length >= 3) {
      console.log(`📋 Cabeçalho encontrado na linha ${i + 1} (${matchCount} indicadores)`);
      return i;
    }
  }
  
  // Fallback: primeira linha com mais de 2 campos
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    if (lines[i].split(delimiter).length >= 3) {
      console.log(`📋 Usando linha ${i + 1} como cabeçalho (fallback)`);
      return i;
    }
  }
  
  return 0;
}

/**
 * Identifica colunas de abertura e fechamento
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
    if (OPEN_COLUMN_NAMES.some(name => header.includes(name))) {
      openColumn = headers[i];
      openIndex = i;
      break;
    }
  }
  
  // Procurar coluna de fechamento
  for (let i = 0; i < normalizedHeaders.length; i++) {
    const header = normalizedHeaders[i];
    if (CLOSE_COLUMN_NAMES.some(name => header.includes(name))) {
      closeColumn = headers[i];
      closeIndex = i;
      break;
    }
  }
  
  console.log(`📅 Colunas de data: Abertura="${openColumn}" (${openIndex}), Fechamento="${closeColumn}" (${closeIndex})`);
  
  return { openColumn, closeColumn, openIndex, closeIndex };
}

/**
 * Tenta parsear data em múltiplos formatos
 */
function parseTradeDate(dateStr: string): dayjs.Dayjs | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  const cleaned = dateStr.trim();
  if (!cleaned) return null;
  
  for (const format of DATE_FORMATS) {
    const parsed = dayjs(cleaned, format, true);
    if (parsed.isValid()) {
      return parsed;
    }
  }
  
  // Fallback: tentar parsing nativo do dayjs
  const fallback = dayjs(cleaned);
  return fallback.isValid() ? fallback : null;
}

/**
 * Converte número brasileiro/americano para number
 */
function parseNumber(value: string): number {
  if (!value || typeof value !== 'string') return 0;
  
  const cleaned = value.trim().replace(/[^\d.,\-+]/g, '');
  
  // Detectar formato brasileiro (1.234,56) vs americano (1,234.56)
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  
  if (lastComma > lastDot) {
    // Formato brasileiro: 1.234,56
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
  } else {
    // Formato americano: 1,234.56
    return parseFloat(cleaned.replace(/,/g, ''));
  }
}

/**
 * Valida se uma linha representa um trade válido
 */
function validateTradeRow(row: any[], dateColumns: DateColumns, headers: string[]): boolean {
  const { openIndex, closeIndex } = dateColumns;
  
  if (openIndex === -1 || closeIndex === -1) return false;
  
  const openDateStr = row[openIndex];
  const closeDateStr = row[closeIndex];
  
  const openDate = parseTradeDate(openDateStr);
  const closeDate = parseTradeDate(closeDateStr);
  
  if (!openDate || !closeDate) {
    console.log(`❌ Datas inválidas: "${openDateStr}" → ${openDate?.isValid()}, "${closeDateStr}" → ${closeDate?.isValid()}`);
    return false;
  }
  
  if (openDate.isAfter(closeDate)) {
    console.log(`❌ Data de abertura após fechamento: ${openDate.format()} > ${closeDate.format()}`);
    return false;
  }
  
  return true;
}

/**
 * Função principal de validação e parsing
 */
export async function validateAndParseCSV(filePathOrContent: string | File): Promise<CSVValidationResult> {
  console.log(`🔍 Iniciando validação CSV...`);
  
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
      return { valid: false, reason: "Não foi possível localizar cabeçalho válido" };
    }
    
    // 3. Extrair cabeçalhos
    const headerLine = lines[headerRowIndex];
    const headers = headerLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
    
    if (headers.length < 3) {
      return { valid: false, reason: "Cabeçalho deve ter pelo menos 3 colunas" };
    }
    
    // 4. Identificar colunas de data obrigatórias
    const dateColumns = findDateColumns(headers);
    
    if (!dateColumns.openColumn || !dateColumns.closeColumn) {
      const missingColumns = [];
      if (!dateColumns.openColumn) missingColumns.push('Abertura');
      if (!dateColumns.closeColumn) missingColumns.push('Fechamento');
      
      return { 
        valid: false, 
        reason: `Arquivo inválido: trades sem colunas '${missingColumns.join("' e '")}' válidas. Colunas encontradas: ${headers.join(', ')}` 
      };
    }
    
    // 5. Parse com PapaParse principal
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
        console.log(`⚠️ Avisos PapaParse:`, parseResult.errors.slice(0, 3));
      }
    } catch (papaError) {
      console.log(`⚠️ PapaParse falhou, tentando csv-parse...`);
      
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
          resolve({ valid: false, reason: `Erro no parsing: ${err.message}` });
        });
        parser.on('end', () => {
          processRows(rows.slice(headerRowIndex + 1), headers, dateColumns, resolve);
        });
        
        parser.write(csvContent);
        parser.end();
      });
    }
    
    // 6. Processar dados parseados
    const dataRows = parseResult.data.slice(headerRowIndex + 1);
    
    return new Promise((resolve) => {
      processRows(dataRows, headers, dateColumns, resolve);
    });
    
  } catch (error) {
    console.error(`❌ Erro na validação:`, error);
    return { valid: false, reason: `Erro interno: ${error}` };
  }
}

/**
 * Processa as linhas de dados e valida
 */
function processRows(
  dataRows: any[], 
  headers: string[], 
  dateColumns: DateColumns, 
  resolve: (result: CSVValidationResult) => void
) {
  console.log(`📊 Validando ${dataRows.length} linhas de dados...`);
  
  if (dataRows.length === 0) {
    resolve({ valid: false, reason: "CSV não contém dados de trades" });
    return;
  }
  
  // 7. Validar cada linha de trade
  let validTrades = 0;
  const normalizedRows: any[] = [];
  
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    
    if (!Array.isArray(row) || row.length < headers.length) {
      console.log(`⚠️ Linha ${i + 1}: estrutura inválida`);
      continue;
    }
    
    // Validar datas obrigatórias
    if (!validateTradeRow(row, dateColumns, headers)) {
      console.log(`❌ Linha ${i + 1}: datas inválidas`);
      resolve({ 
        valid: false, 
        reason: `Linha ${i + 1}: trade sem datas de 'Abertura' e 'Fechamento' válidas` 
      });
      return;
    }
    
    // Normalizar números
    const normalizedRow: any = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      let value = row[j];
      
      // Tentar converter números
      if (typeof value === 'string' && /^[\d.,\-+\s]+$/.test(value.trim())) {
        const numValue = parseNumber(value);
        if (!isNaN(numValue)) {
          value = numValue;
        }
      }
      
      normalizedRow[header] = value;
    }
    
    normalizedRows.push(normalizedRow);
    validTrades++;
  }
  
  console.log(`✅ Validação concluída: ${validTrades} trades válidos`);
  
  resolve({
    valid: true,
    headers: headers,
    rows: normalizedRows
  });
}