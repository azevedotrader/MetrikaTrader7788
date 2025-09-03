/**
 * Sistema ChatGPT para Análise Inteligente de CSV
 * =============================================
 *
 * Usa OpenAI GPT-4 para analisar qualquer CSV de trading e extrair dados estruturados
 */

import OpenAI from "openai";
import { InsertTrade } from "@shared/schema";
import fs from "fs";
import Papa from "papaparse";

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
  brokerHint: string = "auto",
): Promise<OpenAICSVResult> {
  console.log(`🤖 Iniciando análise ChatGPT para: ${filePath}`);

  try {
    // 1. Ler e parsear CSV
    const csvContent = fs.readFileSync(filePath, "utf-8");
    const parseResult = Papa.parse(csvContent, {
      header: false,
      skipEmptyLines: true,
    });

    if (!parseResult.data || parseResult.data.length === 0) {
      throw new Error("CSV vazio ou inválido");
    }

    console.log(`📊 CSV carregado: ${parseResult.data.length} linhas`);

    // 2. Estratégia otimizada: análise completa até 150 linhas, amostra até 300
    let csvSample: string;
    let isFullAnalysis = parseResult.data.length <= 150;

    if (isFullAnalysis) {
      // Análise completa para arquivos pequenos (até 150 linhas)
      csvSample = parseResult.data
        .map((row: any) => (Array.isArray(row) ? row.join(",") : row))
        .join("\n");
      console.log(`📊 ANÁLISE RÁPIDA: ${parseResult.data.length} linhas`);
    } else if (parseResult.data.length <= 300) {
      // Amostra rápida para arquivos médios
      const start = parseResult.data.slice(0, 50);
      const middle = parseResult.data.slice(
        Math.floor(parseResult.data.length / 2) - 25,
        Math.floor(parseResult.data.length / 2) + 25,
      );
      const end = parseResult.data.slice(-50);
      const sampleData = [...start, ...middle, ...end];
      csvSample = sampleData
        .map((row: any) => (Array.isArray(row) ? row.join(",") : row))
        .join("\n");
      console.log(
        `📊 AMOSTRA RÁPIDA: ${sampleData.length}/${parseResult.data.length} linhas`,
      );
    } else {
      // Para arquivos muito grandes: usar sistema tradicional
      console.log(
        `⚡ Arquivo grande (${parseResult.data.length} linhas): redirecionando para sistema tradicional`,
      );
      throw new Error("FALLBACK_TO_TRADITIONAL");
    }

    // 3. Prompt otimizado para análise rápida
    const prompt = `Analise este CSV de trading rapidamente:

${csvSample}

BROKER: ${brokerHint}

Extraia todos os trades válidos:
[{
  "ativo": "WIN",
  "dataHora": "2025-01-01T10:30:00.000Z",
  "tipo": "compra",
  "quantidade": 1,
  "precoEntrada": 123000,
  "resultado": 500
}]

Response as JSON with structure:
{
  "fileType": "trades",
  "confidence": 0.95,
  "trades": [...array of trades...]
}`;

    console.log(`🧠 Enviando para ChatGPT... (${csvSample.length} chars)`);

    // 4. Chamar OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content:
            "Você é um especialista em análise de dados financeiros e trading. Responda sempre em formato JSON válido.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.05, // Temperatura ultra baixa para máxima precisão
      max_completion_tokens: 160000, // Máximo de tokens para análise completa sem limites
    });

    const aiResponse = response.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error("Resposta vazia do ChatGPT");
    }

    console.log(
      `🤖 ChatGPT respondeu (${aiResponse.length} chars): ${aiResponse.substring(0, 300)}...`,
    );

    // 5. Parsear resposta JSON
    let analysis: any;
    try {
      analysis = JSON.parse(aiResponse);
      console.log(`🔍 Análise ChatGPT detectada:`, {
        fileType: analysis.fileType,
        detectedBroker: analysis.detectedBroker,
        confidence: analysis.confidence,
        totalTrades: analysis.trades?.length || 0,
        csvStructure: analysis.csvStructure?.substring(0, 100) + "...",
      });
    } catch (parseError) {
      console.error("❌ Erro ao parsear JSON do ChatGPT:", parseError);
      console.error("🔍 Resposta completa que falhou:", aiResponse);
      throw new Error("Resposta do ChatGPT não é JSON válido");
    }

    // 6. Processar trades extraídos
    const trades: InsertTrade[] = [];
    const errors: string[] = [];

    if (analysis.fileType === "statistics") {
      console.log(
        `📊 ChatGPT detectou arquivo de estatísticas. Confiança: ${analysis.confidence}, Broker: ${analysis.detectedBroker}`,
      );
      return {
        trades: [],
        analysis: {
          originalRows: parseResult.data.length,
          tradesExtracted: 0,
          confidence: analysis.confidence || 0.9,
          fileType: analysis.fileType,
          detectedBroker: analysis.detectedBroker || "generic",
          csvStructure:
            analysis.csvStructure || "Arquivo de estatísticas/resumos",
        },
        errors: [
          "❌ ARQUIVO DE ESTATÍSTICAS DETECTADO PELO ChatGPT",
          "Este arquivo contém resumos/totalizações, não trades individuais.",
          `🎯 Detalhes ChatGPT: fileType=${analysis.fileType}, broker=${analysis.detectedBroker}, confidence=${analysis.confidence}`,
        ],
      };
    }

    if (analysis.trades && Array.isArray(analysis.trades)) {
      for (const tradeData of analysis.trades) {
        try {
          // Validar e processar cada trade
          const trade: InsertTrade = {
            userId,
            ativo: String(tradeData.ativo || "UNKNOWN").toUpperCase(),
            dataHora: tradeData.dataHora || new Date().toISOString(),
            tipo: tradeData.tipo === "venda" ? "venda" : "compra",
            quantidade: String(tradeData.quantidade || "1"),
            precoEntrada: String(tradeData.precoEntrada || "0"),
            precoSaida: String(
              tradeData.precoSaida || tradeData.precoEntrada || "0",
            ),
            resultado: String(tradeData.resultado || "0"),
            capitalUtilizado: String(tradeData.capitalUtilizado || "0"),
            corretora: (tradeData.corretora || "b3") as
              | "crypto"
              | "forex"
              | "b3",
            mercado: (tradeData.mercado || "b3") as "crypto" | "forex" | "b3",
            setup: tradeData.setup || "Análise GPT",
            origem: "csv-gpt",
            comentario: `${tradeData.comentario || "Extraído via ChatGPT"} - User: ${userId}`,
            stop: String(tradeData.stop || "0"),
            alvo: String(tradeData.alvo || "0"),
            risco: String(tradeData.risco || "0"),
          };

          trades.push(trade);
        } catch (error) {
          errors.push(`Erro ao processar trade: ${error}`);
          console.error("❌ Erro ao processar trade:", error);
        }
      }
    }

    console.log(
      `✅ ChatGPT extraiu ${trades.length} trades de ${parseResult.data.length} linhas`,
    );

    return {
      trades,
      analysis: {
        originalRows: parseResult.data.length,
        tradesExtracted: trades.length,
        confidence: analysis.confidence || 0.85,
        fileType: analysis.fileType || "trades",
        detectedBroker: analysis.detectedBroker || "generic",
        csvStructure: analysis.csvStructure || "Análise estrutural via ChatGPT",
        // Informações estruturais adicionais do ChatGPT
        ...(analysis.delimiter && { delimiter: analysis.delimiter }),
        ...(analysis.dateFormat && { dateFormat: analysis.dateFormat }),
        ...(analysis.decimalSeparator && {
          decimalSeparator: analysis.decimalSeparator,
        }),
        ...(analysis.totalRows && { totalRows: analysis.totalRows }),
        ...(analysis.dataRows && { dataRows: analysis.dataRows }),
        ...(analysis.marketDetected && {
          marketDetected: analysis.marketDetected,
        }),
        ...(analysis.columnMapping && {
          columnMapping: analysis.columnMapping,
        }),
      },
      errors,
    };
  } catch (error) {
    console.error("❌ Erro na análise ChatGPT:", error);
    console.error(
      "🔍 Stack trace completo:",
      error instanceof Error ? error.stack : "N/A",
    );
    console.error(
      "🔍 API Key disponível:",
      process.env.OPENAI_API_KEY
        ? "Sim (***" + process.env.OPENAI_API_KEY.slice(-4) + ")"
        : "Não",
    );
    console.error(
      "🔍 Tipo do erro:",
      error instanceof Error ? error.constructor.name : typeof error,
    );

    if (error instanceof Error) {
      if (
        error.message.includes("401") ||
        error.message.includes("authentication")
      ) {
        console.error("🚫 Erro de autenticação OpenAI - verificar API key");
      } else if (error.message.includes("429")) {
        console.error(
          "⏰ Rate limit OpenAI - tente novamente em alguns segundos",
        );
      } else if (error.message.includes("timeout")) {
        console.error("⏱️ Timeout na requisição OpenAI");
      }
    }

    return {
      trades: [],
      analysis: {
        originalRows: 0,
        tradesExtracted: 0,
        confidence: 0,
        fileType: "error",
        detectedBroker: "unknown",
        csvStructure: "Erro ao analisar",
      },
      errors: [
        "Erro ao analisar CSV com ChatGPT:",
        error instanceof Error ? error.message : "Erro desconhecido",
        `🔧 Debug info: ${error instanceof Error ? error.name : "Unknown error type"}`,
      ],
    };
  }
}
