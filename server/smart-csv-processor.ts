/**
 * Sistema Inteligente de Processamento CSV Universal - Versão Simplificada
 * ======================================================================
 */

import { InsertTrade } from '@shared/schema';
import { parseCSVUniversal } from './universal-csv-parser';
import { parseWithSimplifiedSystem } from './simplified-csv-parser';
import { extractTradesFromUniversalCSV } from './smart-trade-extractor';

export interface SmartCSVResult {
  trades: InsertTrade[];
  summary: {
    totalRows: number;
    tradesFound: number;
    statisticsSkipped: number;
    dateRange: { start: string; end: string } | null;
    detectedBroker: string;
    detectedMarket: string;
  };
  errors: string[];
}

export async function processSmartCSV(
  filePath: string,
  userId: string,
  brokerHint: string = 'auto',
  csvImportId: string
): Promise<SmartCSVResult> {
  console.log(`\n🚀 SISTEMA INTELIGENTE UNIVERSAL - PARSING CSV`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📁 Arquivo: ${filePath}`);
  console.log(`👤 Usuário: ${userId}`);
  console.log(`🏢 Broker Hint: ${brokerHint}`);
  console.log(`🔗 CSV Import ID: ${csvImportId}`);
  
  try {
    // 1. Tentar primeiro o sistema simplificado (PapaParse + csv-parse)
    console.log(`\n🔍 Etapa 1: Sistema Simplificado de Parsing`);
    let parsedData;
    
    try {
      const simplifiedResult = await parseWithSimplifiedSystem(filePath);
      
      // Converter para formato compatível
      parsedData = {
        data: simplifiedResult.data,
        headers: simplifiedResult.headers,
        totalRows: simplifiedResult.rowCount,
        skippedRows: 0,
        detectedDelimiter: simplifiedResult.delimiter,
        detectedEncoding: simplifiedResult.encoding,
        detectedQuoteChar: '"',
        numberFormat: 'brazilian' as const,
        dateValidation: simplifiedResult.dateValidation,
        keyColumns: {},
        errors: simplifiedResult.errors
      };
      
      console.log(`✅ Sistema simplificado funcionou: ${simplifiedResult.method} com ${simplifiedResult.data.length} linhas`);
    } catch (simplifiedError) {
      console.warn(`⚠️ Sistema simplificado falhou, tentando parser universal como último recurso...`);
      parsedData = await parseCSVUniversal(filePath);
    }
    
    if (parsedData.errors.length > 0) {
      console.warn('⚠️ Avisos do parser:', parsedData.errors);
    }
    
    console.log(`📊 Estatísticas do parsing:`);
    console.log(`   - Total de linhas: ${parsedData.totalRows}`);
    console.log(`   - Linhas puladas: ${parsedData.skippedRows}`);
    console.log(`   - Delimitador: "${parsedData.detectedDelimiter}"`);
    console.log(`   - Encoding: ${parsedData.detectedEncoding}`);
    console.log(`   - Formato numérico: ${parsedData.numberFormat}`);
    
    // 2. Extrair trades usando o extrator inteligente
    console.log(`\n🎯 Etapa 2: Extração Inteligente de Trades`);
    const extractionResult = extractTradesFromUniversalCSV(
      parsedData,
      userId,
      csvImportId,
      brokerHint
    );
    
    console.log(`✅ Extração concluída: ${extractionResult.trades.length} trades encontrados`);
    
    return {
      trades: extractionResult.trades,
      summary: extractionResult.summary,
      errors: extractionResult.errors
    };
    
  } catch (error) {
    console.error(`❌ Erro no processamento inteligente:`, error);
    
    return {
      trades: [],
      summary: {
        totalRows: 0,
        tradesFound: 0,
        statisticsSkipped: 0,
        dateRange: null,
        detectedBroker: 'auto',
        detectedMarket: 'b3',
      },
      errors: [`Erro crítico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`]
    };
  }
}