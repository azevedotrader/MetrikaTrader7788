/**
 * Sistema ChatGPT para Análise Inteligente de CSV
 * =============================================
 * 
 * Usa OpenAI GPT-4 para analisar qualquer CSV de trading e extrair dados estruturados
 */

import OpenAI from "openai";
import { InsertTrade } from '@shared/schema';
import fs from 'fs';
import Papa from 'papaparse';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface OpenAICSVResult {
  trades: InsertTrade[];
  analysis: {
    originalRows: number;
    tradesExtracted: number;
    confidence: number;
    fileType: string;
    detectedBroker: string;
    csvStructure: string;
  };
  errors: string[];
}

/**
 * Analisa CSV usando ChatGPT e retorna trades estruturados
 */
export async function analyzeCSVWithOpenAI(
  filePath: string,
  userId: string,
  brokerHint: string = 'auto'
): Promise<OpenAICSVResult> {
  console.log(`🤖 Iniciando análise ChatGPT para: ${filePath}`);
  
  try {
    // 1. Ler e parsear CSV
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    const parseResult = Papa.parse(csvContent, {
      header: false,
      skipEmptyLines: true
    });

    if (!parseResult.data || parseResult.data.length === 0) {
      throw new Error('CSV vazio ou inválido');
    }

    console.log(`📊 CSV carregado: ${parseResult.data.length} linhas`);

    // 2. Preparar dados para ChatGPT (limitando a 50 linhas para não exceder token limit)
    const sampleData = parseResult.data.slice(0, 50);
    const csvSample = sampleData.map((row: any) => Array.isArray(row) ? row.join(',') : row).join('\n');

    // 3. Prompt SUPER AVANÇADO para análise estrutural completa
    const prompt = `
🚀 TAREFA: ANÁLISE ESTRUTURAL COMPLETA DE CSV DE TRADING

Você é um especialista em análise de dados financeiros. Faça uma análise estrutural COMPLETA deste CSV.

📊 DADOS CSV PARA ANÁLISE:
${csvSample}

🏢 BROKER SUGERIDO: ${brokerHint}

📋 ANÁLISE ESTRUTURAL OBRIGATÓRIA:

1. 🔍 DETECÇÃO DE FORMATO:
   - Identifique delimitadores automaticamente (, ; | tab espaços)
   - Analise encoding (UTF-8, Latin-1, etc.)
   - Detecte formato de data (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
   - Identifique separadores decimais (, ou .)
   - Reconheça headers/colunas

2. 🏛️ IDENTIFICAÇÃO DE CORRETORA:
   - Clear (B3): formato WINQ25;01/07/2025 17:04:30;V;141.745
   - Rico/XP: headers estruturados (Ativo, Quantidade, Preço, etc.)
   - Inter/BTG: relatórios padronizados
   - Crypto: pares BTC/USDT, timestamps Unix
   - Forex: pares EUR/USD, spreads
   - Generic: formato customizado

3. 📈 ANÁLISE DE CONTEÚDO:
   - Conte linhas totais vs linhas de dados
   - Identifique trades vs estatísticas vs headers
   - Reconheça padrões de símbolos (WIN, DOL, BTC, EUR/USD)
   - Detecte colunas de preços, quantidades, datas
   - Calcule confiança da análise (0.0 a 1.0)

4. 💹 EXTRAÇÃO DE TRADES:
   Para cada trade válido encontrado:
   - ✅ Símbolo do ativo (preservar formato original)
   - 📅 Data/hora completa (converter para ISO 8601)
   - 📊 Tipo: "compra" ou "venda" (C/V, BUY/SELL, +/-)
   - 🔢 Quantidade (decimal preciso)
   - 💰 Preço entrada (4 casas decimais)
   - 💰 Preço saída (se disponível)
   - 💵 Resultado final (lucro/prejuízo)
   - 🏦 Capital utilizado (quantidade × preço)
   - 📝 Observações adicionais

📤 FORMATO DE RESPOSTA (JSON ESTRUTURADO):
{
  "fileType": "trades" | "statistics" | "mixed" | "unknown",
  "detectedBroker": "clear" | "rico" | "xp" | "inter" | "btg" | "binance" | "crypto" | "forex" | "mt5" | "generic",
  "csvStructure": "DESCRIÇÃO DETALHADA: delimitador=X, encoding=Y, colunas=Z, formato_data=W, decimal=V",
  "confidence": 0.95,
  "delimiter": ";",
  "dateFormat": "DD/MM/YYYY HH:mm:ss",
  "decimalSeparator": "," | ".",
  "totalRows": 150,
  "dataRows": 120,
  "headerRows": 2,
  "statisticRows": 28,
  "columnMapping": {
    "symbol": "coluna 1 ou nome",
    "datetime": "coluna 2 ou nome",
    "type": "coluna 3 ou nome",
    "quantity": "coluna 4 ou nome",
    "price": "coluna 5 ou nome",
    "result": "coluna 6 ou nome"
  },
  "marketDetected": "b3" | "crypto" | "forex" | "stocks" | "unknown",
  "trades": [
    {
      "ativo": "WINQ25",
      "dataHora": "2025-01-07T17:04:30.000Z",
      "tipo": "venda",
      "quantidade": "1.0000",
      "precoEntrada": "141745.0000",
      "precoSaida": "141200.0000",
      "resultado": "545.00",
      "capitalUtilizado": "141745.00",
      "corretora": "b3",
      "mercado": "b3",
      "setup": "Scalping 5min",
      "origem": "csv-gpt",
      "comentario": "Trade extraído via análise ChatGPT - WIN Futuro",
      "stop": "142000.0000",
      "alvo": "141000.0000",
      "risco": "2.5"
    }
  ]
}

⚠️ REQUISITOS CRÍTICOS:
- Seja EXTREMAMENTE preciso com números (use strings para decimais)
- Preserve símbolos EXATOS do arquivo original
- Converta TODAS as datas para ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
- Identifique corretamente compra/venda (C/V, BUY/SELL, +/-, entrada/saída)
- Calcule capital = quantidade × preço_entrada
- Detecte automaticamente mercado: b3(WIN,DOL,ISP), crypto(BTC,ETH), forex(EUR/USD)
- Confidence > 0.8 apenas se tiver certeza dos dados
- Se não encontrar trades, retorne array vazio mas mantenha análise estrutural
`;

    console.log(`🧠 Enviando para ChatGPT... (${csvSample.length} chars)`);

    // 4. Chamar OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "Você é um especialista em análise de dados financeiros e trading. Responda sempre em formato JSON válido."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.05, // Temperatura ultra baixa para máxima precisão
      max_tokens: 8000 // Tokens aumentados para análise estrutural completa
    });

    const aiResponse = response.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('Resposta vazia do ChatGPT');
    }

    console.log(`🤖 ChatGPT respondeu: ${aiResponse.substring(0, 200)}...`);

    // 5. Parsear resposta JSON
    let analysis: any;
    try {
      analysis = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('❌ Erro ao parsear JSON do ChatGPT:', parseError);
      throw new Error('Resposta do ChatGPT não é JSON válido');
    }

    // 6. Processar trades extraídos
    const trades: InsertTrade[] = [];
    const errors: string[] = [];

    if (analysis.fileType === 'statistics') {
      return {
        trades: [],
        analysis: {
          originalRows: parseResult.data.length,
          tradesExtracted: 0,
          confidence: analysis.confidence || 0.9,
          fileType: analysis.fileType,
          detectedBroker: analysis.detectedBroker || 'generic',
          csvStructure: analysis.csvStructure || 'Arquivo de estatísticas/resumos'
        },
        errors: ['❌ ARQUIVO DE ESTATÍSTICAS DETECTADO PELO ChatGPT', 'Este arquivo contém resumos/totalizações, não trades individuais.']
      };
    }

    if (analysis.trades && Array.isArray(analysis.trades)) {
      for (const tradeData of analysis.trades) {
        try {
          // Validar e processar cada trade
          const trade: InsertTrade = {
            userId,
            ativo: String(tradeData.ativo || 'UNKNOWN').toUpperCase(),
            dataHora: tradeData.dataHora || new Date().toISOString(),
            tipo: tradeData.tipo === 'venda' ? 'venda' : 'compra',
            quantidade: String(tradeData.quantidade || '1'),
            precoEntrada: String(tradeData.precoEntrada || '0'),
            precoSaida: String(tradeData.precoSaida || tradeData.precoEntrada || '0'),
            resultado: String(tradeData.resultado || '0'),
            capitalUtilizado: String(tradeData.capitalUtilizado || '0'),
            corretora: (tradeData.corretora || 'b3') as 'crypto' | 'forex' | 'b3',
            mercado: (tradeData.mercado || 'b3') as 'crypto' | 'forex' | 'b3',
            setup: tradeData.setup || 'Análise GPT',
            origem: 'csv-gpt',
            comentario: `${tradeData.comentario || 'Extraído via ChatGPT'} - User: ${userId}`,
            stop: String(tradeData.stop || '0'),
            alvo: String(tradeData.alvo || '0'),
            risco: String(tradeData.risco || '0')
          };
          
          trades.push(trade);
        } catch (error) {
          errors.push(`Erro ao processar trade: ${error}`);
          console.error('❌ Erro ao processar trade:', error);
        }
      }
    }

    console.log(`✅ ChatGPT extraiu ${trades.length} trades de ${parseResult.data.length} linhas`);

    return {
      trades,
      analysis: {
        originalRows: parseResult.data.length,
        tradesExtracted: trades.length,
        confidence: analysis.confidence || 0.85,
        fileType: analysis.fileType || 'trades',
        detectedBroker: analysis.detectedBroker || 'generic',
        csvStructure: analysis.csvStructure || 'Análise estrutural via ChatGPT',
        // Informações estruturais adicionais do ChatGPT
        ...(analysis.delimiter && { delimiter: analysis.delimiter }),
        ...(analysis.dateFormat && { dateFormat: analysis.dateFormat }),
        ...(analysis.decimalSeparator && { decimalSeparator: analysis.decimalSeparator }),
        ...(analysis.totalRows && { totalRows: analysis.totalRows }),
        ...(analysis.dataRows && { dataRows: analysis.dataRows }),
        ...(analysis.marketDetected && { marketDetected: analysis.marketDetected }),
        ...(analysis.columnMapping && { columnMapping: analysis.columnMapping })
      },
      errors
    };

  } catch (error) {
    console.error('❌ Erro na análise ChatGPT:', error);
    
    return {
      trades: [],
      analysis: {
        originalRows: 0,
        tradesExtracted: 0,
        confidence: 0,
        fileType: 'error',
        detectedBroker: 'unknown',
        csvStructure: 'Erro ao analisar'
      },
      errors: [
        'Erro ao analisar CSV com ChatGPT:',
        error instanceof Error ? error.message : 'Erro desconhecido'
      ]
    };
  }
}