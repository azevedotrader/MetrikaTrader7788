import fs from 'fs';
import Papa from 'papaparse';

/**
 * Função simplificada para ler CSV com compatibilidade máxima
 */
export async function lerCSVSimples(caminho: string): Promise<any[]> {
  try {
    // Ler arquivo como texto UTF-8
    const csvContent = fs.readFileSync(caminho, 'utf8');
    
    // Auto-detectar delimitador
    const delimitadores = [';', ',', '\t', '|'];
    let melhorDelimitador = ';';
    let maxColunas = 0;
    
    for (const delim of delimitadores) {
      const teste = Papa.parse(csvContent, {
        delimiter: delim,
        header: false,
        skipEmptyLines: true,
        preview: 1
      });
      
      if (teste.data && teste.data[0] && Array.isArray(teste.data[0])) {
        const colunas = (teste.data[0] as string[]).length;
        if (colunas > maxColunas) {
          maxColunas = colunas;
          melhorDelimitador = delim;
        }
      }
    }
    
    console.log(`📊 Delimitador detectado: "${melhorDelimitador}" (${maxColunas} colunas)`);
    
    // Parsear com delimitador correto
    const resultado = Papa.parse(csvContent, {
      delimiter: melhorDelimitador,
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string, index: number) => {
        // Se não há headers reais, criar headers numerados
        return header.trim() || `coluna_${index}`;
      },
      transform: (value: string) => value.trim()
    });
    
    if (resultado.errors && resultado.errors.length > 0) {
      console.warn('⚠️ Avisos no parsing:', resultado.errors);
    }
    
    console.log(`✅ CSV lido: ${resultado.data.length} linhas`);
    return resultado.data as any[];
    
  } catch (error) {
    console.error('❌ Erro ao ler CSV:', error);
    throw new Error(`Erro ao ler CSV: ${error}`);
  }
}