/**
 * Parser CSV robusto com controle total sobre formato brasileiro
 * Usando csv-parse para máximo controle sobre o parsing
 */

import { parse } from 'csv-parse/sync';
import fs from 'fs';
// import { detectEncoding } from './detect-encoding';

interface RobustCSVResult {
  data: Record<string, any>[];
  metadata: {
    rows: number;
    columns: number;
    encoding: string;
    delimiter: string;
    hasHeader: boolean;
    numberFormat: 'brazilian' | 'american' | 'mixed';
  };
  errors: string[];
}

/**
 * Parser de números BRASILEIRO PRIMEIRO
 */
function parseNumberBrazilian(value: string): number | null {
  if (!value || typeof value !== 'string') return null;
  
  const original = value;
  
  // Limpar string
  let cleaned = value.trim()
    .replace(/[R$\s]/gi, '') // Remove R$, espaços
    .replace(/[^\d.,\-+]/g, ''); // Só números, vírgula, ponto, sinal
  
  if (!cleaned) return null;
  
  // DETECÇÃO BRASIL-FIRST
  
  // 1. Padrão brasileiro clássico: 1.234,56
  if (/^\d{1,3}(\.\d{3})*(,\d{1,2})$/.test(cleaned)) {
    const result = parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
    console.log(`🇧🇷 BR1: "${original}" → ${result} (padrão brasileiro)`);
    return result;
  }
  
  // 2. Decimal brasileiro simples: 123,45
  if (/^\d+,\d{1,2}$/.test(cleaned)) {
    const result = parseFloat(cleaned.replace(',', '.'));
    console.log(`🇧🇷 BR2: "${original}" → ${result} (decimal brasileiro)`);
    return result;
  }
  
  // 3. Milhares brasileiro: 1.234 (sem centavos)
  if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    const result = parseFloat(cleaned.replace(/\./g, ''));
    console.log(`🇧🇷 BR3: "${original}" → ${result} (milhares brasileiro)`);
    return result;
  }
  
  // 4. Vírgula como decimal (assumir brasileiro se não há ponto)
  if (/^\d+,\d+$/.test(cleaned) && !cleaned.includes('.')) {
    const result = parseFloat(cleaned.replace(',', '.'));
    console.log(`🇧🇷 BR4: "${original}" → ${result} (vírgula decimal)`);
    return result;
  }
  
  // 5. Fallback: formato americano apenas se claramente americano
  if (/^\d{1,3}(,\d{3})*\.\d{1,2}$/.test(cleaned)) {
    const result = parseFloat(cleaned.replace(/,/g, ''));
    console.log(`🇺🇸 US: "${original}" → ${result} (americano)`);
    return result;
  }
  
  // 6. Número simples (sem separadores)
  if (/^\d+$/.test(cleaned)) {
    const result = parseFloat(cleaned);
    console.log(`🔢 Simple: "${original}" → ${result} (simples)`);
    return result;
  }
  
  console.log(`❌ Invalid: "${original}" → null`);
  return null;
}

/**
 * Detecta delimitador automaticamente
 */
function detectDelimiter(content: string): string {
  const sample = content.split('\n').slice(0, 5).join('\n');
  
  const delimiters = [';', ',', '\t', '|'];
  const scores = delimiters.map(del => {
    const lines = sample.split('\n').filter(line => line.trim());
    if (lines.length < 2) return 0;
    
    const counts = lines.map(line => line.split(del).length);
    const consistent = counts.every(count => count === counts[0]);
    const fieldCount = counts[0];
    
    return consistent && fieldCount > 1 ? fieldCount : 0;
  });
  
  const maxScore = Math.max(...scores);
  const bestDelimiter = delimiters[scores.indexOf(maxScore)];
  
  console.log(`📊 Delimiter detection: ${delimiters.map((d, i) => `${d}=${scores[i]}`).join(', ')} → escolhido: "${bestDelimiter}"`);
  
  return bestDelimiter || ';'; // Default brasileiro
}

/**
 * Parser CSV robusto com foco no formato brasileiro
 */
export async function parseCSVRobust(filePath: string): Promise<RobustCSVResult> {
  try {
    console.log(`🔍 Iniciando parsing robusto: ${filePath}`);
    
    // 1. Detectar encoding (simplificado)
    const encoding = 'utf8'; // Fallback simples por ora
    console.log(`🔤 Encoding assumido: ${encoding}`);
    
    // 2. Ler arquivo
    const content = fs.readFileSync(filePath, { encoding: encoding as BufferEncoding });
    
    // 3. Detectar delimitador
    const delimiter = detectDelimiter(content);
    
    // 4. Parse com csv-parse (controle total)
    const records: Record<string, any>[] = parse(content, {
      delimiter,
      quote: '"',
      escape: '"',
      auto_parse: false, // Não fazer parsing automático
      auto_parse_date: false,
      trim: true,
      skip_empty_lines: true,
      relax_column_count: true, // Permite linhas com colunas diferentes
      columns: (header: string[]) => {
        // Normalizar headers
        return header.map((h: string, i: number) => {
          if (!h || h.trim() === '') return `col_${i + 1}`;
          return h.toLowerCase()
            .replace(/[^\w]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
        });
      },
      cast: (value: string, _context: any) => {
        // Aplicar nossa lógica de parsing brasileiro
        const num = parseNumberBrazilian(value);
        return num !== null ? num : value;
      },
      on_record: (record: any, context: any) => {
        // Log cada linha processada
        if (context.lines <= 5) {
          console.log(`📄 Linha ${context.lines}:`, Object.values(record).slice(0, 5));
        }
        return record;
      }
    });
    
    console.log(`✅ Parsing concluído: ${records.length} linhas processadas`);
    
    // 5. Analisar resultado
    const numberFormat = analyzeNumberFormat(records);
    
    return {
      data: records,
      metadata: {
        rows: records.length,
        columns: records.length > 0 ? Object.keys(records[0] as Record<string, any>).length : 0,
        encoding,
        delimiter,
        hasHeader: true,
        numberFormat
      },
      errors: []
    };
    
  } catch (error) {
    console.error(`❌ Erro no parsing robusto:`, error);
    return {
      data: [],
      metadata: {
        rows: 0,
        columns: 0,
        encoding: 'utf8',
        delimiter: ';',
        hasHeader: false,
        numberFormat: 'brazilian'
      },
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}

/**
 * Analisa o formato dos números detectados
 */
function analyzeNumberFormat(records: any[]): 'brazilian' | 'american' | 'mixed' {
  if (!records.length) return 'brazilian';
  
  let brazilianCount = 0;
  let americanCount = 0;
  
  for (const record of records.slice(0, 10)) { // Amostra
    for (const value of Object.values(record as Record<string, any>)) {
      if (typeof value === 'string') {
        if (/\d+,\d+/.test(value) && !value.includes('.')) brazilianCount++;
        if (/\d+\.\d+/.test(value) && !value.includes(',')) americanCount++;
      }
    }
  }
  
  if (brazilianCount > americanCount) return 'brazilian';
  if (americanCount > brazilianCount) return 'american';
  return 'mixed';
}