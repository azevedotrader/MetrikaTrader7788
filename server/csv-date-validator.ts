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

export interface DateValidationResult {
  isValid: boolean;
  dateColumn: string | null;
  dateFormat: string | null;
  validDatesCount: number;
  totalRows: number;
  error?: string;
  sampleDates?: string[];
}

// Possíveis nomes de colunas de data
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
  'time'
];

// Formatos de data aceitos
const DATE_FORMATS = [
  'dd/MM/yyyy',           // 25/12/2024
  'dd/MM/yyyy HH:mm',     // 25/12/2024 14:30
  'dd/MM/yyyy HH:mm:ss',  // 25/12/2024 14:30:45
  'yyyy-MM-dd',           // 2024-12-25
  'yyyy-MM-dd HH:mm:ss',  // 2024-12-25 14:30:45
  'yyyy-MM-dd HH:mm',     // 2024-12-25 14:30
  'dd-MM-yyyy',           // 25-12-2024
  'dd-MM-yyyy HH:mm',     // 25-12-2024 14:30
  'MM/dd/yyyy',           // 12/25/2024
  'MM/dd/yyyy HH:mm',     // 12/25/2024 14:30
  'dd.MM.yyyy',           // 25.12.2024
  'dd.MM.yyyy HH:mm',     // 25.12.2024 14:30
  'yyyyMMdd',             // 20241225
  'dd/MM/yy',             // 25/12/24
  'dd-MM-yy',             // 25-12-24
  'MM/dd/yy',             // 12/25/24
];

/**
 * Valida se o CSV possui colunas de data obrigatórias e datas válidas
 */
export async function validateRequiredDateColumns(filePath: string): Promise<DateValidationResult> {
  console.log(`🗓️ Iniciando validação obrigatória de datas para: ${filePath}`);
  
  try {
    // 1. Ler o arquivo CSV
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    const csvContent = fs.readFileSync(filePath, 'utf-8');
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Manter como string para validação
      transformHeader: (header: string) => header.trim().toLowerCase()
    });

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

    // 2. Procurar coluna de data
    const dateColumn = findDateColumn(headers);
    if (!dateColumn) {
      const availableHeaders = headers.join(', ');
      return {
        isValid: false,
        dateColumn: null,
        dateFormat: null,
        validDatesCount: 0,
        totalRows: data.length,
        error: `❌ COLUNA DE DATA OBRIGATÓRIA NÃO ENCONTRADA\n\n` +
               `O arquivo deve conter pelo menos uma coluna de datas com um destes nomes:\n` +
               `${DATE_COLUMN_NAMES.join(', ')}\n\n` +
               `Colunas disponíveis no arquivo: ${availableHeaders}\n\n` +
               `💡 Dica: Renomeie uma coluna para "Data" ou "Date" e tente novamente.`
      };
    }

    console.log(`✅ Coluna de data encontrada: "${dateColumn}"`);

    // 3. Validar datas na coluna
    const validationResult = validateDatesInColumn(data, dateColumn);
    
    if (validationResult.validDatesCount === 0) {
      return {
        isValid: false,
        dateColumn,
        dateFormat: null,
        validDatesCount: 0,
        totalRows: data.length,
        error: `❌ DATAS INVÁLIDAS NA COLUNA "${dateColumn}"\n\n` +
               `Nenhuma data válida foi encontrada na coluna de datas.\n\n` +
               `Formatos aceitos:\n` +
               `• dd/MM/yyyy (ex: 25/12/2024)\n` +
               `• dd/MM/yyyy HH:mm (ex: 25/12/2024 14:30)\n` +
               `• yyyy-MM-dd (ex: 2024-12-25)\n` +
               `• dd-MM-yyyy (ex: 25-12-2024)\n` +
               `• MM/dd/yyyy (ex: 12/25/2024)\n` +
               `• dd.MM.yyyy (ex: 25.12.2024)\n\n` +
               `💡 Verifique se as datas estão no formato correto e tente novamente.`,
        sampleDates: data.slice(0, 5).map(row => row[dateColumn]).filter(Boolean)
      };
    }

    // 4. Sucesso na validação
    console.log(`✅ Validação de datas concluída com sucesso!`);
    console.log(`   Coluna: "${dateColumn}"`);
    console.log(`   Formato detectado: "${validationResult.dateFormat}"`);
    console.log(`   Datas válidas: ${validationResult.validDatesCount}/${data.length}`);

    return {
      isValid: true,
      dateColumn,
      dateFormat: validationResult.dateFormat,
      validDatesCount: validationResult.validDatesCount,
      totalRows: data.length,
      sampleDates: data.slice(0, 3).map(row => row[dateColumn]).filter(Boolean)
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