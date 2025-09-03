import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
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
        model: "gpt-4o", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
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
        response_format: { type: "json_object" }
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
        model: "gpt-4o", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
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
        response_format: { type: "json_object" }
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

  async chatWithTrader(userMessage: string, context?: any, language: string = 'pt'): Promise<string> {
    try {
      const contextInfo = context ? `
        Contexto do usuário:
        - Perfil de risco: ${context.perfilRisco || 'não definido'}
        - Capital inicial: R$ ${context.capitalInicial || '0'}
        - Meta mensal: ${context.metaMensal || '0'}%
        - Trades recentes: ${context.tradesCount || 0}
      ` : '';
      // Prompts específicos por idioma
      const systemPrompts = {
        pt: `Você é um mentor experiente de trading brasileiro. Ajude o trader com:
            - Estratégias de trading
            - Gestão de risco
            - Psicologia do trading
            - Análise técnica e fundamentalista
            - Dicas práticas
            
            Seja direto, prático e motivacional. Use português brasileiro.
            ${contextInfo}`,
        en: `You are an experienced trading mentor. Help the trader with:
            - Trading strategies
            - Risk management
            - Trading psychology
            - Technical and fundamental analysis
            - Practical tips
            
            Be direct, practical and motivational. Use English.
            ${contextInfo}`,
        es: `Eres un mentor experimentado de trading. Ayuda al trader con:
            - Estrategias de trading
            - Gestión de riesgo
            - Psicología del trading
            - Análisis técnico y fundamental
            - Consejos prácticos
            
            Sé directo, práctico y motivacional. Usa español.
            ${contextInfo}`
      };

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: systemPrompts[language as keyof typeof systemPrompts] || systemPrompts.pt
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        max_tokens: 300
      });

      
      return response.choices[0].message.content || 'Desculpe, não consegui processar sua mensagem no momento.';
    } catch (error) {
      console.error('❌ ERRO DETALHADO NO CHAT:', error);
      if (error instanceof Error) {
        console.error('❌ ERRO MESSAGE:', error.message);
        console.error('❌ ERRO STACK:', error.stack);
      }
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
        model: "gpt-4o", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
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
        response_format: { type: "json_object" }
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
        model: "gpt-4o", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
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
        response_format: { type: "json_object" }
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

      console.log(`🔍 Análise AI otimizada para ${allTrades.length} trades`);

      // ESTRATÉGIA: Análise em múltiplas etapas para grandes volumes
      if (allTrades.length > 100) {
        return await this.generateAdvancedCsvAnalysis(allTrades, csvImports);
      } else {
        return await this.generateStandardCsvAnalysis(allTrades, csvImports);
      }
    } catch (error) {
      console.error('Erro na geração de dicas baseadas em CSV:', error);
      return this.generateEnhancedFallbackTips(trades, csvImports);
    }
  }

  private async generateAdvancedCsvAnalysis(trades: any[], csvImports: any[]): Promise<any[]> {
    try {
      // ETAPA 1: Análise pré-processada mais eficiente
      const insights = this.generateKeyInsights(trades);
      
      // ETAPA 2: Prompt otimizado com dados resumidos
      const summaryData = this.createOptimizedSummary(insights, trades, csvImports);
      
      const promptText = `
        ANÁLISE PROFISSIONAL DE TRADING - ${trades.length} OPERAÇÕES

        === DADOS PRINCIPAIS ===
        📊 Total: ${trades.length} trades | 📅 Período: ${this.getDateRange(trades)}
        💰 Resultado Total: R$ ${insights.performance.totalProfit.toFixed(2)}
        📈 Win Rate: ${(insights.performance.winRate * 100).toFixed(1)}%
        🎯 Profit Factor: ${insights.performance.profitFactor.toFixed(2)}
        💥 Max Drawdown: R$ ${insights.risk.maxDrawdown.toFixed(2)}

        === INSIGHTS CRÍTICOS ===
        🔥 MELHOR PERFORMANCE: ${insights.temporal.bestDay.name} (R$ ${insights.temporal.bestDay.avgResult.toFixed(2)}/trade)
        ❌ PIOR PERFORMANCE: ${insights.temporal.worstDay.name} (R$ ${insights.temporal.worstDay.avgResult.toFixed(2)}/trade)
        ⭐ ATIVO MAIS LUCRATIVO: ${insights.assets.bestAsset.name} (${insights.assets.bestAsset.winRate.toFixed(1)}% winrate)
        💸 SETUP MAIS PROBLEMÁTICO: ${insights.assets.worstSetup.name} (${insights.assets.worstSetup.winRate.toFixed(1)}% winrate)

        === PADRÕES DETECTADOS ===
        • Horário Dourado: ${insights.temporal.bestHour} (melhor performance)
        • Zona de Perigo: ${insights.temporal.worstHour} (pior performance)
        • Stop Loss: Usado em ${(insights.risk.stopUsage * 100).toFixed(1)}% das operações
        • Overtrading: ${insights.psychological.overtrading ? 'DETECTADO' : 'Controlado'}
        • Revenge Trading: ${insights.psychological.revengeTrading ? 'DETECTADO' : 'Controlado'}

        === ANÁLISE COMPORTAMENTAL ===
        ${this.formatBehavioralInsights(insights.psychological)}

        MISSÃO: Baseado nesses DADOS REAIS, forneça 6-8 insights ESPECÍFICOS e ACIONÁVEIS para transformar a performance deste trader.

        Responda em JSON válido:
        {
          "tips": [
            {
              "id": "insight_001",
              "title": "Título específico baseado nos dados (ex: 'Pare de Operar nas ${insights.temporal.worstDay.name}s')",
              "message": "Análise detalhada de 180-300 palavras com DADOS ESPECÍFICOS do trader. Explique o problema, cite números reais, mostre o impacto financeiro e justifique cientificamente.",
              "type": "critical|warning|opportunity|suggestion",
              "priority": "high|medium|low",
              "action": "Ação ULTRA-ESPECÍFICA: quando fazer, como fazer, qual critério usar. Seja extremamente prático.",
              "basedOn": "Dados EXATOS que provam este ponto (números, percentuais, comparações)",
              "impact": "Estimativa QUANTITATIVA do benefício desta mudança",
              "metrics": "Métricas PRECISAS que justificam (valores absolutos, relativos, períodos)"
            }
          ]
        }

        FOQUE em problemas REAIS com soluções ESPECÍFICAS. Use os dados do trader!
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { 
            role: "system", 
            content: "Você é um analista quantitativo ELITE com 20+ anos analisando traders do mercado brasileiro. Especialista em detectar padrões ocultos, vieses comportamentais e oportunidades de otimização. SEMPRE use dados específicos do trader - números reais, não teoria genérica. Português brasileiro, análise brutal mas construtiva." 
          },
          { role: "user", content: promptText }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 4000
      });

      const content = response.choices[0].message.content;
      if (!content) {
        return this.generateEnhancedFallbackTips(trades, csvImports);
      }

      const result = JSON.parse(content);
      return result.tips || this.generateEnhancedFallbackTips(trades, csvImports);

    } catch (error) {
      console.error('Erro na análise avançada:', error);
      return this.generateEnhancedFallbackTips(trades, csvImports);
    }
  }

  private async generateStandardCsvAnalysis(trades: any[], csvImports: any[]): Promise<any[]> {
    try {
      // Análise padrão para volumes menores
      const insights = this.generateKeyInsights(trades);
      
      const promptText = `
        ANÁLISE DETALHADA - ${trades.length} TRADES

        Performance: ${(insights.performance.winRate * 100).toFixed(1)}% win rate, R$ ${insights.performance.totalProfit.toFixed(2)} total
        Melhor dia: ${insights.temporal.bestDay.name} | Pior dia: ${insights.temporal.worstDay.name}
        Melhor ativo: ${insights.assets.bestAsset.name} | Pior setup: ${insights.assets.worstSetup.name}
        
        Forneça 5-6 insights específicos em JSON com análises detalhadas e ações práticas.
        Use os dados reais do trader para justificar cada recomendação.

        {
          "tips": [
            {
              "id": "string",
              "title": "string específico",
              "message": "análise detalhada 150+ palavras com dados",
              "type": "critical|warning|opportunity|suggestion",
              "priority": "high|medium|low",
              "action": "ação específica e prática",
              "basedOn": "dados que justificam",
              "impact": "resultado esperado",
              "metrics": "métricas exatas"
            }
          ]
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { 
            role: "system", 
            content: "Analista quantitativo especialista em trading brasileiro. Forneça insights específicos baseados em dados reais." 
          },
          { role: "user", content: promptText }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 3000
      });

      const content = response.choices[0].message.content;
      if (!content) {
        return this.generateEnhancedFallbackTips(trades, csvImports);
      }

      const result = JSON.parse(content);
      return result.tips || this.generateEnhancedFallbackTips(trades, csvImports);

    } catch (error) {
      console.error('Erro na análise padrão:', error);
      return this.generateEnhancedFallbackTips(trades, csvImports);
    }
  }

  // FUNÇÕES AUXILIARES PARA ANÁLISE OTIMIZADA

  private generateKeyInsights(trades: any[]) {
    // Análise de performance mais enxuta
    const profits = trades.map(t => parseFloat(t.resultado)).filter(r => r > 0);
    const losses = trades.map(t => parseFloat(t.resultado)).filter(r => r < 0);
    const allResults = trades.map(t => parseFloat(t.resultado));
    
    const performance = {
      totalTrades: trades.length,
      winRate: profits.length / trades.length,
      avgWin: profits.length > 0 ? profits.reduce((a, b) => a + b, 0) / profits.length : 0,
      avgLoss: losses.length > 0 ? Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length) : 0,
      totalProfit: allResults.reduce((a, b) => a + b, 0),
      profitFactor: 0
    };
    
    performance.profitFactor = performance.avgLoss > 0 ? 
      (performance.avgWin * profits.length) / (performance.avgLoss * losses.length) : 0;

    // Análise temporal simplificada
    const dayStats = this.groupAndAnalyze(trades, (trade) => {
      const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      return days[new Date(trade.dataHora).getDay()];
    });
    
    const hourStats = this.groupAndAnalyze(trades, (trade) => {
      return `${new Date(trade.dataHora).getHours()}h`;
    });

    const temporal = {
      bestDay: this.getBestPerformer(dayStats) || { name: 'N/A', avgResult: 0, winRate: 0 },
      worstDay: this.getWorstPerformer(dayStats) || { name: 'N/A', avgResult: 0, winRate: 0 },
      bestHour: this.getBestPerformer(hourStats)?.name || 'N/A',
      worstHour: this.getWorstPerformer(hourStats)?.name || 'N/A'
    };

    // Análise de ativos simplificada
    const assetStats = this.groupAndAnalyze(trades, (trade) => trade.ativo);
    const setupStats = this.groupAndAnalyze(trades, (trade) => trade.setup);

    const assets = {
      bestAsset: this.getBestPerformer(assetStats) || { name: 'N/A', avgResult: 0, winRate: 0 },
      worstAsset: this.getWorstPerformer(assetStats) || { name: 'N/A', avgResult: 0, winRate: 0 },
      bestSetup: this.getBestPerformer(setupStats) || { name: 'N/A', avgResult: 0, winRate: 0 },
      worstSetup: this.getWorstPerformer(setupStats) || { name: 'N/A', avgResult: 0, winRate: 0 }
    };

    // Análise de risco simplificada
    const tradesWithStop = trades.filter(t => t.stop && parseFloat(t.stop) > 0);
    const sortedResults = [...allResults].sort((a, b) => a - b);
    
    const risk = {
      stopUsage: tradesWithStop.length / trades.length,
      maxDrawdown: this.calculateSimpleMaxDrawdown(allResults),
      volatility: this.calculateSimpleStandardDeviation(allResults)
    };

    // Análise psicológica simplificada
    const psychological = {
      overtrading: this.detectSimpleOvertrading(trades),
      revengeTrading: this.detectSimpleRevengeTrading(trades),
      emotionalPatterns: this.getSimpleEmotionalSummary(trades)
    };

    return { performance, temporal, assets, risk, psychological };
  }

  private createOptimizedSummary(insights: any, trades: any[], csvImports: any[]) {
    return {
      basicStats: {
        totalTrades: insights.performance.totalTrades,
        winRate: insights.performance.winRate,
        totalProfit: insights.performance.totalProfit,
        profitFactor: insights.performance.profitFactor
      },
      keyFindings: {
        bestDay: insights.temporal.bestDay.name,
        worstDay: insights.temporal.worstDay.name,
        bestAsset: insights.assets.bestAsset.name,
        worstSetup: insights.assets.worstSetup.name
      },
      riskProfile: {
        maxDrawdown: insights.risk.maxDrawdown,
        stopUsage: insights.risk.stopUsage,
        volatility: insights.risk.volatility
      }
    };
  }

  private formatBehavioralInsights(psychological: any): string {
    let insights = [];
    
    if (psychological.overtrading) {
      insights.push("⚠️ OVERTRADING: Detectado excesso de operações em períodos específicos");
    }
    
    if (psychological.revengeTrading) {
      insights.push("💢 REVENGE TRADING: Padrão de vingança após perdas detectado");
    }
    
    if (psychological.emotionalPatterns.length > 0) {
      insights.push(`🧠 PADRÕES EMOCIONAIS: ${psychological.emotionalPatterns.join(', ')}`);
    }
    
    return insights.length > 0 ? insights.join('\n        ') : 'Sem padrões comportamentais críticos detectados';
  }

  private generateEnhancedFallbackTips(trades: any[], csvImports: any[]): any[] {
    const performance = this.generateKeyInsights(trades).performance;
    
    const tips = [];
    
    if (performance.winRate < 0.6) {
      tips.push({
        id: "improve_winrate",
        title: "Melhore sua Taxa de Acerto",
        message: `Sua taxa de acerto atual de ${(performance.winRate * 100).toFixed(1)}% está abaixo do ideal. Traders consistentes mantêm taxas acima de 60%. Isso indica que seus critérios de entrada precisam ser refinados. Considere: 1) Aguardar confirmações mais sólidas antes de entrar, 2) Revisar seus indicadores técnicos, 3) Analisar os trades perdedores para identificar padrões comuns. Uma melhoria de 10% na taxa de acerto pode representar um aumento significativo na rentabilidade.`,
        type: "warning",
        priority: "high",
        action: "Analise seus últimos 20 trades perdedores e identifique 3 padrões comuns. Ajuste seus critérios de entrada baseado nessa análise.",
        basedOn: `Taxa de acerto de ${(performance.winRate * 100).toFixed(1)}% em ${performance.totalTrades} trades`,
        impact: "Melhoria de 10% na taxa de acerto pode aumentar lucros em 25-40%",
        metrics: `Win Rate: ${(performance.winRate * 100).toFixed(1)}% | Trades: ${performance.totalTrades} | Meta: >60%`
      });
    }

    if (performance.profitFactor < 1.5) {
      tips.push({
        id: "improve_profit_factor",
        title: "Otimize sua Relação Risco/Retorno",
        message: `Seu Profit Factor de ${performance.profitFactor.toFixed(2)} indica que seus ganhos médios não compensam adequadamente suas perdas. O ideal é manter acima de 1.5. Isso pode ser melhorado através de: 1) Targets mais ambiciosos em trades com alta probabilidade, 2) Stops mais apertados quando possível, 3) Saídas parciais para garantir lucros. Foque em maximizar seus winners e minimizar seus losers.`,
        type: "opportunity",
        priority: "high",
        action: "Revise suas saídas: defina targets mais ambiciosos para seus setups de maior confiança e considere saídas parciais.",
        basedOn: `Profit Factor: ${performance.profitFactor.toFixed(2)} | Ganho médio: R$ ${performance.avgWin.toFixed(2)} | Perda média: R$ ${performance.avgLoss.toFixed(2)}`,
        impact: "Melhoria no Profit Factor pode dobrar sua rentabilidade mensal",
        metrics: `PF Atual: ${performance.profitFactor.toFixed(2)} | Meta: >1.5 | Trades: ${performance.totalTrades}`
      });
    }

    if (performance.totalProfit > 0) {
      tips.push({
        id: "maintain_consistency",
        title: "Mantenha a Consistência",
        message: `Você está lucrativo com R$ ${performance.totalProfit.toFixed(2)} em ${performance.totalTrades} trades. Isso demonstra que sua estratégia tem fundamentos sólidos. O próximo passo é focar na consistência: evite overtrading, mantenha disciplina nos stops, e documente todas as operações. Traders consistentes crescem de forma sustentável ao longo do tempo.`,
        type: "suggestion",
        priority: "medium",
        action: "Continue seguindo seu plano de trading atual. Documente cada trade com o contexto emocional e de mercado.",
        basedOn: `Resultado positivo: R$ ${performance.totalProfit.toFixed(2)} em ${performance.totalTrades} trades`,
        impact: "Manutenção da consistência garante crescimento sustentável",
        metrics: `Lucro Total: R$ ${performance.totalProfit.toFixed(2)} | Win Rate: ${(performance.winRate * 100).toFixed(1)}%`
      });
    }

    // Dica específica baseada no volume de trades do CSV
    if (csvImports.length > 0 && trades.length > 50) {
      tips.push({
        id: "csv_analysis_value",
        title: "Aproveite o Histórico Importado",
        message: `Você importou um histórico valioso de ${trades.length} trades através do CSV. Este volume de dados permite análises estatísticas profundas que podem revelar padrões ocultos em sua operação. Use esta base histórica para identificar seus melhores horários, dias da semana, ativos e setups. Dados históricos são o combustível para otimização contínua.`,
        type: "opportunity",
        priority: "medium",
        action: "Analise semanalmente seus dados históricos para identificar padrões temporais e de performance por ativo.",
        basedOn: `${trades.length} trades importados de ${csvImports.map(c => c.fileName).join(', ')}`,
        impact: "Análise de padrões históricos pode melhorar performance em 15-25%",
        metrics: `CSV Importado: ${trades.length} trades | Fonte: ${csvImports.length} arquivo(s)`
      });
    }

    return tips;
  }

  private generateFallbackTips(analysis: any): any[] {
    // Versão simplificada para compatibilidade
    return this.generateEnhancedFallbackTips([], []);
  }

  // FUNÇÕES AUXILIARES PARA CÁLCULOS

  private calculateSimpleMaxDrawdown(results: number[]): number {
    if (results.length === 0) return 0;
    
    let maxDrawdown = 0;
    let peak = results[0];
    let cumulative = 0;
    
    for (const result of results) {
      cumulative += result;
      if (cumulative > peak) {
        peak = cumulative;
      }
      const drawdown = peak - cumulative;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    return maxDrawdown;
  }

  private calculateSimpleStandardDeviation(results: number[]): number {
    if (results.length <= 1) return 0;
    
    const mean = results.reduce((sum, val) => sum + val, 0) / results.length;
    const variance = results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (results.length - 1);
    
    return Math.sqrt(variance);
  }

  private detectSimpleOvertrading(trades: any[]): boolean {
    if (trades.length < 10) return false;
    
    // Detecta se há muitas operações em um período curto
    const tradesPerDay: { [key: string]: number } = {};
    
    trades.forEach(trade => {
      const date = new Date(trade.dataHora).toDateString();
      tradesPerDay[date] = (tradesPerDay[date] || 0) + 1;
    });
    
    const dailyCounts = Object.values(tradesPerDay);
    const avgPerDay = dailyCounts.reduce((sum, count) => sum + count, 0) / dailyCounts.length;
    
    // Se algum dia teve mais que 3x a média, considera overtrading
    return dailyCounts.some(count => count > avgPerDay * 3 && count > 10);
  }

  private detectSimpleRevengeTrading(trades: any[]): boolean {
    if (trades.length < 5) return false;
    
    // Ordena trades por data
    const sortedTrades = trades.sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());
    
    let revengeSequences = 0;
    
    for (let i = 1; i < sortedTrades.length; i++) {
      const prevTrade = sortedTrades[i - 1];
      const currentTrade = sortedTrades[i];
      
      const prevResult = parseFloat(prevTrade.resultado);
      const currentCapital = parseFloat(currentTrade.capitalUtilizado);
      const prevCapital = parseFloat(prevTrade.capitalUtilizado);
      
      // Se perdeu no trade anterior e aumentou muito o capital no próximo
      if (prevResult < 0 && currentCapital > prevCapital * 1.5) {
        revengeSequences++;
      }
    }
    
    // Se mais de 20% dos trades mostram padrão de vingança
    return revengeSequences / trades.length > 0.2;
  }

  private getSimpleEmotionalSummary(trades: any[]): string[] {
    const patterns: string[] = [];
    
    const emotionTrades = trades.filter(t => t.emocao);
    if (emotionTrades.length === 0) return patterns;
    
    const emotionCounts: { [key: string]: { count: number, losses: number } } = {};
    
    emotionTrades.forEach(trade => {
      const emotion = trade.emocao;
      const result = parseFloat(trade.resultado);
      
      if (!emotionCounts[emotion]) {
        emotionCounts[emotion] = { count: 0, losses: 0 };
      }
      
      emotionCounts[emotion].count++;
      if (result < 0) {
        emotionCounts[emotion].losses++;
      }
    });
    
    // Identifica emoções problemáticas
    Object.entries(emotionCounts).forEach(([emotion, stats]) => {
      const lossRate = stats.losses / stats.count;
      if (lossRate > 0.7 && stats.count >= 3) {
        patterns.push(`${emotion} (${(lossRate * 100).toFixed(0)}% perdas)`);
      }
    });
    
    return patterns;
  }

  // Métodos de análise profunda
  private analyzeTemporalPatterns(trades: any[]) {
    const dayOfWeekStats = this.groupAndAnalyze(trades, (trade) => {
      const date = new Date(trade.dataHora);
      const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      return days[date.getDay()];
    });

    const hourStats = this.groupAndAnalyze(trades, (trade) => {
      const hour = new Date(trade.dataHora).getHours();
      return `${hour}h`;
    });

    const monthStats = this.groupAndAnalyze(trades, (trade) => {
      const date = new Date(trade.dataHora);
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return months[date.getMonth()];
    });

    return {
      dayOfWeek: dayOfWeekStats,
      hourly: hourStats,
      monthly: monthStats,
      bestDay: this.getBestPerformer(dayOfWeekStats)?.name || 'N/A',
      worstDay: this.getWorstPerformer(dayOfWeekStats)?.name || 'N/A',
      bestHour: this.getBestPerformer(hourStats)?.name || 'N/A',
      worstHour: this.getWorstPerformer(hourStats)?.name || 'N/A'
    };
  }

  private analyzeDetailedPerformance(trades: any[]) {
    const profits = trades.map(t => parseFloat(t.resultado)).filter(r => r > 0);
    const losses = trades.map(t => parseFloat(t.resultado)).filter(r => r < 0);
    const allResults = trades.map(t => parseFloat(t.resultado));
    
    const winRate = profits.length / trades.length;
    const avgWin = profits.length > 0 ? profits.reduce((a, b) => a + b, 0) / profits.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length) : 0;
    const profitFactor = avgLoss > 0 ? (avgWin * profits.length) / (avgLoss * losses.length) : 0;
    
    // Análise de consistência
    const monthlyResults = this.groupTradesByMonth(trades);
    const monthlyProfits = Object.values(monthlyResults).map((month: any) => 
      month.reduce((sum: number, trade: any) => sum + parseFloat(trade.resultado), 0)
    );
    
    return {
      totalTrades: trades.length,
      winRate: winRate,
      avgWin: avgWin,
      avgLoss: avgLoss,
      profitFactor: profitFactor,
      largestWin: Math.max(...profits),
      largestLoss: Math.min(...losses),
      totalProfit: allResults.reduce((a, b) => a + b, 0),
      consistency: this.calculateConsistency(monthlyProfits),
      monthlyResults: monthlyResults,
      sharpeRatio: this.calculateSharpeRatio(allResults)
    };
  }

  private analyzeAssetsAndSetups(trades: any[]) {
    const assetStats = this.groupAndAnalyze(trades, (trade) => trade.ativo);
    const setupStats = this.groupAndAnalyze(trades, (trade) => trade.setup);
    const brokerStats = this.groupAndAnalyze(trades, (trade) => trade.corretora);
    
    return {
      assets: assetStats,
      setups: setupStats,
      brokers: brokerStats,
      bestAsset: this.getBestPerformer(assetStats)?.name || 'N/A',
      worstAsset: this.getWorstPerformer(assetStats)?.name || 'N/A',
      bestSetup: this.getBestPerformer(setupStats)?.name || 'N/A',
      worstSetup: this.getWorstPerformer(setupStats)?.name || 'N/A',
      diversification: {
        assetsCount: Object.keys(assetStats).length,
        setupsCount: Object.keys(setupStats).length,
        concentration: this.calculateConcentration(assetStats)
      }
    };
  }

  private analyzeRiskAndDrawdown(trades: any[]) {
    const sortedTrades = trades.sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());
    const cumulativeResults: number[] = [];
    let runningSum = 0;
    
    sortedTrades.forEach(trade => {
      runningSum += parseFloat(trade.resultado);
      cumulativeResults.push(runningSum);
    });
    
    const drawdowns = this.calculateDrawdowns(cumulativeResults);
    const maxDrawdown = Math.min(...drawdowns);
    
    // Análise de stop loss
    const tradesWithStop = trades.filter(t => t.stop && parseFloat(t.stop) > 0);
    const stopUsageRate = tradesWithStop.length / trades.length;
    
    return {
      maxDrawdown: maxDrawdown,
      avgDrawdown: drawdowns.reduce((a, b) => a + b, 0) / drawdowns.length,
      stopLossUsage: stopUsageRate,
      riskRewardRatio: this.calculateRiskRewardRatio(trades),
      volatility: this.calculateVolatility(trades.map(t => parseFloat(t.resultado))),
      consecutiveLosses: this.getMaxConsecutiveLosses(trades),
      recoveryTime: this.calculateRecoveryTime(cumulativeResults, drawdowns)
    };
  }

  private analyzePsychologicalPatterns(trades: any[]) {
    const emotionStats: any = {};
    const emotionTrades = trades.filter(t => t.emocao);
    
    emotionTrades.forEach(trade => {
      const emotion = trade.emocao;
      if (!emotionStats[emotion]) {
        emotionStats[emotion] = { count: 0, totalResult: 0, results: [] };
      }
      emotionStats[emotion].count++;
      emotionStats[emotion].totalResult += parseFloat(trade.resultado);
      emotionStats[emotion].results.push(parseFloat(trade.resultado));
    });
    
    // Análise de sequências
    const sequences = this.analyzeWinLossSequences(trades);
    
    return {
      emotionalTrading: emotionStats,
      sequences: sequences,
      overtrading: this.detectOvertrading(trades),
      revengeTrading: this.detectRevengeTrading(trades),
      emotionalControl: this.calculateEmotionalControl(emotionStats)
    };
  }

  private getDateRange(trades: any[]) {
    if (trades.length === 0) return 'Sem dados';
    const dates = trades.map(t => new Date(t.dataHora)).sort((a, b) => a.getTime() - b.getTime());
    const start = dates[0].toLocaleDateString('pt-BR');
    const end = dates[dates.length - 1].toLocaleDateString('pt-BR');
    return `${start} a ${end}`;
  }

  // Métodos auxiliares
  private groupAndAnalyze(trades: any[], groupBy: (trade: any) => string) {
    const groups: any = {};
    trades.forEach(trade => {
      const key = groupBy(trade);
      if (!groups[key]) {
        groups[key] = { count: 0, totalResult: 0, wins: 0, losses: 0, results: [] };
      }
      groups[key].count++;
      const result = parseFloat(trade.resultado);
      groups[key].totalResult += result;
      groups[key].results.push(result);
      if (result > 0) groups[key].wins++;
      else if (result < 0) groups[key].losses++;
    });
    
    // Calcular métricas para cada grupo
    Object.keys(groups).forEach(key => {
      const group = groups[key];
      group.avgResult = group.totalResult / group.count;
      group.winRate = group.wins / group.count;
      group.profitability = group.totalResult;
    });
    
    return groups;
  }

  private getBestPerformer(stats: any) {
    const bestKey = Object.keys(stats).reduce((best, current) => 
      stats[current].profitability > stats[best].profitability ? current : best
    );
    return {
      name: bestKey,
      avgResult: stats[bestKey]?.avgResult || 0,
      winRate: stats[bestKey]?.winRate || 0
    };
  }

  private getWorstPerformer(stats: any) {
    const worstKey = Object.keys(stats).reduce((worst, current) => 
      stats[current].profitability < stats[worst].profitability ? current : worst
    );
    return {
      name: worstKey,
      avgResult: stats[worstKey]?.avgResult || 0,
      winRate: stats[worstKey]?.winRate || 0
    };
  }

  private groupTradesByMonth(trades: any[]) {
    const months: any = {};
    trades.forEach(trade => {
      const date = new Date(trade.dataHora);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (!months[monthKey]) months[monthKey] = [];
      months[monthKey].push(trade);
    });
    return months;
  }

  private calculateConsistency(monthlyProfits: number[]) {
    if (monthlyProfits.length < 2) return 0;
    const mean = monthlyProfits.reduce((a, b) => a + b, 0) / monthlyProfits.length;
    const variance = monthlyProfits.reduce((sum, profit) => sum + Math.pow(profit - mean, 2), 0) / monthlyProfits.length;
    return Math.sqrt(variance); // Desvio padrão (menor = mais consistente)
  }

  private calculateSharpeRatio(results: number[]) {
    const mean = results.reduce((a, b) => a + b, 0) / results.length;
    const variance = results.reduce((sum, result) => sum + Math.pow(result - mean, 2), 0) / results.length;
    const stdDev = Math.sqrt(variance);
    return stdDev > 0 ? mean / stdDev : 0;
  }

  private calculateConcentration(assetStats: any) {
    const total = Object.values(assetStats).reduce((sum: number, asset: any) => sum + asset.count, 0);
    const concentrations = Object.values(assetStats).map((asset: any) => Math.pow(asset.count / total, 2));
    return concentrations.reduce((a: number, b: number) => a + b, 0); // Índice Herfindahl
  }

  private calculateDrawdowns(cumulativeResults: number[]) {
    const drawdowns: number[] = [];
    let peak = cumulativeResults[0];
    
    cumulativeResults.forEach(result => {
      if (result > peak) peak = result;
      drawdowns.push(result - peak);
    });
    
    return drawdowns;
  }

  private calculateRiskRewardRatio(trades: any[]) {
    const wins = trades.filter(t => parseFloat(t.resultado) > 0).map(t => parseFloat(t.resultado));
    const losses = trades.filter(t => parseFloat(t.resultado) < 0).map(t => Math.abs(parseFloat(t.resultado)));
    
    if (wins.length === 0 || losses.length === 0) return 0;
    
    const avgWin = wins.reduce((a, b) => a + b, 0) / wins.length;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / losses.length;
    
    return avgLoss > 0 ? avgWin / avgLoss : 0;
  }

  private calculateVolatility(results: number[]) {
    const mean = results.reduce((a, b) => a + b, 0) / results.length;
    const variance = results.reduce((sum, result) => sum + Math.pow(result - mean, 2), 0) / results.length;
    return Math.sqrt(variance);
  }

  private getMaxConsecutiveLosses(trades: any[]) {
    let maxLosses = 0;
    let currentLosses = 0;
    
    trades.forEach(trade => {
      if (parseFloat(trade.resultado) < 0) {
        currentLosses++;
        maxLosses = Math.max(maxLosses, currentLosses);
      } else {
        currentLosses = 0;
      }
    });
    
    return maxLosses;
  }

  private calculateRecoveryTime(cumulativeResults: number[], drawdowns: number[]) {
    // Tempo médio para recuperar de drawdowns
    return drawdowns.filter(d => d < 0).length; // Simplificado
  }

  private analyzeWinLossSequences(trades: any[]) {
    const sequences = { wins: [] as number[], losses: [] as number[] };
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    
    trades.forEach(trade => {
      const result = parseFloat(trade.resultado);
      if (result > 0) {
        if (currentLossStreak > 0) {
          sequences.losses.push(currentLossStreak);
          currentLossStreak = 0;
        }
        currentWinStreak++;
      } else if (result < 0) {
        if (currentWinStreak > 0) {
          sequences.wins.push(currentWinStreak);
          currentWinStreak = 0;
        }
        currentLossStreak++;
      }
    });
    
    return {
      maxWinStreak: Math.max(...sequences.wins, 0),
      maxLossStreak: Math.max(...sequences.losses, 0),
      avgWinStreak: sequences.wins.length > 0 ? sequences.wins.reduce((a, b) => a + b, 0) / sequences.wins.length : 0,
      avgLossStreak: sequences.losses.length > 0 ? sequences.losses.reduce((a, b) => a + b, 0) / sequences.losses.length : 0
    };
  }

  private detectOvertrading(trades: any[]) {
    // Detectar dias com muitos trades
    const dailyTrades: any = {};
    trades.forEach(trade => {
      const date = new Date(trade.dataHora).toDateString();
      dailyTrades[date] = (dailyTrades[date] || 0) + 1;
    });
    
    const tradeCounts = Object.values(dailyTrades) as number[];
    const avgDailyTrades = tradeCounts.reduce((a, b) => a + b, 0) / tradeCounts.length;
    const maxDailyTrades = Math.max(...tradeCounts);
    
    return {
      avgDailyTrades,
      maxDailyTrades,
      overtradingDays: tradeCounts.filter(count => count > avgDailyTrades * 2).length
    };
  }

  private detectRevengeTrading(trades: any[]) {
    // Detectar padrões de revenge trading
    let revengePatterns = 0;
    
    for (let i = 1; i < trades.length; i++) {
      const prevTrade = trades[i - 1];
      const currentTrade = trades[i];
      
      // Se trade anterior foi perda e o atual foi feito logo depois com maior volume
      if (parseFloat(prevTrade.resultado) < 0 && 
          parseFloat(currentTrade.quantidade) > parseFloat(prevTrade.quantidade) * 1.5) {
        const timeDiff = new Date(currentTrade.dataHora).getTime() - new Date(prevTrade.dataHora).getTime();
        if (timeDiff < 3600000) { // Menos de 1 hora
          revengePatterns++;
        }
      }
    }
    
    return {
      suspectedRevengeTrades: revengePatterns,
      revengeRate: revengePatterns / trades.length
    };
  }

  private calculateEmotionalControl(emotionStats: any) {
    const emotions = Object.keys(emotionStats);
    if (emotions.length === 0) return { score: 0, analysis: 'Sem dados emocionais' };
    
    const negativeEmotions = ['ansioso', 'impulsivo', 'eufórico', 'frustrado'];
    const positiveEmotions = ['confiante', 'calmo', 'neutro'];
    
    let negativeTradeResults = 0;
    let positiveTradeResults = 0;
    
    emotions.forEach(emotion => {
      const avgResult = emotionStats[emotion].totalResult / emotionStats[emotion].count;
      if (negativeEmotions.includes(emotion)) {
        negativeTradeResults += avgResult;
      } else if (positiveEmotions.includes(emotion)) {
        positiveTradeResults += avgResult;
      }
    });
    
    return {
      emotionalImpact: positiveTradeResults - negativeTradeResults,
      dominantEmotion: emotions.reduce((a, b) => 
        emotionStats[a].count > emotionStats[b].count ? a : b
      ),
      emotionalDiversity: emotions.length
    };
  }
}

export const aiService = new AITradingService();