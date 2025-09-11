// Integração específica com OpenAI para funcionalidades gerais do sistema
import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface TextAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  summary: string;
}

export interface MarketAnalysisResult {
  analysis: string;
  recommendation: string;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
}

// Análise básica de texto usando OpenAI
export async function analyzeText(text: string): Promise<string> {
  try {
    const prompt = `Please summarize the following text concisely while maintaining key points:\n\n${text}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("❌ Erro na análise de texto OpenAI:", error);
    throw new Error("Falha na análise de texto: " + (error as Error).message);
  }
}

// Análise de sentimento
export async function analyzeSentiment(text: string): Promise<TextAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content:
            "You are a sentiment analysis expert. Analyze the sentiment of the text and provide a rating (positive/negative/neutral), confidence score between 0 and 1, and a brief summary. Respond with JSON in this format: { 'sentiment': 'positive'|'negative'|'neutral', 'confidence': number, 'summary': 'text' }",
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      sentiment: result.sentiment || 'neutral',
      confidence: Math.max(0, Math.min(1, result.confidence || 0)),
      summary: result.summary || "Análise não disponível",
    };
  } catch (error) {
    console.error("❌ Erro na análise de sentimento:", error);
    throw new Error("Falha na análise de sentimento: " + (error as Error).message);
  }
}

// Análise de imagem
export async function analyzeImage(base64Image: string): Promise<string> {
  try {
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analise esta imagem em detalhes e descreva seus elementos principais, contexto e qualquer aspecto relevante para trading ou análise financeira."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      max_tokens: 500,
    });

    return visionResponse.choices[0].message.content || "Análise não disponível";
  } catch (error) {
    console.error("❌ Erro na análise de imagem:", error);
    throw new Error("Falha na análise de imagem: " + (error as Error).message);
  }
}

// Geração de imagem
export async function generateImage(text: string): Promise<{ url: string }> {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: text,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return { url: response.data?.[0]?.url || "" };
  } catch (error) {
    console.error("❌ Erro na geração de imagem:", error);
    throw new Error("Falha na geração de imagem: " + (error as Error).message);
  }
}

// Análise de mercado específica para trading
export async function analyzeMarketData(
  asset: string, 
  timeframe: string, 
  additionalContext?: string
): Promise<MarketAnalysisResult> {
  try {
    const prompt = `
Como especialista em análise financeira, analise o ativo ${asset} no timeframe ${timeframe}.
${additionalContext ? `Contexto adicional: ${additionalContext}` : ''}

Forneça:
1. Análise técnica e fundamentalista
2. Recomendação de posicionamento
3. Nível de confiança (0-1)
4. Nível de risco (low/medium/high)

Responda em JSON no formato: {
  "analysis": "análise detalhada",
  "recommendation": "recomendação específica",
  "confidence": número entre 0 e 1,
  "riskLevel": "low"|"medium"|"high"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "Você é um analista financeiro especializado em trading. Forneça análises objetivas e baseadas em dados."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      analysis: result.analysis || "Análise não disponível",
      recommendation: result.recommendation || "Recomendação não disponível",
      confidence: Math.max(0, Math.min(1, result.confidence || 0)),
      riskLevel: result.riskLevel || 'medium',
    };
  } catch (error) {
    console.error("❌ Erro na análise de mercado:", error);
    throw new Error("Falha na análise de mercado: " + (error as Error).message);
  }
}

// Transcrição de áudio (para notas de voz de trading)
import fs from "fs";
export async function transcribeAudio(audioFilePath: string): Promise<{ text: string, duration: number }> {
  try {
    const audioReadStream = fs.createReadStream(audioFilePath);

    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
    });

    return {
      text: transcription.text,
      duration: 0, // Duration não está disponível na API atual
    };
  } catch (error) {
    console.error("❌ Erro na transcrição de áudio:", error);
    throw new Error("Falha na transcrição de áudio: " + (error as Error).message);
  }
}