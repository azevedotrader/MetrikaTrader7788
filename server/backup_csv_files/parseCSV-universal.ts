import * as fs from 'fs';
import * as stream from 'stream';
import Papa from 'papaparse';
import * as chardet from 'chardet';
import * as iconv from 'iconv-lite';

interface ParseCSVOptions {
  delimiter?: string;          // força delimitador
  encoding?: string;           // força encoding
  hasHeader?: boolean;         // força header
  commentChar?: string;        // caractere que indica comentário (default '#')
  sampleSize?: number;         // linhas para detectar delimitador/header
  dynamicTyping?: boolean;     // detectar tipos (default false)
  maxErrors?: number;          // limite máximo de erros antes de abortar (default 100)
}

/**
 * Resultado final do parse
 */
interface ParseCSVResult {
  data: any[];           // linhas parseadas
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
 * Parse CSV universal robusto com streaming para arquivos grandes.
 * 
 * @param filePathOrContent - caminho do arquivo CSV ou conteúdo direto
 * @param options - configurações opcionais
 */
export async function parseCSVUniversal(
  filePathOrContent: string,
  options: ParseCSVOptions = {}
): Promise<ParseCSVResult> {
  return new Promise((resolve, reject) => {
    try {
      // Valores padrão
      const commentChar = options.commentChar ?? '#';
      const maxErrors = options.maxErrors ?? 100;
      const sampleSize = options.sampleSize ?? 20;
      const dynamicTyping = options.dynamicTyping ?? false;

      // Variáveis de estado
      let detectedEncoding = 'utf8';
      let delimiter = options.delimiter || '';
      let hasHeader = options.hasHeader ?? false;

      const errors: string[] = [];
      const data: any[] = [];
      let headers: string[] = [];
      let isFirstChunk = true;
      let sampleLines: string[] = [];

      // Função para limpar conteúdo (remoção de BOM, espaços, aspas, invisíveis)
      const cleanLine = (line: string): string => {
        line = line.replace(/^\uFEFF/, ''); // BOM
        line = line.trim();

        // Remover aspas externas múltiplas
        while ((line.startsWith('"') && line.endsWith('"')) ||
               (line.startsWith("'") && line.endsWith("'"))) {
          line = line.slice(1, -1).trim();
        }

        // Remover caracteres invisíveis exceto \t e \n
        line = line.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

        return line;
      };

      // Detecta delimitador por padrão de repetição máxima na amostra
      const detectDelimiterByRepetition = (sampleLines: string[]): string => {
        const candidates = new Set<string>();

        // Coleta todos caracteres não alfanuméricos e não espaço da amostra
        sampleLines.forEach(line => {
          for (const ch of line) {
            if (!/[a-zA-Z0-9\s]/.test(ch)) {
              candidates.add(ch);
            }
          }
        });

        if (candidates.size === 0) {
          // Se não tem caractere especial, tenta vírgula por padrão
          return ',';
        }

        let bestChar = '';
        let bestScore = 0;

        candidates.forEach(ch => {
          // Score = média do número de ocorrências desse caractere por linha na amostra
          const counts = sampleLines.map(line => (line.split(ch).length - 1));
          const avg = counts.reduce((a,b) => a+b, 0) / counts.length;

          // Bonus se é consistente entre linhas (baixa variância)
          const variance = counts.reduce((a,b) => a + (b - avg) ** 2, 0) / counts.length;

          const score = avg / (1 + variance);

          if (score > bestScore) {
            bestScore = score;
            bestChar = ch;
          }
        });

        return bestChar || ',';
      };

      // Detecta se tem header ignorando comentários
      const detectHeader = (lines: string[], delimiter: string): boolean => {
        // Ignora linhas comentadas para detectar header
        const filtered = lines.filter(l => !l.startsWith(commentChar) && l.trim() !== '');
        if (filtered.length < 2) return false;

        const firstRow = filtered[0].split(delimiter);
        const secondRow = filtered[1].split(delimiter);

        if (Math.abs(firstRow.length - secondRow.length) > 1) return false;

        let headerScore = 0;
        let dataScore = 0;

        // Palavras comuns em headers para reforçar
        const commonHeaders = ['id', 'name', 'date', 'email', 'value', 'price', 'qty', 'amount'];

        firstRow.forEach(cell => {
          const c = cell.trim().toLowerCase();
          if (c.length > 0 && isNaN(Number(c))) {
            headerScore++;
            if (commonHeaders.includes(c)) headerScore += 2;
          }
        });

        secondRow.forEach(cell => {
          const c = cell.trim();
          if (!isNaN(Number(c)) || c.includes('/') || c.includes('-')) {
            dataScore++;
          }
        });

        return (headerScore > dataScore) && (headerScore > firstRow.length * 0.5);
      };

      // Limpeza e conversão de números nos formatos BR e US
      const parseNumberBRUS = (value: string): number | null => {
        if (!value) return null;

        let v = value.trim();

        // Remove espaços internos
        v = v.replace(/\s+/g, '');

        // Detecta se usa vírgula decimal (BR) ou ponto decimal (US)
        // Exemplo BR: 1.234,56   | US: 1,234.56

        const brMatch = /^-?(\d{1,3}(\.\d{3})*|\d+)(,\d+)?$/.test(v);
        const usMatch = /^-?(\d{1,3}(,\d{3})*|\d+)(\.\d+)?$/.test(v);

        if (brMatch) {
          // Remove pontos milhares, substitui vírgula decimal por ponto
          v = v.replace(/\./g, '').replace(/,/g, '.');
          const num = Number(v);
          return isNaN(num) ? null : num;
        } else if (usMatch) {
          // Remove vírgulas milhares
          v = v.replace(/,/g, '');
          const num = Number(v);
          return isNaN(num) ? null : num;
        }

        // Tentativa fallback normal
        const num = Number(v);
        return isNaN(num) ? null : num;
      };

      // Função para transformar cada valor no parse (limpeza + conversão)
      const transformValue = (value: string): any => {
        if (typeof value !== 'string') return value;

        let v = value.trim();

        // Remover aspas extras
        while ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1).trim();
        }

        if (v === '' || v.toLowerCase() === 'null' || v.toLowerCase() === 'undefined') return null;

        // Tentar converter número BR/US
        const num = parseNumberBRUS(v);
        if (num !== null) return num;

        return v;
      };

      // Função para transformar headers
      const transformHeader = (header: string, index: number): string => {
        let h = header.trim().toLowerCase();
        h = h.replace(/[^\w\s\-_]/g, ''); // Remove caracteres especiais
        h = h.replace(/\s+/g, '_');       // Espaços para underline
        if (!h) h = `col_${index + 1}`;
        return h;
      };

      // ------------------------
      // Função principal de processamento via streaming
      // ------------------------

      // Se for caminho de arquivo detecta encoding, cria stream e decodifica
      let inputStream: stream.Readable;

      if (fs.existsSync(filePathOrContent)) {
        // arquivo
        const rawBuffer = fs.readFileSync(filePathOrContent);
        detectedEncoding = options.encoding || (chardet.detect(rawBuffer) as string) || 'utf8';

        // iconv-lite doesn't have encodingExists, just try to use it
        try {
          iconv.getDecoder(detectedEncoding);
        } catch {
          detectedEncoding = 'utf8';
        }

        const fileStream = fs.createReadStream(filePathOrContent);
        inputStream = fileStream.pipe(iconv.decodeStream(detectedEncoding)) as stream.Readable;
      } else {
        // conteúdo direto
        detectedEncoding = options.encoding || 'utf8';
        inputStream = stream.Readable.from([filePathOrContent]);
      }

      // Buffer temporário para amostra e detecção
      const sampleBuffer: string[] = [];

      // Linha atual (para contar erros)
      let lineNumber = 0;

      // Parser PapaParse em stream
      const papaStream = Papa.parse(Papa.NODE_STREAM_INPUT as any, {
        delimiter: delimiter || undefined,
        header: false,  // Detectaremos header manualmente
        comments: commentChar,
        skipEmptyLines: true,
        dynamicTyping: false,
        transform: transformValue,
      });

      // Transform stream para capturar linhas para detecção
      const lineCapture = new stream.Transform({
        readableObjectMode: true,
        writableObjectMode: false,
        transform(chunk, encoding, callback) {
          const chunkStr = chunk.toString();
          const lines = chunkStr.split(/\r\n|\n|\r/);
          for (const line of lines) {
            if (sampleBuffer.length < sampleSize) {
              const clean = cleanLine(line);
              if (clean && !clean.startsWith(commentChar)) sampleBuffer.push(clean);
            }
            this.push(line + '\n');
          }
          callback();
        }
      });

      // Pipeline para streaming e parsing
      const finalStream = inputStream
        .pipe(lineCapture)
        .pipe(papaStream as any);

      // Quando começar o parsing vamos detectar delimiter e header no sample
      finalStream.on('data', (row: any) => {
        lineNumber++;

        // Na primeira linha (primeira data emitida) detecta delimitador e header
        if (isFirstChunk) {
          // Detecta delimitador se não foi passado
          if (!delimiter) {
            delimiter = detectDelimiterByRepetition(sampleBuffer);
          }

          // Detecta header se não foi passado
          if (options.hasHeader === undefined) {
            hasHeader = detectHeader(sampleBuffer, delimiter);
          } else {
            hasHeader = options.hasHeader;
          }

          // Se tem header, parse linha de header para campos formatados
          if (hasHeader) {
            headers = sampleBuffer[0].split(delimiter).map(transformHeader);
          }

          // Troca as configs do Papa para header se necessário (não é possível dinamicamente, então fazemos assim:)
          // Para continuar lendo linhas a partir da próxima linha:
          // Alternativa: já começamos o parse com header=false, então vamos reprocessar linhas manualmente abaixo

          isFirstChunk = false;
        }

        // Tratar a linha de acordo com header
        if (hasHeader) {
          // Se for linha de header original, ignorar
          if (lineNumber === 1) return;

          // Mapear array para objeto usando headers
          if (Array.isArray(row)) {
            if (row.length !== headers.length) {
              errors.push(`Linha ${lineNumber}: número de colunas (${row.length}) diferente do header (${headers.length})`);
            }
            const obj: any = {};
            headers.forEach((h, i) => {
              obj[h] = row[i] !== undefined ? row[i] : null;
            });
            data.push(obj);
          } else {
            data.push(row);
          }
        } else {
          // Sem header: adicionar arrays
          data.push(row);
        }
      });

      finalStream.on('error', (err: any) => {
        errors.push(`Erro no PapaParse: ${err.message || err}`);
        if (errors.length >= maxErrors) {
          reject(new Error(`Limite máximo de erros (${maxErrors}) atingido.`));
        }
      });

      finalStream.on('end', () => {
        const totalRows = data.length;
        const totalColumns = hasHeader
          ? headers.length
          : (data.length > 0 ? (Array.isArray(data[0]) ? data[0].length : Object.keys(data[0]).length) : 0);

        resolve({
          data,
          meta: {
            delimiter,
            encoding: detectedEncoding,
            hasHeader,
            totalRows,
            totalColumns,
            errors,
          }
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}