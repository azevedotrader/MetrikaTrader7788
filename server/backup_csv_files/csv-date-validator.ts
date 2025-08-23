/**
 * Validação Obrigatória de Datas em CSV
 * ====================================
 * 
 * Valida se o CSV possui pelo menos uma coluna de datas válidas
 * antes de processar o arquivo.
 */

import Papa from 'papaparse';
import { parse as parseDate, isValid } from 'date-fns';
import fs from 'fs';
import chardet from 'chardet';

export interface DateValidationResult {
  isValid: boolean;
  dateColumn: string | null;
  dateFormat: string | null;
  validDatesCount: number;
  totalRows: number;
  error?: string;
  sampleDates?: string[];
}

// Possíveis nomes de colunas de data (expandido para ser universal)
const DATE_COLUMN_NAMES = [
  'data',
  'data/hora', 
  'datahora',
  'date',
  'trade date',
  'tradedate',
  'timestamp',
  'datetime',
  'data_operacao',
  'data operacao',
  'data_trade',
  'data trade',
  'hora',
  'time',
  'fechamento',
  'abertura',
  'entrada',
  'saida',
  'execucao',
  'operacao',
  'negociacao',
  'transacao',
  'periodo',
  'dia',
  'mes',
  'ano',
  'quando',
  'timing',
  'created',
  'updated',
  'modified',
  'processed',
  'executed',
  'filled',
  'momento',
  'instante',
  'tempo'
];

// Formatos de data aceitos (expandido para máxima compatibilidade)
const DATE_FORMATS = [
  // Formatos brasileiros mais comuns
  'dd/MM/yyyy',           // 25/12/2024
  'dd/MM/yyyy HH:mm',     // 25/12/2024 14:30
  'dd/MM/yyyy HH:mm:ss',  // 25/12/2024 14:30:45
  'dd/MM/yy',             // 25/12/24
  'dd/MM/yy HH:mm',       // 25/12/24 14:30
  
  // Formatos ISO
  'yyyy-MM-dd',           // 2024-12-25
  'yyyy-MM-dd HH:mm:ss',  // 2024-12-25 14:30:45
  'yyyy-MM-dd HH:mm',     // 2024-12-25 14:30
  'yyyyMMdd',             // 20241225
  'yyyy/MM/dd',           // 2024/12/25
  
  // Formatos com hífen
  'dd-MM-yyyy',           // 25-12-2024
  'dd-MM-yyyy HH:mm',     // 25-12-2024 14:30
  'dd-MM-yyyy HH:mm:ss',  // 25-12-2024 14:30:45
  'dd-MM-yy',             // 25-12-24
  'MM-dd-yyyy',           // 12-25-2024
  
  // Formatos americanos
  'MM/dd/yyyy',           // 12/25/2024
  'MM/dd/yyyy HH:mm',     // 12/25/2024 14:30
  'MM/dd/yyyy HH:mm:ss',  // 12/25/2024 14:30:45
  'MM/dd/yy',             // 12/25/24
  
  // Formatos com ponto
  'dd.MM.yyyy',           // 25.12.2024
  'dd.MM.yyyy HH:mm',     // 25.12.2024 14:30
  'dd.MM.yyyy HH:mm:ss',  // 25.12.2024 14:30:45
  'dd.MM.yy',             // 25.12.24
  'MM.dd.yyyy',           // 12.25.2024
  
  // Formatos com espaços
  'dd MM yyyy',           // 25 12 2024
  'yyyy MM dd',           // 2024 12 25
  'MM dd yyyy',           // 12 25 2024
  
  // Formatos de timestamp
  'yyyy-MM-dd\'T\'HH:mm:ss',    // 2024-12-25T14:30:45
  'yyyy-MM-dd\'T\'HH:mm:ss.SSS', // 2024-12-25T14:30:45.123
  'yyyy-MM-dd\'T\'HH:mm:ss\'Z\'', // 2024-12-25T14:30:45Z
  
  // Formatos exóticos que podem aparecer
  'dd MMM yyyy',          // 25 Dec 2024
  'MMM dd yyyy',          // Dec 25 2024
  'yyyy MMM dd',          // 2024 Dec 25
];

/**
 * Valida se o CSV possui colunas de data obrigatórias e datas válidas
 */
export async function validateRequiredDateColumns(filePath: string): Promise<DateValidationResult> {
  console.log(`🗓️ Iniciando validação obrigatória de datas para: ${filePath}`);
  
  try {
    // 1. Ler o arquivo CSV com detecção inteligente de delimitador
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    // Detectar encoding automaticamente e ler arquivo
    const buffer = fs.readFileSync(filePath);
    const detectedEncoding = chardet.detect(buffer);
    let encoding: BufferEncoding = 'utf-8';
    
    if (detectedEncoding) {
      if (detectedEncoding.toLowerCase().includes('utf')) {
        encoding = 'utf-8';
      } else if (detectedEncoding.toLowerCase().includes('latin') || detectedEncoding.toLowerCase().includes('iso')) {
        encoding = 'latin1';
      } else if (detectedEncoding.toLowerCase().includes('windows') || detectedEncoding.toLowerCase().includes('cp1252')) {
        encoding = 'latin1';
      }
    }
    
    console.log(`🔍 Encoding detectado: ${detectedEncoding} → usando: ${encoding}`);
    
    let csvContent: string;
    try {
      csvContent = buffer.toString(encoding);
    } catch (error) {
      console.log('🔄 Fallback para utf-8...');
      csvContent = buffer.toString('utf-8');
    }

    // Detectar delimitador automaticamente testando múltiplas opções
    const delimiters = [';', ',', '\t', '|', ':'];
    let bestParseResult: any = null;
    let bestDelimiter = ',';
    let maxColumns = 0;

    console.log(`🔍 Testando delimitadores para detectar estrutura CSV...`);
    
    for (const delimiter of delimiters) {
      try {
        const testResult = Papa.parse(csvContent, {
          delimiter,
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
          transformHeader: (header: string) => header.trim().toLowerCase()
        });

        if (testResult.data && testResult.data.length > 0) {
          const headers = Object.keys(testResult.data[0] as any);
          const columnCount = headers.length;
          
          console.log(`   Delimitador '${delimiter}': ${columnCount} colunas (${headers.join(', ')})`);
          
          if (columnCount > maxColumns) {
            maxColumns = columnCount;
            bestDelimiter = delimiter;
            bestParseResult = testResult;
          }
        }
      } catch (error) {
        console.log(`   Delimitador '${delimiter}': erro ao parsear`);
      }
    }

    const parseResult = bestParseResult;
    console.log(`✅ Melhor delimitador detectado: '${bestDelimiter}' com ${maxColumns} colunas`);

    if (!parseResult.data || parseResult.data.length === 0) {
      return {
        isValid: false,
        dateColumn: null,
        dateFormat: null,
        validDatesCount: 0,
        totalRows: 0,
        error: "Arquivo CSV vazio ou sem dados válidos"
      };
    }

    const data = parseResult.data as Record<string, string>[];
    const headers = Object.keys(data[0] || {});
    
    console.log(`📋 Headers encontrados: ${headers.join(', ')}`);
    console.log(`📊 Total de linhas de dados: ${data.length}`);

    // 2. Busca UNIVERSAL de datas - procurar em TODAS as colunas
    console.log(`🔍 Modo universal: procurando datas em TODAS as colunas disponíveis...`);
    
    let bestDateColumn: string | null = null;
    let bestValidationResult = { validDatesCount: 0, dateFormat: null as string | null };
    
    // Primeiro, tentar colunas com nomes suspeitos de data
    const dateColumn = findDateColumn(headers);
    if (dateColumn) {
      console.log(`🎯 Coluna de data candidata encontrada: "${dateColumn}"`);
      bestValidationResult = validateDatesInColumn(data, dateColumn);
      if (bestValidationResult.validDatesCount > 0) {
        bestDateColumn = dateColumn;
      }
    }
    
    // Se não encontrou datas nas colunas óbvias, PROCURAR EM TODAS as colunas
    if (bestValidationResult.validDatesCount === 0) {
      console.log(`🔍 Nenhuma data nas colunas óbvias. Procurando em TODAS as ${headers.length} colunas...`);
      
      for (const header of headers) {
        if (header === dateColumn) continue; // Já testamos
        
        console.log(`   🔎 Testando coluna: "${header}"`);
        const testResult = validateDatesInColumn(data, header);
        
        if (testResult.validDatesCount > bestValidationResult.validDatesCount) {
          bestValidationResult = testResult;
          bestDateColumn = header;
          console.log(`     ✅ Melhor resultado até agora: ${testResult.validDatesCount} datas válidas`);
        }
      }
    }
    
    // 3. Detectar relatórios de performance (não são trades válidos)
    const performanceKeywords = [
      'saldo líquido', 'saldo total', 'lucro bruto', 'prejuízo bruto',
      'fator de lucro', 'número total de operações', 'percentual de operações',
      'operações vencedoras', 'operações perdedoras', 'média de lucro',
      'maior operação', 'maior sequência', 'patrimônio necessário',
      'retorno no capital', 'drawdown', 'declínio máximo',
      'data inicial', 'data final', 'conta', 'titular'
    ];
    
    // Verificar se é um arquivo de relatório de performance
    const contentLowerCase = csvContent.toLowerCase();
    let performanceKeywordCount = 0;
    
    for (const keyword of performanceKeywords) {
      if (contentLowerCase.includes(keyword)) {
        performanceKeywordCount++;
      }
    }
    
    // Se encontrou muitas palavras-chave de performance, é um relatório
    if (performanceKeywordCount >= 5) {
      console.log(`❌ Arquivo identificado como relatório de performance (${performanceKeywordCount} palavras-chave encontradas)`);
      console.log(`🔍 Palavras-chave detectadas: ${performanceKeywords.filter(kw => contentLowerCase.includes(kw)).join(', ')}`);
      
      return {
        isValid: false,
        dateColumn: null,
        dateFormat: null,
        validDatesCount: 0,
        totalRows: data.length,
        error: `❌ ARQUIVO DE RELATÓRIO DE PERFORMANCE DETECTADO\n\n` +
               `Este arquivo contém apenas estatísticas gerais de performance, não trades individuais.\n\n` +
               `📊 Dados encontrados:\n` +
               `• Saldo líquido/total, lucro/prejuízo bruto\n` +
               `• Número total de operações, percentuais\n` +
               `• Drawdowns, patrimônio, etc.\n\n` +
               `💡 Para importar trades, você precisa de um arquivo com:\n` +
               `• Data/hora de cada trade individual\n` +
               `• Ativo, preço, quantidade, resultado\n` +
               `• Uma linha por operação realizada\n\n` +
               `📁 Procure por arquivos como:\n` +
               `• "Histórico de Operações"\n` +
               `• "Extrato de Trades"\n` +
               `• "Relatório de Negócios"`
      };
    }
    
    // 4. Se só tem 1 coluna, pode ser problema de delimitador - buscar padrões de data no conteúdo bruto
    if (headers.length === 1 && bestValidationResult.validDatesCount === 0) {
      console.log(`⚠️ Apenas 1 coluna detectada. Procurando padrões de data no conteúdo bruto...`);
      
      // Buscar padrões de data diretamente no texto bruto
      const datePatterns = [
        /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,      // dd/MM/yyyy ou MM/dd/yyyy
        /\b\d{4}-\d{1,2}-\d{1,2}\b/g,        // yyyy-MM-dd
        /\b\d{1,2}-\d{1,2}-\d{4}\b/g,        // dd-MM-yyyy
        /\b\d{1,2}\.\d{1,2}\.\d{4}\b/g,      // dd.MM.yyyy
        /\b\d{1,2}\/\d{1,2}\/\d{2}\b/g,      // dd/MM/yy
      ];
      
      let foundDatesInRawContent = 0;
      for (const pattern of datePatterns) {
        const matches = csvContent.match(pattern);
        if (matches) {
          foundDatesInRawContent += matches.length;
          console.log(`   Padrão ${pattern.source}: ${matches.length} matches (ex: ${matches[0]})`);
        }
      }
      
      if (foundDatesInRawContent > 0) {
        console.log(`✅ Encontradas ${foundDatesInRawContent} datas no conteúdo bruto. Arquivo provavelmente contém dados válidos.`);
        
        // Aceitar o arquivo mesmo sem estrutura clara de colunas
        return {
          isValid: true,
          dateColumn: 'conteudo_bruto_com_datas',
          dateFormat: 'multiplos_formatos_detectados',
          validDatesCount: foundDatesInRawContent,
          totalRows: data.length,
          sampleDates: ['Datas encontradas no conteúdo bruto']
        };
      }
    }
    
    // 5. Decisão final: só rejeitar se REALMENTE não houver datas
    if (bestValidationResult.validDatesCount === 0) {
      const availableHeaders = headers.join(', ');
      return {
        isValid: false,
        dateColumn: null,
        dateFormat: null,
        validDatesCount: 0,
        totalRows: data.length,
        error: `❌ NENHUMA DATA VÁLIDA ENCONTRADA EM TODO O ARQUIVO\n\n` +
               `O sistema procurou datas em TODAS as ${headers.length} colunas disponíveis.\n\n` +
               `Colunas verificadas: ${availableHeaders}\n\n` +
               `Delimitador testado: '${bestDelimiter}'\n\n` +
               `Formatos testados:\n` +
               `• dd/MM/yyyy, dd/MM/yyyy HH:mm\n` +
               `• yyyy-MM-dd, dd-MM-yyyy\n` +
               `• MM/dd/yyyy, dd.MM.yyyy\n` +
               `• E mais 30+ formatos\n\n` +
               `💡 Verifique se o arquivo realmente contém datas de trades.\n` +
               `💡 Arquivo pode ter delimitador diferente ou formato especial.`
      };
    }

    console.log(`✅ Datas encontradas na coluna: "${bestDateColumn}"`);

    // 5. Usar o melhor resultado encontrado
    const validationResult = bestValidationResult;
    
    // Esta verificação foi movida para cima, pois agora verificamos todas as colunas

    // 6. Sucesso na validação
    console.log(`✅ Validação de datas concluída com sucesso!`);
    console.log(`   Coluna: "${bestDateColumn}"`);
    console.log(`   Formato detectado: "${validationResult.dateFormat}"`);
    console.log(`   Datas válidas: ${validationResult.validDatesCount}/${data.length}`);

    return {
      isValid: true,
      dateColumn: bestDateColumn,
      dateFormat: validationResult.dateFormat,
      validDatesCount: validationResult.validDatesCount,
      totalRows: data.length,
      sampleDates: data.slice(0, 3).map(row => row[bestDateColumn!]).filter(Boolean)
    };

  } catch (error) {
    console.error(`❌ Erro na validação de datas:`, error);
    return {
      isValid: false,
      dateColumn: null,
      dateFormat: null,
      validDatesCount: 0,
      totalRows: 0,
      error: `Erro ao validar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}

/**
 * Procura uma coluna de data nos headers
 */
function findDateColumn(headers: string[]): string | null {
  const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
  
  for (const dateColumnName of DATE_COLUMN_NAMES) {
    const found = normalizedHeaders.find(header => 
      header === dateColumnName || 
      header.includes(dateColumnName) ||
      dateColumnName.includes(header)
    );
    
    if (found) {
      // Retornar o header original (não normalizado)
      const originalIndex = normalizedHeaders.indexOf(found);
      return headers[originalIndex];
    }
  }
  
  return null;
}

/**
 * Valida as datas em uma coluna específica
 */
function validateDatesInColumn(data: Record<string, string>[], dateColumn: string): {
  validDatesCount: number;
  dateFormat: string | null;
} {
  let validDatesCount = 0;
  let detectedFormat: string | null = null;
  
  // Testar até 20 linhas para detectar formato
  const sampleSize = Math.min(data.length, 20);
  
  for (let i = 0; i < sampleSize; i++) {
    const dateValue = data[i][dateColumn]?.trim();
    
    if (!dateValue || dateValue === '' || dateValue === '-') {
      continue;
    }
    
    // Tentar parsear com cada formato
    for (const format of DATE_FORMATS) {
      try {
        const parsedDate = parseDate(dateValue, format, new Date());
        
        if (isValid(parsedDate)) {
          validDatesCount++;
          if (!detectedFormat) {
            detectedFormat = format;
            console.log(`🎯 Formato de data detectado: "${format}" (exemplo: "${dateValue}")`);
          }
          break; // Encontrou formato válido, pular para próxima linha
        }
      } catch (error) {
        // Ignorar erro e tentar próximo formato
      }
    }
  }
  
  // Se encontrou pelo menos 1 data válida na amostra, validar o resto
  if (validDatesCount > 0 && detectedFormat) {
    // Validar todas as linhas com o formato detectado
    validDatesCount = 0;
    for (const row of data) {
      const dateValue = row[dateColumn]?.trim();
      
      if (!dateValue || dateValue === '' || dateValue === '-') {
        continue;
      }
      
      try {
        const parsedDate = parseDate(dateValue, detectedFormat, new Date());
        if (isValid(parsedDate)) {
          validDatesCount++;
        }
      } catch (error) {
        // Data inválida, continuar
      }
    }
  }
  
  return {
    validDatesCount,
    dateFormat: detectedFormat
  };
}