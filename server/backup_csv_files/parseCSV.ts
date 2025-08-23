import * as fs from 'fs';
import Papa from 'papaparse';
import * as chardet from 'chardet';
import * as iconv from 'iconv-lite';

/**
 * Configuração para parsing de CSV
 */
interface ParseCSVOptions {
  /** Forçar um delimitador específico (opcional) */
  delimiter?: string;
  /** Forçar uma codificação específica (opcional) */
  encoding?: string;
  /** Indicar se há cabeçalho (auto-detectado se não especificado) */
  hasHeader?: boolean;
  /** Número máximo de linhas para análise de detecção */
  sampleSize?: number;
}

/**
 * Resultado do parsing do CSV
 */
interface ParseCSVResult {
  /** Dados parseados */
  data: any[];
  /** Informações sobre a detecção automática */
  meta: {
    delimiter: string;
    encoding: string;
    hasHeader: boolean;
    totalRows: number;
    totalColumns: number;
    errors: string[];
  };
}

/**
 * Função universal para parsing de CSV com detecção automática completa
 * 
 * @param content - Conteúdo do CSV como string ou caminho do arquivo
 * @param options - Opções de configuração (todas opcionais)
 * @returns Objeto com dados parseados e metadados
 */
export function parseCSV(
  content: string, 
  options: ParseCSVOptions = {}
): ParseCSVResult {
  try {
    // 1. Determinar se é arquivo ou conteúdo
    let csvContent: string;
    let detectedEncoding = 'utf8';

    if (fs.existsSync(content)) {
      // É um caminho de arquivo
      console.log(`📂 Lendo arquivo: ${content}`);
      
      // Detectar codificação automaticamente
      const buffer = fs.readFileSync(content);
      detectedEncoding = options.encoding || chardet.detect(buffer) || 'utf8';
      
      // Decodificar com a codificação detectada
      if (iconv.encodingExists(detectedEncoding)) {
        csvContent = iconv.decode(buffer, detectedEncoding);
      } else {
        console.warn(`⚠️ Codificação ${detectedEncoding} não suportada, usando UTF-8`);
        csvContent = iconv.decode(buffer, 'utf8');
        detectedEncoding = 'utf8';
      }
    } else {
      // É conteúdo direto
      csvContent = content;
      detectedEncoding = options.encoding || 'utf8';
    }

    console.log(`🔤 Codificação detectada: ${detectedEncoding}`);

    // 2. Limpeza inicial do conteúdo
    csvContent = cleanCSVContent(csvContent);

    if (!csvContent || csvContent.trim().length === 0) {
      return {
        data: [],
        meta: {
          delimiter: '',
          encoding: detectedEncoding,
          hasHeader: false,
          totalRows: 0,
          totalColumns: 0,
          errors: ['Arquivo CSV vazio ou inválido']
        }
      };
    }

    // 3. Detectar delimitador automaticamente
    const detectedDelimiter = options.delimiter || detectDelimiter(csvContent);
    console.log(`📊 Delimitador detectado: '${detectedDelimiter}'`);

    // 4. Detectar se há cabeçalho
    const hasHeader = options.hasHeader !== undefined 
      ? options.hasHeader 
      : detectHeader(csvContent, detectedDelimiter);
    
    console.log(`🏷️ Cabeçalho detectado: ${hasHeader ? 'Sim' : 'Não'}`);

    // 5. Parse com PapaParse usando configurações otimizadas
    const parseResult = Papa.parse<any>(csvContent, {
      delimiter: detectedDelimiter,
      header: hasHeader,
      skipEmptyLines: 'greedy' as const, // Remove linhas completamente vazias
      dynamicTyping: false, // Manter como strings para controle manual
      trimHeaders: true,
      
      // Função para limpar headers
      transformHeader: (header: string, index: number) => {
        const cleaned = header
          .trim()
          .replace(/[^\w\s\-_]/g, '') // Remove caracteres especiais
          .replace(/\s+/g, '_') // Substitui espaços por underscore
          .toLowerCase();
        
        return cleaned || `coluna_${index + 1}`;
      },

      // Função para processar cada valor
      transform: (value: string, field: string | number) => {
        if (typeof value !== 'string') return value;
        
        // Limpar o valor
        let cleanValue = value.trim();
        
        // Remover aspas desnecessárias
        if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) ||
            (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
          cleanValue = cleanValue.slice(1, -1);
        }

        // Normalizar valores vazios
        if (cleanValue === '' || cleanValue.toLowerCase() === 'null' || 
            cleanValue.toLowerCase() === 'undefined') {
          return null;
        }

        return cleanValue;
      }
    });

    // 6. Processar erros
    const errors: string[] = [];
    if (parseResult.errors && parseResult.errors.length > 0) {
      parseResult.errors.forEach((error: any) => {
        const row = typeof error.row === 'number' ? error.row + 1 : 'desconhecida';
        errors.push(`Linha ${row}: ${error.message}`);
      });
    }

    // 7. Processar dados de saída
    let processedData = parseResult.data || [];
    
    // Filtrar linhas completamente vazias
    processedData = processedData.filter((row: any) => {
      if (Array.isArray(row)) {
        return row.some(cell => cell !== null && cell !== undefined && cell !== '');
      } else if (typeof row === 'object' && row !== null) {
        return Object.values(row).some(value => value !== null && value !== undefined && value !== '');
      }
      return false;
    });

    // 8. Calcular estatísticas
    const totalRows = processedData.length;
    let totalColumns = 0;

    if (totalRows > 0) {
      if (Array.isArray(processedData[0])) {
        totalColumns = Math.max(...processedData.map((row: any[]) => row.length));
      } else if (typeof processedData[0] === 'object') {
        totalColumns = Object.keys(processedData[0]).length;
      }
    }

    console.log(`📈 Dados processados: ${totalRows} linhas, ${totalColumns} colunas`);

    return {
      data: processedData,
      meta: {
        delimiter: detectedDelimiter,
        encoding: detectedEncoding,
        hasHeader,
        totalRows,
        totalColumns,
        errors
      }
    };

  } catch (error) {
    console.error('❌ Erro no parseCSV:', error);
    
    return {
      data: [],
      meta: {
        delimiter: '',
        encoding: 'utf8',
        hasHeader: false,
        totalRows: 0,
        totalColumns: 0,
        errors: [`Erro de parsing: ${error instanceof Error ? error.message : 'Erro desconhecido'}`]
      }
    };
  }
}

/**
 * Limpa o conteúdo CSV removendo caracteres problemáticos
 */
function cleanCSVContent(content: string): string {
  // Remove BOM (Byte Order Mark)
  content = content.replace(/^\uFEFF/, '');
  
  // Normaliza quebras de linha
  content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Remove caracteres de controle invisíveis (exceto \n e \t)
  content = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Remove linhas que são apenas espaços em branco
  content = content
    .split('\n')
    .filter(line => line.trim().length > 0)
    .join('\n');
  
  return content.trim();
}

/**
 * Detecta automaticamente o delimitador mais provável
 */
function detectDelimiter(content: string): string {
  const delimiters = [';', ',', '\t', '|', ':', ' '];
  const sample = content.split('\n').slice(0, 10).join('\n'); // Amostra das primeiras 10 linhas
  
  let bestDelimiter = ',';
  let maxScore = 0;

  for (const delimiter of delimiters) {
    const lines = sample.split('\n');
    let score = 0;
    let consistency = 0;
    const columnCounts: number[] = [];

    // Analisar cada linha
    for (const line of lines) {
      if (line.trim()) {
        const columns = line.split(delimiter).length;
        columnCounts.push(columns);
        
        // Pontuar baseado no número de colunas
        if (columns > 1) {
          score += columns;
        }
      }
    }

    // Calcular consistência (mesma quantidade de colunas)
    if (columnCounts.length > 0) {
      const avgColumns = columnCounts.reduce((a, b) => a + b, 0) / columnCounts.length;
      consistency = columnCounts.filter(count => Math.abs(count - avgColumns) <= 1).length / columnCounts.length;
      score *= consistency;
    }

    // Bonificar delimitadores mais comuns
    if (delimiter === ';' || delimiter === ',') {
      score *= 1.2;
    } else if (delimiter === '\t') {
      score *= 1.1;
    }

    // Penalizar espaços como delimitador se há muitas colunas
    if (delimiter === ' ' && score > 20) {
      score *= 0.5;
    }

    if (score > maxScore) {
      maxScore = score;
      bestDelimiter = delimiter;
    }
  }

  return bestDelimiter;
}

/**
 * Detecta se a primeira linha é um cabeçalho
 */
function detectHeader(content: string, delimiter: string): boolean {
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    return false;
  }

  const firstRow = lines[0].split(delimiter);
  const secondRow = lines[1].split(delimiter);

  // Se número de colunas diferente, provavelmente não há header padrão
  if (Math.abs(firstRow.length - secondRow.length) > 1) {
    return false;
  }

  // Verificar se primeira linha tem características de header
  let headerScore = 0;
  let dataScore = 0;

  firstRow.forEach(cell => {
    const cleaned = cell.trim().replace(/['"]/g, '');
    
    // Headers geralmente:
    // - Não são números puros
    // - Contêm texto descritivo
    // - São mais curtos
    if (isNaN(Number(cleaned)) && cleaned.length > 0) {
      headerScore++;
    }
    
    if (/^[a-zA-Z_][a-zA-Z0-9_\s]*$/.test(cleaned)) {
      headerScore += 2;
    }
    
    if (cleaned.length < 50) {
      headerScore++;
    }
  });

  secondRow.forEach(cell => {
    const cleaned = cell.trim().replace(/['"]/g, '');
    
    // Dados geralmente:
    // - Podem ser números
    // - Contêm valores variados
    if (!isNaN(Number(cleaned)) || cleaned.includes('/') || cleaned.includes('-')) {
      dataScore++;
    }
  });

  // Se primeira linha parece header e segunda parece dados
  return (headerScore > dataScore) && (headerScore > firstRow.length * 0.6);
}

/**
 * Função utilitária para ler arquivo CSV diretamente
 */
export function parseCSVFile(
  filePath: string, 
  options: ParseCSVOptions = {}
): ParseCSVResult {
  return parseCSV(filePath, options);
}

/**
 * Função utilitária para debug - mostra amostra dos dados
 */
export function previewCSV(
  content: string, 
  maxRows: number = 5
): void {
  const result = parseCSV(content, { sampleSize: maxRows + 1 });
  
  console.log('\n📋 === PREVIEW CSV ===');
  console.log(`📊 Meta: ${JSON.stringify(result.meta, null, 2)}`);
  console.log(`📄 Primeiras ${Math.min(maxRows, result.data.length)} linhas:`);
  
  result.data.slice(0, maxRows).forEach((row, index) => {
    console.log(`${index + 1}:`, row);
  });
  
  if (result.meta.errors.length > 0) {
    console.log(`❌ Erros: ${result.meta.errors.join(', ')}`);
  }
}