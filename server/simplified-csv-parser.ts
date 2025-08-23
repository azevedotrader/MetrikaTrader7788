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
 * Parser 1: PapaParse (principal) com detecção forçada de delimitador
 */
async function tryPapaParse(content: string, encoding: string): Promise<SimplifiedParseResult> {
  // Forçar detecção manual de delimitador para ser mais preciso
  const delimiter = detectDelimiter(content);
  
  console.log(`🚀 PapaParse usando delimitador: "${delimiter}"`);
  
  const result = Papa.parse(content, {
    header: true,
    delimiter: delimiter, // Forçar o delimitador detectado
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
    transform: (value: string) => value.trim(),
    dynamicTyping: false, // Manter como string para controle manual
    comments: false, // Não interpretar # como comentário
    quoteChar: '"',
    escapeChar: '"'
  });

  if (result.errors.length > 0) {
    console.warn('⚠️ PapaParse avisos:', result.errors.slice(0, 3).map(e => e.message));
  }

  console.log(`📊 PapaParse resultado: ${result.data.length} linhas, ${result.meta.fields?.length || 0} colunas`);
  console.log(`📝 Colunas encontradas: ${result.meta.fields?.join(', ') || 'nenhuma'}`);

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
 * Detecção robusta de delimitador com foco em arquivos B3
 */
function detectDelimiter(content: string): string {
  console.log(`\n🔍 DETECTANDO DELIMITADOR`);
  
  // Pegar mais linhas para análise e pular metadados
  const allLines = content.split('\n');
  const dataLines = allLines.filter(line => {
    const lower = line.toLowerCase().trim();
    // Pular linhas de metadados comuns
    return line.trim() && 
           !lower.startsWith('conta:') && 
           !lower.startsWith('titular:') &&
           !lower.startsWith('relatório') &&
           !lower.startsWith('período');
  }).slice(0, 10);
  
  console.log(`📊 Analisando ${dataLines.length} linhas de dados (pulando metadados)`);
  
  if (dataLines.length === 0) {
    console.warn('⚠️ Nenhuma linha de dados encontrada, usando vírgula como padrão');
    return ',';
  }
  
  // Mostrar amostra do conteúdo para debug
  console.log(`📝 Primeira linha de dados: "${dataLines[0].substring(0, 100)}..."`);
  
  const delimiters = [';', ',', '\t', '|', ':'];
  const results: { delimiter: string; score: number; avgFields: number }[] = [];
  
  for (const delimiter of delimiters) {
    const fieldCounts = dataLines.map(line => line.split(delimiter).length);
    const avgFields = fieldCounts.reduce((a, b) => a + b, 0) / fieldCounts.length;
    
    // Calcular consistência (desvio padrão baixo = boa consistência)
    const variance = fieldCounts.reduce((acc, count) => acc + Math.pow(count - avgFields, 2), 0) / fieldCounts.length;
    const consistency = variance === 0 ? 1 : 1 / (1 + Math.sqrt(variance));
    
    // Score considera tanto número de campos quanto consistência
    const score = avgFields * consistency;
    
    results.push({
      delimiter: delimiter === '\t' ? 'TAB' : delimiter,
      score,
      avgFields
    });
    
    console.log(`   "${delimiter === '\t' ? 'TAB' : delimiter}": ${avgFields.toFixed(1)} campos, consistência: ${(consistency * 100).toFixed(1)}%, score: ${score.toFixed(2)}`);
  }
  
  // Ordenar por score e pegar o melhor
  results.sort((a, b) => b.score - a.score);
  const best = results[0];
  
  let bestDelimiter = best.delimiter === 'TAB' ? '\t' : best.delimiter;
  
  // Dar preferência para ponto e vírgula se tiver score similar (comum em arquivos brasileiros)
  const semicolonResult = results.find(r => r.delimiter === ';');
  if (semicolonResult && semicolonResult.avgFields > 3 && Math.abs(semicolonResult.score - best.score) < 2) {
    bestDelimiter = ';';
    console.log(`🇧🇷 Preferindo ponto e vírgula (formato brasileiro)`);
  }
  
  console.log(`✅ Melhor delimitador: "${bestDelimiter}" com ${best.avgFields.toFixed(1)} campos`);
  
  // Validação final - se ainda tiver poucos campos, pode ser que precise de detecção especial
  if (best.avgFields < 2) {
    console.warn(`⚠️ Poucos campos detectados (${best.avgFields.toFixed(1)}), arquivo pode ter formato especial`);
    
    // Tentar detectar formato B3 Clear específico (tudo em uma coluna separado por ;)
    const firstLine = dataLines[0];
    if (firstLine && firstLine.includes(';') && (firstLine.includes('WIN') || firstLine.includes('WDO'))) {
      console.log(`🎯 Formato B3 Clear detectado, forçando ponto e vírgula`);
      return ';';
    }
  }
  
  return bestDelimiter;
}