/**
 * Sistema Híbrido de Parsing CSV - Máxima Compatibilidade
 * =====================================================
 * 
 * Usa múltiplas bibliotecas para garantir que qualquer CSV seja processado:
 * 1. fast-csv (mais rápido)
 * 2. csv-parse (mais robusto)
 * 3. PapaParse (mais flexível)
 * 4. d3-dsv (mais preciso)
 * 5. csv-parser (com streams)
 */

import fs from 'fs';
import path from 'path';
import { parse as fastCsvParse } from 'fast-csv';
import { parse as csvParse } from 'csv-parse';
import Papa from 'papaparse';
// import { csvParse as d3CsvParse, autoType } from 'd3-dsv';
import csv from 'csv-parser';
import csvtojson from 'csvtojson';
import chardet from 'chardet';
import iconv from 'iconv-lite';
import { validateDateColumn } from './date-validator';
import { Readable } from 'stream';

export interface HybridParseResult {
  data: any[];
  headers: string[];
  method: string;
  encoding: string;
  delimiter: string;
  rowCount: number;
  confidence: number;
  dateValidation: any;
  errors: string[];
}

/**
 * Sistema de parsing com múltiplas tentativas
 */
export async function parseWithHybridSystem(filePath: string): Promise<HybridParseResult> {
  console.log(`\n🔥 SISTEMA HÍBRIDO DE PARSING CSV`);
  console.log(`${'='.repeat(50)}`);
  console.log(`📁 Arquivo: ${path.basename(filePath)}`);

  const errors: string[] = [];
  let bestResult: HybridParseResult | null = null;

  // 1. Detectar encoding
  const encoding = detectEncodingRobust(filePath);
  const content = readFileWithBestEncoding(filePath, encoding);

  if (!content.trim()) {
    throw new Error('Arquivo vazio ou corrompido');
  }

  // Tentar múltiplas abordagens em ordem de prioridade
  const parsers = [
    () => tryFastCSV(content, encoding),
    () => tryCSVParse(content, encoding),
    () => tryPapaParse(content, encoding),
    () => tryD3CSV(content, encoding),
    () => tryCSVParser(filePath, encoding),
    () => tryCSVToJSON(filePath, encoding)
  ];

  for (let i = 0; i < parsers.length; i++) {
    try {
      console.log(`\n🧪 Tentativa ${i + 1}: ${getParserName(i)}`);
      const result = await parsers[i]();
      
      if (result && result.data.length > 0) {
        console.log(`✅ Sucesso com ${result.method}: ${result.data.length} linhas`);
        
        // Validar datas
        result.dateValidation = validateDateColumn(result.data, result.headers);
        
        // Calcular score de confiança
        const confidence = calculateConfidence(result);
        result.confidence = confidence;
        
        if (!bestResult || confidence > bestResult.confidence) {
          bestResult = result;
        }
        
        // Se conseguiu um resultado muito bom, pode parar
        if (confidence > 0.8 && result.dateValidation.isValid) {
          console.log(`🎯 Resultado excelente encontrado, parando aqui`);
          break;
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.warn(`❌ ${getParserName(i)} falhou: ${errorMsg}`);
      errors.push(`${getParserName(i)}: ${errorMsg}`);
    }
  }

  if (!bestResult) {
    throw new Error(`Todos os parsers falharam. Erros: ${errors.join('; ')}`);
  }

  console.log(`\n🏆 MELHOR RESULTADO: ${bestResult.method}`);
  console.log(`📊 Confiança: ${(bestResult.confidence * 100).toFixed(1)}%`);
  console.log(`📝 Linhas: ${bestResult.data.length}`);
  console.log(`📅 Datas válidas: ${bestResult.dateValidation.isValid ? 'SIM' : 'NÃO'}`);

  bestResult.errors = errors;
  return bestResult;
}

/**
 * Parser 1: fast-csv (mais rápido)
 */
async function tryFastCSV(content: string, encoding: string): Promise<HybridParseResult> {
  return new Promise((resolve, reject) => {
    const rows: any[] = [];
    let headers: string[] = [];
    let delimiter = detectDelimiter(content);
    
    const stream = Readable.from([content]);
    
    stream
      .pipe(fastCsvParse({ 
        headers: true, 
        delimiter,
        ignoreEmpty: true,
        trim: true
      }))
      .on('headers', (hdrs: string[]) => {
        headers = hdrs;
      })
      .on('data', (row: any) => {
        rows.push(row);
      })
      .on('end', () => {
        resolve({
          data: rows,
          headers: headers,
          method: 'fast-csv',
          encoding,
          delimiter,
          rowCount: rows.length,
          confidence: 0,
          dateValidation: null,
          errors: []
        });
      })
      .on('error', reject);
  });
}

/**
 * Parser 2: csv-parse (mais robusto)
 */
async function tryCSVParse(content: string, encoding: string): Promise<HybridParseResult> {
  return new Promise((resolve, reject) => {
    const delimiter = detectDelimiter(content);
    
    csvParse(content, {
      columns: true,
      delimiter,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      skip_records_with_error: true
    }, (err, records) => {
      if (err) {
        reject(err);
        return;
      }
      
      const headers = records.length > 0 ? Object.keys(records[0] as object) : [];
      
      resolve({
        data: records,
        headers,
        method: 'csv-parse',
        encoding,
        delimiter,
        rowCount: records.length,
        confidence: 0,
        dateValidation: null,
        errors: []
      });
    });
  });
}

/**
 * Parser 3: PapaParse (mais flexível)
 */
async function tryPapaParse(content: string, encoding: string): Promise<HybridParseResult> {
  const delimiter = detectDelimiter(content);
  
  const result = Papa.parse(content, {
    header: true,
    delimiter,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
    transform: (value: string) => value.trim()
  });
  
  if (result.errors.length > 0) {
    console.warn('⚠️ PapaParse warnings:', result.errors.slice(0, 3));
  }
  
  return {
    data: result.data,
    headers: result.meta.fields || [],
    method: 'PapaParse',
    encoding,
    delimiter,
    rowCount: result.data.length,
    confidence: 0,
    dateValidation: null,
    errors: result.errors.map(e => e.message)
  };
}

/**
 * Parser 4: Fallback manual (mais simples)
 */
async function tryD3CSV(content: string, encoding: string): Promise<HybridParseResult> {
  const delimiter = detectDelimiter(content);
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error('Nenhuma linha encontrada');
  }
  
  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
  const data: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.trim().replace(/"/g, ''));
    if (values.length >= headers.length) {
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }
  }
  
  return {
    data,
    headers,
    method: 'manual-parser',
    encoding,
    delimiter,
    rowCount: data.length,
    confidence: 0,
    dateValidation: null,
    errors: []
  };
}

/**
 * Parser 5: csv-parser (com streams)
 */
async function tryCSVParser(filePath: string, encoding: string): Promise<HybridParseResult> {
  return new Promise((resolve, reject) => {
    const rows: any[] = [];
    let headers: string[] = [];
    
    fs.createReadStream(filePath, { encoding: encoding as any })
      .pipe(csv({
        separator: detectDelimiterFromFile(filePath)
      }))
      .on('headers', (hdrs: string[]) => {
        headers = hdrs;
      })
      .on('data', (row: any) => {
        rows.push(row);
      })
      .on('end', () => {
        resolve({
          data: rows,
          headers: headers.length > 0 ? headers : (rows[0] ? Object.keys(rows[0]) : []),
          method: 'csv-parser',
          encoding,
          delimiter: detectDelimiterFromFile(filePath),
          rowCount: rows.length,
          confidence: 0,
          dateValidation: null,
          errors: []
        });
      })
      .on('error', reject);
  });
}

/**
 * Parser 6: csvtojson (conversão direta)
 */
async function tryCSVToJSON(filePath: string, encoding: string): Promise<HybridParseResult> {
  const delimiter = detectDelimiterFromFile(filePath);
  
  const data = await csvtojson({
    delimiter,
    trim: true,
    ignoreEmpty: true
  }).fromFile(filePath);
  
  const headers = data.length > 0 ? Object.keys(data[0]) : [];
  
  return {
    data,
    headers,
    method: 'csvtojson',
    encoding,
    delimiter,
    rowCount: data.length,
    confidence: 0,
    dateValidation: null,
    errors: []
  };
}

/**
 * Detecta encoding com múltiplas tentativas
 */
function detectEncodingRobust(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  const detected = chardet.detect(buffer);
  
  const encodingMap: { [key: string]: string } = {
    'UTF-8': 'utf8',
    'ISO-8859-1': 'latin1',
    'windows-1252': 'win1252',
    'ASCII': 'ascii'
  };
  
  if (detected && encodingMap[detected]) {
    console.log(`🔍 Encoding detectado: ${detected} -> ${encodingMap[detected]}`);
    return encodingMap[detected];
  }
  
  return 'utf8';
}

/**
 * Lê arquivo com melhor encoding
 */
function readFileWithBestEncoding(filePath: string, encoding: string): string {
  const buffer = fs.readFileSync(filePath);
  
  try {
    if (encoding === 'utf8') {
      return buffer.toString('utf8');
    } else {
      return iconv.decode(buffer, encoding as any);
    }
  } catch (error) {
    console.warn(`⚠️ Erro com ${encoding}, tentando UTF-8`);
    return buffer.toString('utf8');
  }
}

/**
 * Detecta delimitador de forma inteligente
 */
function detectDelimiter(content: string): string {
  const sample = content.split('\n').slice(0, 5).join('\n');
  const delimiters = [';', ',', '\t', '|'];
  
  let bestDelimiter = ',';
  let bestScore = 0;
  
  for (const delimiter of delimiters) {
    const lines = sample.split('\n').filter(line => line.trim());
    if (lines.length < 2) continue;
    
    const counts = lines.map(line => line.split(delimiter).length);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const consistent = counts.every(c => Math.abs(c - avg) <= 1);
    
    if (consistent && avg > bestScore) {
      bestScore = avg;
      bestDelimiter = delimiter;
    }
  }
  
  return bestDelimiter;
}

/**
 * Detecta delimitador direto do arquivo
 */
function detectDelimiterFromFile(filePath: string): string {
  const sample = fs.readFileSync(filePath, 'utf8').split('\n').slice(0, 5).join('\n');
  return detectDelimiter(sample);
}

/**
 * Calcula confiança do resultado
 */
function calculateConfidence(result: HybridParseResult): number {
  let score = 0;
  
  // Pontos por ter dados
  if (result.data.length > 0) score += 0.3;
  if (result.data.length > 10) score += 0.2;
  
  // Pontos por ter headers válidos
  if (result.headers.length > 0) score += 0.2;
  if (result.headers.length > 3) score += 0.1;
  
  // Pontos por ter colunas com dados
  const nonEmptyColumns = result.headers.filter(header => 
    result.data.some(row => row[header] && String(row[header]).trim())
  ).length;
  
  score += (nonEmptyColumns / result.headers.length) * 0.2;
  
  return Math.min(score, 1);
}

/**
 * Nomes dos parsers para logging
 */
function getParserName(index: number): string {
  const names = ['fast-csv', 'csv-parse', 'PapaParse', 'd3-dsv', 'csv-parser', 'csvtojson'];
  return names[index] || 'unknown';
}