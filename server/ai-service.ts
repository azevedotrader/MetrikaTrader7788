import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface TradeAnalysis {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  suggestion: string;
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface MarketInsight {
  asset: string;
  analysis: string;
  suggestion: string;
  timeframe: string;
  confidence: number;
}

export interface TradingAdvice {
  type: 'suggestion' | 'warning' | 'opportunity' | 'analysis';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  asset?: string;
}

export class AITradingService {
  
  async analyzeUserTrade(tradeData: {
    ativo: string;
    mercado: string;
    setup: string;
    tipo: string;
    alvo: number;
    stop: number;
    emocao?: string;
    comentario?: string;
  }): Promise<TradeAnalysis> {
    try {
      const prompt = `
        Analise este trade planejado como um especialista em trading:
        
        Ativo: ${tradeData.ativo}
        Mercado: ${tradeData.mercado}
        Setup: ${tradeData.setup}
        Tipo: ${tradeData.tipo}
        Alvo: R$ ${tradeData.alvo}
        Stop: R$ ${tradeData.stop}
        Emoção: ${tradeData.emocao || 'Não informada'}
        Comentário: ${tradeData.comentario || 'Nenhum'}
        
        Forneça uma análise completa com:
        1. Sentiment (bullish/bearish/neutral)
        2. Nível de confiança (0-1)
        3. Sugestão específica
        4. Nível de risco (low/medium/high)
        5. Recomendação final
        
        Responda em JSON no formato: {
          "sentiment": "bullish|bearish|neutral",
          "confidence": number,
          "suggestion": "string",
          "riskLevel": "low|medium|high", 
          "recommendation": "string"
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em trading brasileiro, analista de mercado experiente. Forneça análises práticas e diretas em português brasileiro."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Erro na análise de trade:', error);
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        suggestion: 'Análise temporariamente indisponível. Revise seu setup e continue com cautela.',
        riskLevel: 'medium',
        recommendation: 'Mantenha o foco na sua estratégia original.'
      };
    }
  }

  async generateMarketInsight(asset: string): Promise<MarketInsight> {
    try {
      const prompt = `
        Como especialista em análise técnica e fundamentalista, forneça insights sobre o ativo ${asset}.
        
        Analise:
        - Tendência atual
        - Pontos de entrada/saída
        - Níveis de suporte e resistência
        - Cenário macro relevante
        - Recomendação de timeframe
        
        Responda em JSON: {
          "asset": "${asset}",
          "analysis": "análise detalhada",
          "suggestion": "sugestão específica",
          "timeframe": "timeframe recomendado",
          "confidence": number_0_to_1
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Você é um analista de mercado brasileiro experiente. Forneça análises práticas em português brasileiro, focando em ações brasileiras, forex e crypto."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Erro na análise de mercado:', error);
      return {
        asset,
        analysis: 'Análise de mercado temporariamente indisponível.',
        suggestion: 'Consulte outras fontes de análise técnica.',
        timeframe: '1h',
        confidence: 0.3
      };
    }
  }

  async chatWithTrader(userMessage: string, context?: any): Promise<string> {
    try {
      const contextInfo = context ? `
        Contexto do usuário:
        - Perfil de risco: ${context.perfilRisco || 'não definido'}
        - Capital inicial: R$ ${context.capitalInicial || '0'}
        - Meta mensal: ${context.metaMensal || '0'}%
        - Trades recentes: ${context.tradesCount || 0}
      ` : '';

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Você é um mentor experiente de trading brasileiro. Ajude o trader com:
            - Estratégias de trading
            - Gestão de risco
            - Psicologia do trading
            - Análise técnica e fundamentalista
            - Dicas práticas
            
            Seja direto, prático e motivacional. Use português brasileiro.
            ${contextInfo}`
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      });

      return response.choices[0].message.content || 'Desculpe, não consegui processar sua mensagem no momento.';
    } catch (error) {
      console.error('Erro no chat:', error);
      return 'Desculpe, o assistente está temporariamente indisponível. Tente novamente em alguns instantes.';
    }
  }

  async generateTradingAdvice(userProfile: any, recentTrades: any[]): Promise<TradingAdvice[]> {
    try {
      const prompt = `
        Analise este perfil de trader e forneça 3-5 conselhos personalizados:
        
        Perfil:
        - Risco: ${userProfile.perfilRisco || 'moderado'}
        - Capital: R$ ${userProfile.capitalInicial || '0'}
        - Meta: ${userProfile.metaMensal || '5'}%
        - Trades recentes: ${recentTrades.length}
        
        Trades recentes: ${JSON.stringify(recentTrades.slice(0, 5))}
        
        Forneça conselhos em JSON: {
          "advice": [
            {
              "type": "suggestion|warning|opportunity|analysis",
              "title": "título curto",
              "message": "mensagem detalhada",
              "priority": "low|medium|high",
              "asset": "ativo específico ou null"
            }
          ]
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Você é um consultor de trading experiente. Forneça conselhos práticos e personalizados em português brasileiro."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6
      });

      const result = JSON.parse(response.choices[0].message.content || '{"advice": []}');
      return result.advice || [];
    } catch (error) {
      console.error('Erro na geração de conselhos:', error);
      return [
        {
          type: 'suggestion',
          title: 'Mantenha a Disciplina',
          message: 'Continue seguindo sua estratégia de trading com disciplina e gestão de risco.',
          priority: 'medium'
        }
      ];
    }
  }

  async analyzeTradingPerformance(trades: any[]): Promise<{
    summary: string;
    insights: string[];
    recommendations: string[];
  }> {
    try {
      const prompt = `
        Analise a performance destes trades como especialista:
        ${JSON.stringify(trades)}
        
        Forneça em JSON:
        {
          "summary": "resumo geral da performance",
          "insights": ["insight1", "insight2", "insight3"],
          "recommendations": ["recomendação1", "recomendação2", "recomendação3"]
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system", 
            content: "Você é um analista de performance de trading. Forneça análises práticas em português brasileiro."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Erro na análise de performance:', error);
      return {
        summary: 'Análise de performance temporariamente indisponível.',
        insights: ['Continue monitorando seus trades.'],
        recommendations: ['Mantenha o foco na sua estratégia.']
      };
    }
  }

  async generateCsvBasedTips(trades: any[], csvImports: any[]): Promise<any[]> {
    try {
      // Analisar todos os trades, priorizando os de CSV mas incluindo todos
      const csvTrades = trades.filter(trade => trade.origem === 'csv');
      const allTrades = trades.length > 0 ? trades : [];
      
      if (allTrades.length === 0) {
        return [];
      }

      // Criar análise estatística dos dados
      const analysis = {
        totalTrades: allTrades.length,
        csvTrades: csvTrades.length,
        winRate: allTrades.filter(t => parseFloat(t.resultado) > 0).length / allTrades.length,
        avgProfit: allTrades.reduce((sum, t) => sum + parseFloat(t.resultado), 0) / allTrades.length,
        brokers: [...new Set(allTrades.map(t => t.corretora))],
        assets: [...new Set(allTrades.map(t => t.ativo))],
        setups: [...new Set(allTrades.map(t => t.setup))],
        recentTrades: allTrades.slice(-5)
      };

      const prompt = `
        Analise estes dados de trading de um usuário brasileiro e forneça 2-3 dicas inteligentes:
        
        ESTATÍSTICAS:
        - Total de trades: ${analysis.totalTrades}
        - Trades de CSV: ${analysis.csvTrades}
        - Taxa de acerto: ${(analysis.winRate * 100).toFixed(1)}%
        - Resultado médio: R$ ${analysis.avgProfit.toFixed(2)}
        - Corretoras: ${analysis.brokers.join(', ')}
        - Principais ativos: ${analysis.assets.slice(0, 5).join(', ')}
        - Setups utilizados: ${analysis.setups.join(', ')}
        
        TRADES RECENTES:
        ${JSON.stringify(analysis.recentTrades, null, 2)}
        
        IMPORTAÇÕES CSV:
        ${JSON.stringify(csvImports, null, 2)}
        
        Como especialista em trading, forneça dicas personalizadas baseadas nos PADRÕES REAIS do usuário.
        
        Responda APENAS com JSON válido:
        {
          "tips": [
            {
              "id": "tip_1",
              "title": "Título Específico",
              "message": "Dica detalhada baseada nos dados analisados",
              "type": "warning",
              "priority": "high",
              "action": "Ação específica sugerida",
              "basedOn": "Padrão identificado nos dados"
            }
          ]
        }
        
        Foque em padrões como:
        - Performance por setup/corretora
        - Gestão de risco (stop-loss)
        - Horários de melhor performance
        - Diversificação de ativos
        - Consistência de resultados
        
        Máximo 3 dicas específicas e acionáveis.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "Você é um mentor de trading experiente no mercado brasileiro. Analise dados reais e forneça conselhos práticos e específicos em português brasileiro. Responda sempre em JSON válido." 
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1200,
        temperature: 0.7
      });

      const content = response.choices[0].message.content;
      
      if (!content) {
        return this.generateFallbackTips(analysis);
      }

      const result = JSON.parse(content);
      
      return result.tips || this.generateFallbackTips(analysis);
    } catch (error) {
      console.error('Erro na geração de dicas baseadas em CSV:', error);
      return this.generateFallbackTips({ totalTrades: trades.length, winRate: 0.5 });
    }
  }

  private generateFallbackTips(analysis: any): any[] {
    const tips = [];
    
    if (analysis.winRate < 0.6) {
      tips.push({
        id: "improve_winrate",
        title: "Melhore sua Taxa de Acerto",
        message: `Com ${(analysis.winRate * 100).toFixed(1)}% de acerto, considere revisar seus critérios de entrada. Analise os trades perdedores para identificar padrões.`,
        type: "warning",
        priority: "high",
        action: "Revise seus setups e critérios de entrada",
        basedOn: "Taxa de acerto abaixo de 60%"
      });
    }
    
    if (analysis.totalTrades > 0) {
      tips.push({
        id: "keep_journal",
        title: "Mantenha um Diário Detalhado",
        message: "Continue registrando seus trades. Use o diário para anotar o contexto emocional e de mercado de cada operação.",
        type: "info",
        priority: "medium",
        action: "Use a seção 'Diário do Trader' regularmente",
        basedOn: "Presença de dados históricos"
      });
    }
    
    return tips;
  }
}

export const aiService = new AITradingService();