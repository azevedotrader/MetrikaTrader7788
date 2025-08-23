/**
 * Validador de Datas Obrigatório para CSV
 * =====================================
 * 
 * Garante que todo CSV tenha pelo menos uma coluna de datas válida
 * Suporta múltiplos formatos de data brasileiros e internacionais
 */

import { parse, isValid, format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

export interface DateValidationResult {
  isValid: boolean;
  dateColumn: string | null;
  validDatesCount: number;
  totalRowsChecked: number;
  detectedFormat: string | null;
  errors: string[];
}

/**
 * Formatos de data aceitos (em ordem de prioridade)
 */
const ACCEPTED_DATE_FORMATS = [
  // Formatos brasileiros
  { pattern: 'dd/MM/yyyy', example: '25/12/2024' },
  { pattern: 'dd/MM/yyyy HH:mm', example: '25/12/2024 14:30' },
  { pattern: 'dd/MM/yyyy HH:mm:ss', example: '25/12/2024 14:30:45' },
  { pattern: 'dd-MM-yyyy', example: '25-12-2024' },
  { pattern: 'dd-MM-yyyy HH:mm', example: '25-12-2024 14:30' },
  
  // Formatos ISO
  { pattern: 'yyyy-MM-dd', example: '2024-12-25' },
  { pattern: 'yyyy-MM-dd HH:mm:ss', example: '2024-12-25 14:30:45' },
  { pattern: 'yyyy-MM-dd HH:mm', example: '2024-12-25 14:30' },
  
  // Outros formatos comuns
  { pattern: 'dd.MM.yyyy', example: '25.12.2024' },
  { pattern: 'MM/dd/yyyy', example: '12/25/2024' },
  { pattern: 'yyyy/MM/dd', example: '2024/12/25' },
  
  // Formatos de corretoras específicas
  { pattern: 'dd/MM/yy', example: '25/12/24' },
  { pattern: 'yyyy-MM-ddTHH:mm:ss', example: '2024-12-25T14:30:45' },
  { pattern: 'yyyy-MM-ddTHH:mm:ss.SSS', example: '2024-12-25T14:30:45.123' }
];

/**
 * Possíveis nomes de colunas de data
 */
const DATE_COLUMN_PATTERNS = [
  /^data$/i,
  /^data\/hora$/i,
  /^data\s*hora$/i,
  /^date$/i,
  /^trade\s*date$/i,
  /^data\s*de\s*negocia[çc][ãa]o$/i,
  /^data\s*opera[çc][ãa]o$/i,
  /^hora$/i,
  /^time$/i,
  /^timestamp$/i,
  /^when$/i,
  /^quando$/i,
  /^datetime$/i,
  /^created$/i,
  /^executed$/i
];

/**
 * Tenta parsear uma string de data usando múltiplos formatos
 */
function tryParseDate(dateString: string): { date: Date | null; format: string | null } {
  if (!dateString || typeof dateString !== 'string') {
    return { date: null, format: null };
  }
  
  const trimmed = dateString.trim();
  if (!trimmed) {
    return { date: null, format: null };
  }
  
  // Tentar cada formato
  for (const { pattern } of ACCEPTED_DATE_FORMATS) {
    try {
      const parsedDate = parse(trimmed, pattern, new Date(), { locale: ptBR });
      
      if (isValid(parsedDate)) {
        // Verificar se a data é razoável (não muito no futuro ou muito no passado)
        const now = new Date();
        const yearsDiff = Math.abs(parsedDate.getFullYear() - now.getFullYear());
        
        if (yearsDiff <= 50) { // Máximo 50 anos de diferença
          return { date: parsedDate, format: pattern };
        }
      }
    } catch (error) {
      // Continuar tentando outros formatos
      continue;
    }
  }
  
  // Tentar parsing nativo do JavaScript como último recurso
  try {
    const nativeDate = new Date(trimmed);
    if (isValid(nativeDate)) {
      const now = new Date();
      const yearsDiff = Math.abs(nativeDate.getFullYear() - now.getFullYear());
      
      if (yearsDiff <= 50) {
        return { date: nativeDate, format: 'JavaScript Date' };
      }
    }
  } catch (error) {
    // Falhou em todos os formatos
  }
  
  return { date: null, format: null };
}

/**
 * Identifica possíveis colunas de data baseado no nome
 */
function identifyDateColumns(headers: string[]): string[] {
  const potentialDateColumns: string[] = [];
  
  for (const header of headers) {
    for (const pattern of DATE_COLUMN_PATTERNS) {
      if (pattern.test(header.trim())) {
        potentialDateColumns.push(header);
        break;
      }
    }
  }
  
  return potentialDateColumns;
}

/**
 * Valida se há pelo menos uma coluna de datas válida no CSV
 */
export function validateDateColumn(
  data: any[], 
  headers: string[]
): DateValidationResult {
  console.log(`\n📅 VALIDAÇÃO OBRIGATÓRIA DE DATAS`);
  console.log(`${'='.repeat(50)}`);
  
  const result: DateValidationResult = {
    isValid: false,
    dateColumn: null,
    validDatesCount: 0,
    totalRowsChecked: 0,
    detectedFormat: null,
    errors: []
  };
  
  // 1. Identificar possíveis colunas de data
  const potentialDateColumns = identifyDateColumns(headers);
  console.log(`🔍 Colunas de data identificadas:`, potentialDateColumns);
  
  if (potentialDateColumns.length === 0) {
    console.log(`❌ Nenhuma coluna de data encontrada nos cabeçalhos`);
    console.log(`📋 Cabeçalhos disponíveis:`, headers);
    
    result.errors.push('❌ COLUNA DE DATA OBRIGATÓRIA NÃO ENCONTRADA');
    result.errors.push('📋 Colunas esperadas: "Data", "Data/Hora", "Date", "Trade Date", etc.');
    result.errors.push(`📝 Colunas disponíveis: ${headers.join(', ')}`);
    return result;
  }
  
  // 2. Testar cada coluna de data potencial
  for (const dateColumn of potentialDateColumns) {
    console.log(`\n🧪 Testando coluna: "${dateColumn}"`);
    
    let validDatesInColumn = 0;
    let totalRowsChecked = 0;
    let detectedFormat: string | null = null;
    const formatCounts: { [format: string]: number } = {};
    
    // Testar primeiras 20 linhas para eficiência
    const samplesToTest = Math.min(data.length, 20);
    
    for (let i = 0; i < samplesToTest; i++) {
      const row = data[i];
      const dateValue = row[dateColumn];
      
      if (dateValue != null && dateValue !== '') {
        totalRowsChecked++;
        
        const { date, format } = tryParseDate(String(dateValue));
        
        if (date && format) {
          validDatesInColumn++;
          formatCounts[format] = (formatCounts[format] || 0) + 1;
          
          console.log(`  ✅ Linha ${i + 1}: "${dateValue}" → ${date.toLocaleDateString('pt-BR')}`);
        } else {
          console.log(`  ❌ Linha ${i + 1}: "${dateValue}" → não foi possível parsear`);
        }
      }
    }
    
    // Determinar formato mais comum
    if (Object.keys(formatCounts).length > 0) {
      detectedFormat = Object.entries(formatCounts)
        .sort(([,a], [,b]) => b - a)[0][0];
    }
    
    const successRate = totalRowsChecked > 0 ? (validDatesInColumn / totalRowsChecked) * 100 : 0;
    
    console.log(`📊 Resultados para "${dateColumn}":`);
    console.log(`   - Datas válidas: ${validDatesInColumn}/${totalRowsChecked}`);
    console.log(`   - Taxa de sucesso: ${successRate.toFixed(1)}%`);
    console.log(`   - Formato detectado: ${detectedFormat}`);
    
    // Considerar válida se pelo menos 70% das datas foram parseadas com sucesso
    if (successRate >= 70 && validDatesInColumn >= 3) {
      result.isValid = true;
      result.dateColumn = dateColumn;
      result.validDatesCount = validDatesInColumn;
      result.totalRowsChecked = totalRowsChecked;
      result.detectedFormat = detectedFormat;
      
      console.log(`✅ COLUNA DE DATA VÁLIDA ENCONTRADA: "${dateColumn}"`);
      console.log(`${'='.repeat(50)}\n`);
      return result;
    }
  }
  
  // Se chegou aqui, nenhuma coluna de data foi válida
  console.log(`❌ NENHUMA COLUNA DE DATA VÁLIDA ENCONTRADA`);
  console.log(`${'='.repeat(50)}\n`);
  
  result.errors.push('❌ ARQUIVO INVÁLIDO: não contém datas de trades válidas');
  result.errors.push('💡 Formatos aceitos: dd/MM/yyyy, dd/MM/yyyy HH:mm, yyyy-MM-dd, etc.');
  result.errors.push('📋 Verifique se a coluna de data contém datas válidas nos formatos esperados');
  
  return result;
}

/**
 * Converte string de data para Date usando o formato detectado
 */
export function parseDetectedDate(
  dateString: string, 
  detectedFormat: string | null
): Date | null {
  if (!dateString || !detectedFormat) {
    return null;
  }
  
  try {
    if (detectedFormat === 'JavaScript Date') {
      const date = new Date(dateString);
      return isValid(date) ? date : null;
    } else {
      const parsedDate = parse(dateString.trim(), detectedFormat, new Date(), { locale: ptBR });
      return isValid(parsedDate) ? parsedDate : null;
    }
  } catch (error) {
    return null;
  }
}

/**
 * Normaliza uma data para string ISO
 */
export function normalizeDateToISO(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
}