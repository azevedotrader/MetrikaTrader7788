/**
 * Sistema Simplificado de Parsing CSV - Apenas 2 Bibliotecas Confiáveis
 * ===================================================================
 * 
 * Fluxo limpo e confiável:
 * 1. PapaParse (default) - Excelente detecção automática
 * 2. csv-parse (fallback) - Baixo nível para casos extremos
 * 3. Rejeitar se nenhum conseguir
 */

import fs from 'fs';
import Papa from 'papaparse';
import { parse as csvParse } from 'csv-parse';
import chardet from 'chardet';
import iconv from 'iconv-lite';
import { validateDateColumn } from './date-validator';

export interface SimplifiedParseResult {
  data: any[];
  headers: string[];
  method: 'PapaParse' | 'csv-parse';
  encoding: string;
  delimiter: string;
  rowCount: number;
  dateValidation: any;
  errors: string[];
}

/**
 * Parser principal com PapaParse + csv-parse como fallback
 */
export async function parseWithSimplifiedSystem(filePath: string): Promise<SimplifiedParseResult> {
  console.log(`\n🎯 SISTEMA SIMPLIFICADO DE PARSING CSV`);
  console.log(`${'='.repeat(50)}`);
  console.log(`📁 Arquivo: ${filePath}`);

  // 1. Detectar encoding e ler arquivo
  const encoding = detectEncoding(filePath);
  const content = readFileWithEncoding(filePath, encoding);

  if (!content.trim()) {
    throw new Error('Arquivo vazio ou corrompido');
  }

  // 2. Tentar PapaParse primeiro (parser principal)
  console.log(`\n🚀 Tentativa 1: PapaParse (parser principal)`);
  try {
    const result = await tryPapaParse(content, encoding);
    
    // Validar se o resultado é bom o suficiente
    if (result.data.length > 0 && result.headers.length > 0) {
      console.log(`✅ PapaParse funcionou: ${result.data.length} linhas`);
      
      // Validar datas
      result.dateValidation = validateDateColumn(result.data, result.headers);
      
      return result;
    } else {
      throw new Error('PapaParse não retornou dados válidos');
    }
  } catch (papaError) {
    console.warn(`⚠️ PapaParse falhou: ${papaError instanceof Error ? papaError.message : 'Erro desconhecido'}`);
  }

  // 3. Fallback para csv-parse (mais baixo nível)
  console.log(`\n🔧 Tentativa 2: csv-parse (fallback robusto)`);
  try {
    const result = await tryCSVParse(content, encoding);
    
    if (result.data.length > 0 && result.headers.length > 0) {
      console.log(`✅ csv-parse funcionou: ${result.data.length} linhas`);
      
      // Validar datas
      result.dateValidation = validateDateColumn(result.data, result.headers);
      
      return result;
    } else {
      throw new Error('csv-parse não retornou dados válidos');
    }
  } catch (csvError) {
    console.error(`❌ csv-parse também falhou: ${csvError instanceof Error ? csvError.message : 'Erro desconhecido'}`);
  }

  // 4. Se chegou aqui, nenhum parser conseguiu
  throw new Error('Arquivo CSV não pôde ser processado por nenhum parser. Verifique o formato do arquivo.');
}

/**
 * Parser 1: PapaParse (principal)
 */
async function tryPapaParse(content: string, encoding: string): Promise<SimplifiedParseResult> {
  // PapaParse tem excelente detecção automática
  const result = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
    transform: (value: string) => value.trim(),
    dynamicTyping: false, // Manter como string para controle manual
  });

  if (result.errors.length > 0) {
    console.warn('⚠️ PapaParse avisos:', result.errors.slice(0, 3).map(e => e.message));
  }

  // PapaParse detecta automaticamente o delimitador
  const delimiter = result.meta.delimiter || ',';

  return {
    data: result.data,
    headers: result.meta.fields || [],
    method: 'PapaParse',
    encoding,
    delimiter,
    rowCount: result.data.length,
    dateValidation: null,
    errors: result.errors.map(e => e.message)
  };
}

/**
 * Parser 2: csv-parse (fallback para casos extremos)
 */
async function tryCSVParse(content: string, encoding: string): Promise<SimplifiedParseResult> {
  return new Promise((resolve, reject) => {
    // Detectar delimitador manualmente para csv-parse
    const delimiter = detectDelimiter(content);
    
    console.log(`🔍 Tentando csv-parse com delimitador: "${delimiter}"`);
    
    csvParse(content, {
      columns: true,
      delimiter,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      skip_records_with_error: true,
      relax_column_count: true, // Permite linhas com número diferente de colunas
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
        dateValidation: null,
        errors: []
      });
    });
  });
}

/**
 * Detecção robusta de encoding
 */
function detectEncoding(filePath: string): string {
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
  
  console.log(`⚠️ Encoding não reconhecido (${detected}), usando UTF-8`);
  return 'utf8';
}

/**
 * Leitura de arquivo com encoding correto
 */
function readFileWithEncoding(filePath: string, encoding: string): string {
  const buffer = fs.readFileSync(filePath);
  
  try {
    if (encoding === 'utf8') {
      return buffer.toString('utf8');
    } else {
      return iconv.decode(buffer, encoding as any);
    }
  } catch (error) {
    console.warn(`⚠️ Erro com ${encoding}, fallback para UTF-8`);
    return buffer.toString('utf8');
  }
}

/**
 * Detecção simples e eficaz de delimitador
 */
function detectDelimiter(content: string): string {
  const sample = content.split('\n').slice(0, 5).join('\n');
  const delimiters = [';', ',', '\t', '|'];
  
  // Detectar padrões específicos B3 primeiro
  if (sample.includes('WIN') || sample.includes('WDO') || sample.includes('BGI')) {
    for (const delimiter of [';', ',', '\t']) {
      if (sample.includes(delimiter)) {
        console.log(`🎯 Arquivo B3 detectado, usando: "${delimiter}"`);
        return delimiter;
      }
    }
  }
  
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
  
  console.log(`🔍 Delimitador detectado: "${bestDelimiter}"`);
  return bestDelimiter;
}