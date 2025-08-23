import * as fs from 'fs';
import Papa from 'papaparse';

interface ParseCSVOptions {
  delimiter?: string;
  encoding?: string;
  hasHeader?: boolean;
  commentChar?: string;
  dynamicTyping?: boolean;
  maxErrors?: number;
}

interface ParseCSVResult {
  data: any[];
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
 * Parse CSV universal simplificado
 * 
 * Como usar:
 * 
 * (async () => {
 *   const result = await parseCSVUniversal('meu_arquivo.csv', {
 *     commentChar: '#',
 *     dynamicTyping: true,
 *     maxErrors: 50
 *   });
 *   console.log('Delimitador detectado:', result.meta.delimiter);
 *   console.log('Tem header?', result.meta.hasHeader);
 *   console.log('Linhas:', result.meta.totalRows);
 *   console.log('Erros:', result.meta.errors);
 *   console.log('Primeira linha:', result.data[0]);
 * })();
 */
export async function parseCSVUniversal(
  filePathOrContent: string,
  options: ParseCSVOptions = {}
): Promise<ParseCSVResult> {
  return new Promise((resolve, reject) => {
    try {
      const {
        commentChar = '#',
        maxErrors = 100,
        dynamicTyping = false,
        delimiter,
        hasHeader
      } = options;

      let csvContent: string;
      
      // Read file or use content directly
      if (fs.existsSync(filePathOrContent)) {
        csvContent = fs.readFileSync(filePathOrContent, 'utf8');
      } else {
        csvContent = filePathOrContent;
      }

      const errors: string[] = [];
      
      // Clean BOM and normalize line endings
      csvContent = csvContent.replace(/^\uFEFF/, ''); // Remove BOM
      csvContent = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n'); // Normalize line endings

      // Auto-detect delimiter by testing common ones
      const detectDelimiter = (content: string): string => {
        if (delimiter) return delimiter;
        
        const delimiters = [',', ';', '\t', '|'];
        const sample = content.split('\n').slice(0, 5).join('\n');
        
        let bestDelimiter = ',';
        let bestScore = 0;
        
        for (const d of delimiters) {
          const lines = sample.split('\n').filter(line => line.trim() && !line.startsWith(commentChar));
          if (lines.length < 2) continue;
          
          const counts = lines.map(line => line.split(d).length);
          const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
          const consistency = counts.every(c => Math.abs(c - avg) <= 1);
          
          if (consistency && avg > bestScore) {
            bestScore = avg;
            bestDelimiter = d;
          }
        }
        
        return bestDelimiter;
      };

      const detectedDelimiter = detectDelimiter(csvContent);
      
      // Auto-detect header
      const detectHeader = (content: string, delim: string): boolean => {
        if (hasHeader !== undefined) return hasHeader;
        
        const lines = content.split('\n').filter(line => line.trim() && !line.startsWith(commentChar));
        if (lines.length < 2) return false;
        
        const firstRow = lines[0].split(delim);
        const secondRow = lines[1].split(delim);
        
        // Count text vs numeric fields in first row
        const textFields = firstRow.filter(field => field.trim() && isNaN(Number(field.trim()))).length;
        const numericFields = secondRow.filter(field => field.trim() && !isNaN(Number(field.trim()))).length;
        
        return textFields > firstRow.length * 0.5 && numericFields > 0;
      };

      const detectedHeader = detectHeader(csvContent, detectedDelimiter);

      // Parse with Papa Parse
      Papa.parse(csvContent, {
        delimiter: detectedDelimiter,
        header: detectedHeader,
        comments: commentChar,
        skipEmptyLines: true,
        dynamicTyping,
        transformHeader: (header: string) => {
          return header.trim().toLowerCase().replace(/[^\w\s\-_]/g, '').replace(/\s+/g, '_');
        },
        transform: (value: string) => {
          if (typeof value !== 'string') return value;
          
          let v = value.trim();
          
          // Remove extra quotes
          while ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
            v = v.slice(1, -1).trim();
          }
          
          if (v === '' || v.toLowerCase() === 'null') return null;
          
          // Try to parse Brazilian number format (1.234,56)
          if (/^-?\d{1,3}(\.\d{3})*(,\d+)?$/.test(v)) {
            const num = Number(v.replace(/\./g, '').replace(/,/g, '.'));
            return isNaN(num) ? v : num;
          }
          
          return v;
        },
        complete: (results: any) => {
          const data = results.data || [];
          const parseErrors = results.errors || [];
          
          errors.push(...parseErrors.map((err: any) => `Line ${err.row}: ${err.message}`));
          
          const totalRows = data.length;
          const totalColumns = totalRows > 0 
            ? (detectedHeader ? Object.keys(data[0]).length : data[0].length)
            : 0;

          resolve({
            data,
            meta: {
              delimiter: detectedDelimiter,
              encoding: 'utf8',
              hasHeader: detectedHeader,
              totalRows,
              totalColumns,
              errors: errors.slice(0, maxErrors)
            }
          });
        },
        error: (error: any) => {
          reject(new Error(`Parse error: ${error.message}`));
        }
      });

    } catch (error) {
      reject(error);
    }
  });
}