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

    // 3. Prompt especializado para extração de trades
    const prompt = `
Você é um especialista em análise de dados de trading. Analise este CSV e extraia TODAS as operações (trades) realizadas.

CSV DADOS:
${csvSample}

INSTRUÇÕES:
1. IDENTIFIQUE se este é um arquivo de trades individuais ou estatísticas/resumos
2. Se for arquivo de ESTATÍSTICAS (contém saldos, lucros totais, médias), responda que não há trades
3. Se for arquivo de TRADES, extraia CADA OPERAÇÃO realizada

Para cada TRADE encontrado, extraia:
- Símbolo do ativo (ação, índice futuro, cripto, etc)
- Data da operação (formato YYYY-MM-DD)
- Tipo: "compra" ou "venda"
- Quantidade operada 
- Preço de entrada
- Preço de saída (se disponível)
- Resultado (lucro/prejuízo)
- Qualquer informação adicional relevante

FORMATO DE RESPOSTA (JSON):
{
  "fileType": "trades" ou "statistics",
  "detectedBroker": "clear" | "rico" | "xp" | "inter" | "btg" | "crypto" | "forex" | "generic",
  "csvStructure": "descrição da estrutura do arquivo",
  "confidence": 0.0 to 1.0,
  "trades": [
    {
      "ativo": "WINQ25",
      "dataHora": "2024-08-15T14:30:00.000Z",
      "tipo": "compra" ou "venda", 
      "quantidade": "1.0000",
      "precoEntrada": "120000.0000",
      "precoSaida": "120500.0000",
      "resultado": "500.00",
      "capitalUtilizado": "120000.00",
      "corretora": "b3",
      "mercado": "b3",
      "setup": "Análise GPT",
      "origem": "csv-gpt",
      "comentario": "Extraído via ChatGPT"
    }
  ]
}

IMPORTANTE:
- Se não encontrar trades válidos, retorne array vazio
- Use símbolos reais encontrados no CSV
- Converta datas para formato ISO
- Calcule capitalUtilizado como quantidade * precoEntrada
- Seja preciso com números (use string para valores decimais)
- Identifique corretamente o mercado: "b3" (ações/futuros BR), "crypto" (criptomoedas), "forex" (câmbio)
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
      temperature: 0.1, // Baixa temperatura para mais precisão
      max_tokens: 4000
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
        confidence: analysis.confidence || 0.8,
        fileType: analysis.fileType || 'trades',
        detectedBroker: analysis.detectedBroker || 'generic',
        csvStructure: analysis.csvStructure || 'Estrutura não identificada'
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