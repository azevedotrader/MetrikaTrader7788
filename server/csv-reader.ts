import * as fs from 'fs';
import * as chardet from 'chardet';
import * as iconv from 'iconv-lite';
import Papa from 'papaparse';

/**
 * Função inteligente para ler qualquer CSV, independente de encoding, delimitador ou formato
 * @param caminho Caminho para o arquivo CSV
 * @returns Array de objetos representando as linhas do CSV
 */
export async function lerCSVInteligente(caminho: string): Promise<any[]> {
  try {
    // 1. Verificar se o arquivo existe
    if (!fs.existsSync(caminho)) {
      throw new Error(`Arquivo não encontrado: ${caminho}`);
    }

    // 2. Ler o arquivo como buffer
    const buffer = fs.readFileSync(caminho);
    
    // 3. Detectar encoding automaticamente
    const detectedEncoding = chardet.detect(buffer);
    const encoding = detectedEncoding || 'utf8';
    
    console.log(`📁 Lendo CSV: ${caminho}`);
    console.log(`🔍 Encoding detectado: ${encoding}`);
    
    // 4. Converter para UTF-8
    let csvContent: string;
    try {
      csvContent = iconv.decode(buffer, encoding as string);
    } catch (encodingError) {
      // Fallback para UTF-8 se não conseguir decodificar
      console.warn(`⚠️ Erro ao decodificar com ${encoding}, usando UTF-8`);
      csvContent = iconv.decode(buffer, 'utf8');
    }

    // 5. Detectar quebras de linha e normalizar
    csvContent = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // 6. Auto-detectar delimitador testando diferentes opções
    const possibleDelimiters = [',', ';', '\t', '|', ':'];
    let bestDelimiter = ',';
    let maxColumns = 0;
    
    for (const delimiter of possibleDelimiters) {
      try {
        const testResult = Papa.parse(csvContent, {
          delimiter: delimiter,
          header: false,
          skipEmptyLines: true,
          transform: (value: string) => value.trim()
        });
        
        if (testResult.data.length > 0) {
          const firstRow = testResult.data[0] as string[];
          if (firstRow.length > maxColumns) {
            maxColumns = firstRow.length;
            bestDelimiter = delimiter;
          }
        }
      } catch (error) {
        // Ignorar erros de teste de delimitador
      }
    }
    
    console.log(`📊 Delimitador detectado: '${bestDelimiter}' (${maxColumns} colunas)`);

    // 7. Parse final com PapaParse usando as melhores configurações
    const result = Papa.parse(csvContent, {
      delimiter: bestDelimiter,
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Manteremos como string para controlar a conversão
      transformHeader: (header: string) => {
        // Limpar e normalizar headers
        return header.trim().replace(/[^\w\s\-_]/g, '').replace(/\s+/g, '_');
      },
      transform: (value: string, field: string | number) => {
        // Limpar valores
        const cleanValue = value.trim();
        
        // Tentar converter números brasileiros (vírgula como decimal)
        if (cleanValue.match(/^\d{1,3}(\.\d{3})*(,\d+)?$/)) {
          // Formato brasileiro: 1.234,56
          const numberValue = cleanValue.replace(/\./g, '').replace(',', '.');
          const parsed = parseFloat(numberValue);
          return isNaN(parsed) ? cleanValue : parsed;
        }
        
        // Tentar converter números americanos (ponto como decimal)
        if (cleanValue.match(/^\d{1,3}(,\d{3})*(\.\d+)?$/)) {
          // Formato americano: 1,234.56
          const numberValue = cleanValue.replace(/,/g, '');
          const parsed = parseFloat(numberValue);
          return isNaN(parsed) ? cleanValue : parsed;
        }
        
        // Números simples
        if (cleanValue.match(/^\d+(\.\d+)?$/)) {
          const parsed = parseFloat(cleanValue);
          return isNaN(parsed) ? cleanValue : parsed;
        }
        
        return cleanValue;
      },
      error: (error: any) => {
        console.error('❌ Erro no parsing do CSV:', error);
      }
    });

    if (result.errors && result.errors.length > 0) {
      console.warn('⚠️ Avisos durante o parsing:', result.errors.filter((e: any) => e.type !== 'Quotes'));
    }

    // 8. Filtrar linhas vazias e com dados inválidos
    const validRows = result.data ? result.data.filter((row: any) => {
      if (!row || typeof row !== 'object') return false;
      
      // Verificar se a linha tem pelo menos um valor não vazio
      const values = Object.values(row);
      return values.some(value => 
        value !== null && 
        value !== undefined && 
        value !== '' && 
        String(value).trim() !== ''
      );
    }) : [];

    console.log(`✅ CSV processado com sucesso:`);
    console.log(`   📝 Total de linhas: ${validRows.length}`);
    console.log(`   📋 Colunas: ${Object.keys(validRows[0] || {}).length}`);
    
    if (validRows.length > 0) {
      console.log(`   🔍 Primeira linha:`, Object.keys(validRows[0]));
    }

    return validRows;

  } catch (error) {
    console.error('❌ Erro ao ler CSV:', error);
    
    // Tentar fallback com configurações mais permissivas
    try {
      console.log('🔄 Tentando fallback com configurações permissivas...');
      
      const buffer = fs.readFileSync(caminho);
      const csvContent = buffer.toString('utf8', 0, Math.min(buffer.length, 1024 * 1024)); // Máximo 1MB
      
      const fallbackResult = Papa.parse(csvContent, {
        delimiter: '',  // Auto-detect
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false
      });
      
      if (fallbackResult.data && fallbackResult.data.length > 0) {
        console.log('✅ Fallback bem-sucedido!');
        return fallbackResult.data;
      }
    } catch (fallbackError) {
      console.error('❌ Fallback também falhou:', fallbackError);
    }
    
    throw new Error(
      `Não foi possível ler o arquivo CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}. ` +
      'Verifique se o arquivo não está corrompido e se tem o formato correto.'
    );
  }
}

/**
 * Função auxiliar para detectar o formato de um CSV sem processá-lo completamente
 * @param caminho Caminho para o arquivo CSV
 * @returns Informações sobre o formato do arquivo
 */
export async function analisarFormatoCSV(caminho: string): Promise<{
  encoding: string;
  delimiter: string;
  linhas: number;
  colunas: string[];
  tamanhoArquivo: number;
}> {
  try {
    const stats = fs.statSync(caminho);
    const buffer = fs.readFileSync(caminho, { encoding: null });
    
    // Detectar encoding
    const detectedEncoding = chardet.detect(buffer) || 'utf8';
    const csvContent = iconv.decode(buffer.slice(0, Math.min(buffer.length, 10240)), detectedEncoding as string); // Primeiros 10KB
    
    // Detectar delimitador
    const possibleDelimiters = [',', ';', '\t', '|'];
    let bestDelimiter = ',';
    let maxColumns = 0;
    
    for (const delimiter of possibleDelimiters) {
      const testResult = Papa.parse(csvContent, {
        delimiter: delimiter,
        header: false,
        preview: 5 // Apenas primeiras 5 linhas para teste
      });
      
      if (testResult.data.length > 0) {
        const firstRow = testResult.data[0] as string[];
        if (firstRow.length > maxColumns) {
          maxColumns = firstRow.length;
          bestDelimiter = delimiter;
        }
      }
    }
    
    // Contar linhas aproximadamente
    const lines = csvContent.split('\n').length;
    
    // Obter nomes das colunas
    const headerResult = Papa.parse(csvContent, {
      delimiter: bestDelimiter,
      header: true,
      preview: 1
    });
    
    const colunas = headerResult.meta.fields || [];
    
    return {
      encoding: detectedEncoding,
      delimiter: bestDelimiter,
      linhas: lines,
      colunas,
      tamanhoArquivo: stats.size
    };
    
  } catch (error) {
    throw new Error(`Erro ao analisar formato do CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}