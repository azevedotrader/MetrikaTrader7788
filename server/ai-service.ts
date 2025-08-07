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

      // ANÁLISE TEMPORAL PROFUNDA
      const temporalAnalysis = this.analyzeTemporalPatterns(allTrades);
      
      // ANÁLISE DE PERFORMANCE DETALHADA
      const performanceAnalysis = this.analyzeDetailedPerformance(allTrades);
      
      // ANÁLISE DE ATIVOS E SETUPS
      const assetSetupAnalysis = this.analyzeAssetsAndSetups(allTrades);
      
      // ANÁLISE DE RISCO E DRAWDOWN
      const riskAnalysis = this.analyzeRiskAndDrawdown(allTrades);
      
      // ANÁLISE PSICOLÓGICA E SEQUÊNCIAS
      const psychologicalAnalysis = this.analyzePsychologicalPatterns(allTrades);

      const promptText = `
        Você é um analista quantitativo de trading experiente. Analise PROFUNDAMENTE os dados reais deste trader brasileiro e forneça insights ACIONÁVEIS e ESPECÍFICOS para melhorar sua performance.
        
        === ANÁLISE TEMPORAL DETALHADA ===
        ${JSON.stringify(temporalAnalysis, null, 2)}
        
        === PERFORMANCE E CONSISTÊNCIA ===
        ${JSON.stringify(performanceAnalysis, null, 2)}
        
        === ATIVOS E ESTRATÉGIAS ===
        ${JSON.stringify(assetSetupAnalysis, null, 2)}
        
        === GESTÃO DE RISCO ===
        ${JSON.stringify(riskAnalysis, null, 2)}
        
        === COMPORTAMENTO E PSICOLOGIA ===
        ${JSON.stringify(psychologicalAnalysis, null, 2)}
        
        === RESUMO DOS DADOS ===
        - Total de operações analisadas: ${allTrades.length}
        - Período: ${this.getDateRange(allTrades)}
        - CSV analisado: ${csvImports.map(c => c.fileName).join(', ')}
        
        MISSÃO: Como consultor de trading, analise os PADRÕES REAIS deste trader e forneça orientações CONCRETAS para:
        
        1. MELHORAR A PERFORMANCE:
           - Identifique os melhores e piores dias/horários
           - Analise quais ativos/setups funcionam melhor
           - Detecte inconsistências na execução
        
        2. OTIMIZAR A GESTÃO DE RISCO:
           - Avalie o uso de stop-loss
           - Analise drawdowns e recuperação
           - Identifique overtrading ou revenge trading
        
        3. CORRIGIR COMPORTAMENTOS:
           - Detecte padrões emocionais prejudiciais
           - Sugira mudanças na rotina de trading
           - Proponha melhorias na disciplina
        
        IMPORTANTE: Seja ESPECÍFICO com os dados! Use números reais, percentuais, valores. NÃO dê conselhos genéricos.
        
        Responda EXCLUSIVAMENTE em JSON válido:
        {
          "tips": [
            {
              "id": "insight_001",
              "title": "Título claro e direto (ex: 'Evite Operar nas Segundas-feiras')",
              "message": "Análise DETALHADA de 150-250 palavras explicando o problema identificado, por que é importante e como impacta os resultados. Use dados específicos do trader.",
              "type": "critical|warning|opportunity|suggestion",
              "priority": "high|medium|low",
              "action": "Ação CONCRETA e ESPECÍFICA que o trader deve implementar. Seja prático: quando, como, o que fazer exatamente.",
              "basedOn": "Dados ESPECÍFICOS que justificam esta recomendação (ex: 'Segundas: -2.450 resultado, 25% winrate vs Quintas: +3.200, 65% winrate')",
              "impact": "Resultado ESPERADO desta mudança com estimativas quantitativas quando possível",
              "metrics": "Métricas EXATAS do trader que justificam a dica (valores, percentuais, quantidades)"
            }
          ]
        }
        
        GERE 5-7 DICAS PROFUNDAS, cada uma focada em um aspecto diferente (temporal, ativos, risco, psicológico, etc.).
        Seja BRUTAL na análise - aponte problemas reais e dê soluções práticas!
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "Você é um analista quantitativo e mentor de trading com 15+ anos de experiência no mercado brasileiro. Especialista em análise de dados históricos, padrões comportamentais e otimização de estratégias. Forneça análises PROFUNDAS e ESPECÍFICAS baseadas em dados reais, não conselhos genéricos. Use português brasileiro e seja direto nos insights." 
          },
          { role: "user", content: promptText }
        ],
        response_format: { type: "json_object" },
        max_tokens: 3000,
        temperature: 0.3
      });

      const content = response.choices[0].message.content;
      
      if (!content) {
        return this.generateFallbackTips(performanceAnalysis);
      }

      const result = JSON.parse(content);
      
      return result.tips || this.generateFallbackTips(performanceAnalysis);
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
      bestDay: this.getBestPerformer(dayOfWeekStats),
      worstDay: this.getWorstPerformer(dayOfWeekStats),
      bestHour: this.getBestPerformer(hourStats),
      worstHour: this.getWorstPerformer(hourStats)
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
      bestAsset: this.getBestPerformer(assetStats),
      worstAsset: this.getWorstPerformer(assetStats),
      bestSetup: this.getBestPerformer(setupStats),
      worstSetup: this.getWorstPerformer(setupStats),
      diversification: {
        assetsCount: Object.keys(assetStats).length,
        setupsCount: Object.keys(setupStats).length,
        concentration: this.calculateConcentration(assetStats)
      }
    };
  }

  private analyzeRiskAndDrawdown(trades: any[]) {
    const sortedTrades = trades.sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());
    const cumulativeResults = [];
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
    return Object.keys(stats).reduce((best, current) => 
      stats[current].profitability > stats[best].profitability ? current : best
    );
  }

  private getWorstPerformer(stats: any) {
    return Object.keys(stats).reduce((worst, current) => 
      stats[current].profitability < stats[worst].profitability ? current : worst
    );
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
    const drawdowns = [];
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