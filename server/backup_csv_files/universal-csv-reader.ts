/**
 * Universal CSV Reader - TypeScript/Node.js Version
 * =================================================
 * 
 * Função universal para ler qualquer arquivo CSV, detectando automaticamente:
 * - Encoding (UTF-8, ISO-8859-1, Windows-1252, etc.)
 * - Delimitador (; , | \t : - * e outros)
 * - Aspas e caracteres de escape
 * - Quebras de linha dentro de células
 * 
 * Compatível com a infraestrutura existente do Métrika
 */

import * as fs from 'fs';
import * as path from 'path';
import * as chardet from 'chardet';
import * as iconv from 'iconv-lite';
import Papa, { ParseResult } from 'papaparse';

/**
 * Interface para configurações da leitura universal
 */
export interface UniversalCSVOptions {
  /** Forçar um delimitador específico */
  forceDelimiter?: string;
  /** Forçar uma codificação específica */
  forceEncoding?: string;
  /** Tamanho máximo da amostra para detecção (bytes) */
  maxSampleSize?: number;
  /** Exibir informações de debug */
  debug?: boolean;
  /** Detectar automaticamente o cabeçalho */
  autoDetectHeader?: boolean;
}

/**
 * Interface para o resultado da leitura
 */
export interface UniversalCSVResult {
  /** Dados parseados */
  data: any[];
  /** Metadados da detecção */
  meta: {
    encoding: string;
    delimiter: string;
    hasHeader: boolean;
    totalRows: number;
    totalColumns: number;
    fileSize: number;
    errors: string[];
    warnings: string[];
  };
}

/**
 * Interface para análise de formato
 */
export interface CSVFormatAnalysis {
  encoding: string;
  delimiter: string;
  hasHeader: boolean;
  estimatedRows: number;
  columns: string[];
  fileSize: number;
  sample: string;
}

/**
 * Função principal para leitura universal de CSV
 */
export async function readCSVUniversal(
  filePath: string,
  options: UniversalCSVOptions = {}
): Promise<UniversalCSVResult> {
  const {
    forceDelimiter,
    forceEncoding,
    maxSampleSize = 10240,
    debug = true,
    autoDetectHeader = true
  } = options;

  if (debug) {
    console.log(`📂 Lendo arquivo CSV: ${filePath}`);
  }

  // 1. Verificar se arquivo existe
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo não encontrado: ${filePath}`);
  }

  const stats = fs.statSync(filePath);
  const fileSize = stats.size;

  if (fileSize === 0) {
    throw new Error('Arquivo CSV está vazio');
  }

  if (debug) {
    console.log(`📏 Tamanho do arquivo: ${fileSize.toLocaleString()} bytes`);
  }

  try {
    // 2. Detectar encoding
    const encoding = await detectEncoding(filePath, forceEncoding, maxSampleSize, debug);

    // 3. Ler amostra para análise
    const sampleContent = await readSample(filePath, encoding, maxSampleSize);

    // 4. Detectar delimitador
    const delimiter = detectDelimiter(sampleContent, forceDelimiter, debug);

    // 5. Detectar cabeçalho
    const hasHeader = autoDetectHeader ? 
      detectHeader(sampleContent, delimiter, debug) : false;

    // 6. Ler arquivo completo
    const fullContent = await readFullFile(filePath, encoding);

    // 7. Processar com PapaParse
    const result = await processWithPapaParse(
      fullContent,
      delimiter,
      hasHeader,
      debug
    );

    // 8. Limpar e validar dados
    const cleanedData = cleanCSVData(result.data, debug);

    // 9. Calcular estatísticas finais
    const totalRows = cleanedData.length;
    const totalColumns = totalRows > 0 ? Object.keys(cleanedData[0] || {}).length : 0;

    const finalResult: UniversalCSVResult = {
      data: cleanedData,
      meta: {
        encoding,
        delimiter,
        hasHeader,
        totalRows,
        totalColumns,
        fileSize,
        errors: result.errors || [],
        warnings: []
      }
    };

    if (debug) {
      console.log(`✅ CSV processado com sucesso!`);
      console.log(`📊 Resultado: ${totalRows.toLocaleString()} linhas × ${totalColumns} colunas`);
      console.log(`🔤 Encoding: ${encoding}`);
      console.log(`📋 Delimitador: '${delimiter === '\t' ? 'TAB' : delimiter}'`);
      console.log(`🏷️ Cabeçalho: ${hasHeader ? 'Sim' : 'Não'}`);
      
      if (totalRows > 0) {
        console.log(`📝 Colunas: ${Object.keys(cleanedData[0]).join(', ')}`);
      }
    }

    return finalResult;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const suggestions = getErrorSuggestions(errorMessage, filePath);
    
    throw new Error(
      `Erro ao processar CSV: ${errorMessage}${suggestions.length > 0 ? 
        '\n\n💡 Sugestões:\n' + suggestions.map(s => `• ${s}`).join('\n') : ''
      }`
    );
  }
}

/**
 * Detecta o encoding do arquivo
 */
async function detectEncoding(
  filePath: string,
  forceEncoding?: string,
  maxSampleSize: number = 10240,
  debug: boolean = true
): Promise<string> {
  if (forceEncoding) {
    if (debug) {
      console.log(`🔤 Encoding forçado: ${forceEncoding}`);
    }
    return forceEncoding;
  }

  // Ler amostra do arquivo
  const buffer = fs.readFileSync(filePath);
  const sample = buffer.slice(0, maxSampleSize);

  // Usar chardet para detectar
  const detected = chardet.detect(sample);
  let encoding = detected || 'utf8';
  
  // Normalizar nomes de encoding
  encoding = encoding.toLowerCase().replace(/-/g, '');
  
  // Mapear para encodings suportados pelo iconv-lite
  const encodingMap: Record<string, string> = {
    'utf8': 'utf8',
    'utf-8': 'utf8',
    'iso88591': 'iso88591',
    'iso-8859-1': 'iso88591',
    'latin1': 'latin1',
    'windows1252': 'windows1252',
    'cp1252': 'cp1252',
    'ascii': 'ascii'
  };

  const mappedEncoding = encodingMap[encoding] || 'utf8';

  // Validar se o encoding funciona
  try {
    iconv.decode(sample, mappedEncoding);
    
    if (debug) {
      console.log(`🔤 Encoding detectado: ${mappedEncoding}`);
    }
    
    return mappedEncoding;
  } catch (error) {
    // Fallback para utf8
    if (debug) {
      console.log(`🔤 Encoding fallback: utf8 (original: ${encoding})`);
    }
    return 'utf8';
  }
}

/**
 * Lê uma amostra do arquivo
 */
async function readSample(
  filePath: string,
  encoding: string,
  maxSampleSize: number
): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const sample = buffer.slice(0, maxSampleSize);
  
  try {
    return iconv.decode(sample, encoding);
  } catch (error) {
    // Fallback para UTF-8 com replacement
    return iconv.decode(sample, 'utf8');
  }
}

/**
 * Lê o arquivo completo
 */
async function readFullFile(filePath: string, encoding: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  
  try {
    let content = iconv.decode(buffer, encoding);
    
    // Remover BOM se presente
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }
    
    // Normalizar quebras de linha
    content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    return content;
  } catch (error) {
    // Fallback
    return buffer.toString('utf8');
  }
}

/**
 * Detecta o delimitador mais provável
 */
function detectDelimiter(
  content: string,
  forceDelimiter?: string,
  debug: boolean = true
): string {
  if (forceDelimiter) {
    if (debug) {
      console.log(`📋 Delimitador forçado: '${forceDelimiter}'`);
    }
    return forceDelimiter;
  }

  // Lista completa de delimitadores possíveis
  const delimiters = [';', ',', '\t', '|', ':', ' ', '-', '*', '~', '^', '#'];
  
  const lines = content.split('\n').slice(0, 10).filter(line => line.trim());
  
  if (lines.length === 0) {
    return ','; // Default
  }

  let bestDelimiter = ',';
  let maxScore = 0;

  for (const delimiter of delimiters) {
    let score = 0;
    const columnCounts: number[] = [];

    for (const line of lines) {
      if (line.includes(delimiter)) {
        const parts = line.split(delimiter);
        const columns = parts.length;
        columnCounts.push(columns);
        
        // Pontuar baseado no número de colunas
        if (columns > 1) {
          score += columns;
        }
      }
    }

    if (columnCounts.length === 0) continue;

    // Calcular consistência
    const avgColumns = columnCounts.reduce((a, b) => a + b, 0) / columnCounts.length;
    const consistency = columnCounts.filter(count => 
      Math.abs(count - avgColumns) <= 1
    ).length / columnCounts.length;

    score *= consistency;

    // Bonificar delimitadores mais comuns
    if (delimiter === ';' || delimiter === ',') {
      score *= 1.5;
    } else if (delimiter === '\t') {
      score *= 1.3;
    } else if (delimiter === '|') {
      score *= 1.1;
    }

    // Penalizar espaços se muitas colunas
    if (delimiter === ' ' && avgColumns > 10) {
      score *= 0.5;
    }

    if (score > maxScore && avgColumns > 1) {
      maxScore = score;
      bestDelimiter = delimiter;
    }
  }

  if (debug) {
    const displayDelimiter = bestDelimiter === '\t' ? 'TAB' : bestDelimiter;
    console.log(`📋 Delimitador detectado: '${displayDelimiter}'`);
  }

  return bestDelimiter;
}

/**
 * Detecta se há cabeçalho
 */
function detectHeader(
  content: string,
  delimiter: string,
  debug: boolean = true
): boolean {
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    return false;
  }

  const firstRow = lines[0].split(delimiter);
  const secondRow = lines[1].split(delimiter);

  // Se número de colunas muito diferente
  if (Math.abs(firstRow.length - secondRow.length) > 2) {
    return false;
  }

  let headerScore = 0;
  let dataScore = 0;

  // Analisar primeira linha (potencial cabeçalho)
  firstRow.forEach(cell => {
    const cleaned = cell.trim().replace(/['"]/g, '');
    
    // Características de cabeçalho
    if (/^[a-zA-Z_][a-zA-Z0-9_\s\-]*$/.test(cleaned)) {
      headerScore += 2;
    }
    
    if (!/^\d+([.,]\d+)*$/.test(cleaned) && cleaned.length > 0) {
      headerScore += 1;
    }
    
    // Palavras comuns em headers
    const commonHeaders = [
      'data', 'nome', 'valor', 'preco', 'quantidade', 'total',
      'ativo', 'tipo', 'resultado', 'id', 'codigo', 'descricao',
      'date', 'name', 'value', 'price', 'amount', 'symbol'
    ];
    
    if (commonHeaders.some(word => cleaned.toLowerCase().includes(word))) {
      headerScore += 3;
    }
  });

  // Analisar segunda linha (potencial dados)
  secondRow.forEach(cell => {
    const cleaned = cell.trim().replace(/['"]/g, '');
    
    // Características de dados
    if (/^\d+([.,]\d+)*$/.test(cleaned)) {
      dataScore += 1;
    }
    
    if (/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(cleaned)) {
      dataScore += 2;
    }
  });

  const hasHeader = headerScore > dataScore && headerScore > firstRow.length * 0.4;

  if (debug) {
    console.log(`🏷️ Cabeçalho detectado: ${hasHeader ? 'Sim' : 'Não'} (header: ${headerScore}, data: ${dataScore})`);
  }

  return hasHeader;
}

/**
 * Processa com PapaParse
 */
async function processWithPapaParse(
  content: string,
  delimiter: string,
  hasHeader: boolean,
  debug: boolean
): Promise<ParseResult<any>> {
  return new Promise((resolve, reject) => {
    Papa.parse(content, {
      delimiter: delimiter,
      header: hasHeader,
      skipEmptyLines: 'greedy',
      dynamicTyping: false, // Manter como strings
      trimHeaders: false, // Esta propriedade não existe no PapaParse
      transform: (value: string) => {
        if (typeof value !== 'string') return value;
        
        // Limpar valor
        let cleanValue = value.trim();
        
        // Remover aspas desnecessárias
        if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) ||
            (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
          cleanValue = cleanValue.slice(1, -1);
        }

        // Valores vazios
        if (cleanValue === '' || 
            cleanValue.toLowerCase() === 'null' ||
            cleanValue.toLowerCase() === 'undefined') {
          return null;
        }

        return cleanValue;
      },
      transformHeader: (header: string) => {
        // Limpar headers
        return header
          .trim()
          .replace(/[^\w\s\-_]/g, '')
          .replace(/\s+/g, '_')
          .toLowerCase() || `coluna_${Date.now()}`;
      },
      complete: (results) => {
        resolve(results);
      },
      error: (error) => {
        reject(new Error(`Erro no parsing: ${error.message}`));
      }
    });
  });
}

/**
 * Limpa os dados do CSV
 */
function cleanCSVData(data: any[], debug: boolean): any[] {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  const originalLength = data.length;

  // Filtrar linhas vazias
  const cleanedData = data.filter(row => {
    if (!row || typeof row !== 'object') return false;
    
    // Verificar se tem pelo menos um valor não vazio
    return Object.values(row).some(value => 
      value !== null && 
      value !== undefined && 
      value !== '' && 
      String(value).trim() !== ''
    );
  });

  if (debug && cleanedData.length !== originalLength) {
    console.log(`🧹 Dados limpos: ${originalLength} → ${cleanedData.length} linhas`);
  }

  return cleanedData;
}

/**
 * Gera sugestões de correção baseadas no erro
 */
function getErrorSuggestions(error: string, filePath: string): string[] {
  const suggestions: string[] = [];

  if (error.includes('encoding') || error.includes('decode')) {
    suggestions.push("Tente forçar o encoding: forceEncoding: 'utf8' ou 'iso88591'");
    suggestions.push("Verifique se o arquivo não está corrompido");
  }

  if (error.includes('delimiter') || error.includes('separator')) {
    suggestions.push("Especifique o delimitador: forceDelimiter: ';' ou ','");
    suggestions.push("Verifique a estrutura do arquivo CSV");
  }

  if (error.includes('empty') || error.includes('vazio')) {
    suggestions.push("Confirme que o arquivo contém dados");
    suggestions.push("Verifique se todas as linhas não estão em branco");
  }

  if (error.includes('not found') || error.includes('não encontrado')) {
    suggestions.push("Confirme o caminho do arquivo");
    suggestions.push("Verifique se o arquivo existe no local especificado");
  }

  // Verificar tamanho do arquivo
  try {
    const stats = fs.statSync(filePath);
    if (stats.size > 100 * 1024 * 1024) { // > 100MB
      suggestions.push("Arquivo muito grande - considere processamento em partes");
    }
  } catch {
    // Arquivo pode não existir
  }

  return suggestions;
}

/**
 * Analisa o formato de um CSV sem processá-lo completamente
 */
export async function analyzeCSVFormat(filePath: string): Promise<CSVFormatAnalysis> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo não encontrado: ${filePath}`);
  }

  const stats = fs.statSync(filePath);
  const fileSize = stats.size;
  
  // Detectar encoding
  const encoding = await detectEncoding(filePath, undefined, 10240, false);
  
  // Ler amostra
  const sample = await readSample(filePath, encoding, 10240);
  
  // Detectar delimitador
  const delimiter = detectDelimiter(sample, undefined, false);
  
  // Detectar cabeçalho
  const hasHeader = detectHeader(sample, delimiter, false);
  
  // Estimar número de linhas
  const estimatedRows = sample.split('\n').filter(line => line.trim()).length;
  
  // Extrair colunas
  const lines = sample.split('\n').filter(line => line.trim());
  const firstLine = lines[0] || '';
  const columns = firstLine.split(delimiter).map((col, index) => 
    hasHeader ? col.trim().replace(/['"]/g, '') : `coluna_${index + 1}`
  );

  return {
    encoding,
    delimiter: delimiter === '\t' ? 'TAB' : delimiter,
    hasHeader,
    estimatedRows,
    columns,
    fileSize,
    sample: sample.substring(0, 500) + (sample.length > 500 ? '...' : '')
  };
}

/**
 * Função de teste
 */
export async function testUniversalCSVReader(): Promise<void> {
  console.log('🧪 Testando leitor universal de CSV...\n');

  // Criar arquivos de teste
  const testFiles = {
    'test_semicolon.csv': 'Nome;Idade;Cidade\nJoão;30;São Paulo\nMaria;25;Rio de Janeiro',
    'test_comma.csv': 'Name,Age,City\nJohn,30,New York\nMary,25,Los Angeles',
    'test_tab.csv': 'Nome\tIdade\tCidade\nJoão\t30\tSão Paulo\nMaria\t25\tRio de Janeiro',
    'test_pipe.csv': 'Nome|Idade|Cidade\nJoão|30|São Paulo\nMaria|25|Rio de Janeiro'
  };

  for (const [filename, content] of Object.entries(testFiles)) {
    try {
      // Criar arquivo de teste
      fs.writeFileSync(filename, content, 'utf8');

      console.log(`📝 Testando: ${filename}`);
      console.log('-'.repeat(50));

      // Analisar formato
      const analysis = await analyzeCSVFormat(filename);
      console.log('📊 Análise:', analysis);

      // Ler arquivo
      const result = await readCSVUniversal(filename, { debug: false });
      console.log('📋 Dados:');
      console.table(result.data);

      console.log('ℹ️ Metadados:', result.meta);
      console.log();

      // Remover arquivo de teste
      fs.unlinkSync(filename);

    } catch (error) {
      console.error(`❌ Erro em ${filename}:`, error instanceof Error ? error.message : error);
    }
  }
}

// Export da função principal
export { readCSVUniversal as default };