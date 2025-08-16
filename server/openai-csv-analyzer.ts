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

    // 2. Estratégia inteligente: processar TUDO até 800 linhas, depois usar amostra
    let csvSample: string;
    let isFullAnalysis = parseResult.data.length <= 800;
    
    if (isFullAnalysis) {
      // Análise completa para arquivos pequenos/médios (até 800 linhas)
      csvSample = parseResult.data.map((row: any) => Array.isArray(row) ? row.join(',') : row).join('\n');
      console.log(`📊 ANÁLISE COMPLETA: Enviando TODAS as ${parseResult.data.length} linhas para ChatGPT`);
    } else {
      // Para arquivos muito grandes (>800 linhas): usar amostra inteligente
      const start = parseResult.data.slice(0, 250);
      const middle = parseResult.data.slice(Math.floor(parseResult.data.length / 2) - 125, Math.floor(parseResult.data.length / 2) + 125);
      const end = parseResult.data.slice(-250);
      const sampleData = [...start, ...middle, ...end];
      csvSample = sampleData.map((row: any) => Array.isArray(row) ? row.join(',') : row).join('\n');
      console.log(`📊 Arquivo muito grande (${parseResult.data.length} linhas): usando amostra de ${sampleData.length} linhas`);
      console.log(`⚠️ Para análise completa de arquivos grandes, use o sistema tradicional`);
    }

    // 3. Prompt ULTRA AVANÇADO para análise perfeita de qualquer CSV
    const prompt = `
🎯 SISTEMA EXPERT: ANÁLISE UNIVERSAL DE CSV FINANCEIRO

Você é um sistema especialista em engenharia reversa de dados financeiros. Analise este CSV COMPLETO com precisão cirúrgica.

📊 CSV PARA ANÁLISE:
${isFullAnalysis ? 
  `📋 ARQUIVO COMPLETO (${parseResult.data.length} linhas) - EXTRAIA TODOS OS TRADES:` :
  `⚠️ ARQUIVO GRANDE: ${parseResult.data.length} linhas total
📋 AMOSTRA REPRESENTATIVA para análise de estrutura:`}
${csvSample}

🏢 BROKER: ${brokerHint}

🔬 ANÁLISE ULTRA-DETALHADA OBRIGATÓRIA:

1. 🧬 DETECÇÃO MOLECULAR DE FORMATO (EXAMINE CADA CARACTERE):
   SEPARADORES PRIMÁRIOS: , (vírgula) ; (ponto-vírgula) | (pipe) \t (tab) 
   SEPARADORES SECUNDÁRIOS: - (hífen) * (asterisco) / (barra) \ (contrabarra) : (dois-pontos) . (ponto) ## (hashtag dupla)
   SEPARADORES COMPOSTOS: :: || ;; ,, -- ** /// \\\ ... (múltiplos caracteres)
   ESPAÇOS: espaços simples, múltiplos, ou tabulação
   DECIMAIS: Brasileiro (1.234,56) vs Internacional (1,234.56) vs Sem separador (12345)
   DATAS: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD-MM-YY, MM.DD.YYYY, DD.MM.YY, YYYYMMDD, etc
   ASPAS: "texto", 'texto', sem aspas, aspas duplas duplas ""texto""
   HEADERS: Linha 1, múltiplas linhas de cabeçalho, sem header, headers no meio do arquivo

2. 🎨 IDENTIFICAÇÃO INTELIGENTE DE PADRÕES:
   CLEAR B3: WINQ25;01/07/2025 17:04:30;V;141745 (ponto e vírgula, sem decimais explícitos)
   RICO/XP: Ativo,Data,Tipo,Qtd,Preco,Total (headers estruturados)
   BINANCE: BTC/USDT,2024-01-01T10:30:00Z,BUY,0.001,45000.00
   MT5: EURUSD,2024.01.01 10:30,sell,1.00000,1.0950
   ESTATÍSTICAS: "Total Geral", "Lucro Líquido", "Win Rate", "Drawdown"
   GENÉRICO: Qualquer formato não padrão

3. 🔍 ANÁLISE INTELIGENTE DE CONTEÚDO:
   SÍMBOLOS: Reconheça WIN, DOL, IND, WDO (B3), BTC, ETH, USDT (Crypto), EURUSD, GBPJPY (Forex)
   OPERAÇÕES: C/V, BUY/SELL, Long/Short, +/-, 1/-1, Compra/Venda
   NÚMEROS: Detecte preços (com 2-8 casas decimais), quantidades, valores monetários
   DATAS: Extraia timestamp completo ou apenas data
   RESULTADOS: Lucro/prejuízo em R$, USD, pontos, pips

4. 🏗️ ENGENHARIA REVERSA COMPLETA - EXTRAIR TODOS OS TRADES:
   🚨 REGRA CRÍTICA: EXAMINE LINHA POR LINHA - NÃO PULE NENHUMA
   
   Para identificar um trade, procure por linhas que contenham:
   ✓ Símbolo financeiro (WIN, PETR4, BTC, EUR, etc.) E
   ✓ Algum tipo de operação (C/V, BUY/SELL, +/-, 1/-1) E  
   ✓ Valores numéricos (preço, quantidade, resultado)
   
   Para CADA linha de trade encontrada, extraia:
   - SÍMBOLO: Exato como aparece (WIN, WINQ25, BTC/USDT, EURUSD)
   - DATA/HORA: Converta para ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
   - DIREÇÃO: "compra" ou "venda" (normalize C→compra, V→venda, BUY→compra, SELL→venda)
   - QUANTIDADE: Valor numérico como string com decimais
   - PREÇO ENTRADA: Com 4+ casas decimais
   - PREÇO SAÍDA: Se disponível na linha
   - RESULTADO: Lucro/prejuízo (calcule se não estiver explícito)
   - CAPITAL: quantidade × preço_entrada
   
   🎯 OBJETIVO: Se o CSV tem 100 linhas de trades reais, extraia TODOS os 100!

5. 🚨 DETECÇÃO CRÍTICA DE CASOS ESPECIAIS:
   ARQUIVO ESTATÍSTICAS/PERFORMANCE: Se contém termos como:
   - "Patrimônio Máximo", "Declínio Máximo", "Drawdown %", "Rentabilidade Total"
   - "Melhor Trade", "Pior Trade", "R/R Médio", "Win Rate", "Lucro Líquido"
   - "Total Geral", "Resultado Líquido", "Tempo no Mercado"
   - "Trades Vencedores", "Trades Perdedores", "Sequência Máxima"
   → MARQUE COMO fileType: "statistics" E NÃO EXTRAIA TRADES
   
   ARQUIVO MISTO: Trades reais + estatísticas misturados
   ARQUIVO VAZIO: Só headers sem dados
   ARQUIVO CORROMPIDO: Dados inconsistentes ou ilegíveis

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

⚡ EXECUÇÃO PERFEITA OBRIGATÓRIA:
- 🔥 EXTRAIR TUDO: Examine CADA linha individualmente, não faça suposições ou pule dados
- 🚨 IDENTIFICAÇÃO CRÍTICA: Se detectar termos como "Patrimônio", "Drawdown", "Rentabilidade Total" → fileType: "statistics"
- ❌ NUNCA EXTRAIR: Dados de resumo/performance como trades individuais
- 📊 CONTAR CORRETO: Se CSV tem 50 trades reais, extraia TODOS os 50 (não apenas 2-3)
- 🎯 LINHA POR LINHA: Analise uma por uma, procurando por símbolos + operações + valores
- 💎 PRECISÃO CIRÚRGICA: Use strings para todos os decimais, preserve formatação
- 🏷️ SÍMBOLOS EXATOS: Mantenha formato original (WIN, WINQ25, BTC/USDT, PETR4)
- 📅 DATAS UNIVERSAIS: Converta qualquer formato para ISO 8601 completo
- ⚖️ OPERAÇÕES INTELIGENTES: C→compra, V→venda, BUY→compra, SELL→venda
- 🧮 CÁLCULOS PRECISOS: capital = quantidade × preço, resultado = (saída - entrada) × quantidade
- 🌍 MERCADOS AUTO-DETECT: b3(WIN,DOL,PETR), crypto(BTC,ETH,USDT), forex(EUR,GBP,USD)
- 📈 CONFIANÇA ALTA: >0.95 para detecção de arquivos de estatísticas, >0.9 para trades válidos
- 📋 ANÁLISE COMPLETA: Mesmo sem trades, forneça análise estrutural detalhada

🎯 LEMBRE-SE: Seu trabalho é encontrar TODOS os trades, não apenas alguns exemplos!

📝 EXEMPLO PRÁTICO DE ANÁLISE COMPLETA:
Se receber um CSV com estas linhas:
WINQ25;01/07/2025 17:04;V;141745;1;545
PETR4;01/07/2025 15:30;C;28.50;100;-150
VALE3;01/07/2025 16:45;V;65.20;50;230

Deve extrair EXATAMENTE 3 trades - um para cada linha válida!
NÃO extraia apenas 1 ou 2 como "exemplo" - extraia TODOS os 3 trades completos.

🔢 VERIFICAÇÃO OBRIGATÓRIA:
Antes de finalizar, conte quantas linhas de dados de trade você encontrou
e certifique-se de que seu array "trades" contém EXATAMENTE esse número!
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
      max_tokens: 16000 // Máximo de tokens para análise completa sem limites
    });

    const aiResponse = response.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('Resposta vazia do ChatGPT');
    }

    console.log(`🤖 ChatGPT respondeu (${aiResponse.length} chars): ${aiResponse.substring(0, 300)}...`);

    // 5. Parsear resposta JSON
    let analysis: any;
    try {
      analysis = JSON.parse(aiResponse);
      console.log(`🔍 Análise ChatGPT detectada:`, {
        fileType: analysis.fileType,
        detectedBroker: analysis.detectedBroker,
        confidence: analysis.confidence,
        totalTrades: analysis.trades?.length || 0,
        csvStructure: analysis.csvStructure?.substring(0, 100) + '...'
      });
    } catch (parseError) {
      console.error('❌ Erro ao parsear JSON do ChatGPT:', parseError);
      console.error('🔍 Resposta completa que falhou:', aiResponse);
      throw new Error('Resposta do ChatGPT não é JSON válido');
    }

    // 6. Processar trades extraídos
    const trades: InsertTrade[] = [];
    const errors: string[] = [];

    if (analysis.fileType === 'statistics') {
      console.log(`📊 ChatGPT detectou arquivo de estatísticas. Confiança: ${analysis.confidence}, Broker: ${analysis.detectedBroker}`);
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
        errors: [
          '❌ ARQUIVO DE ESTATÍSTICAS DETECTADO PELO ChatGPT', 
          'Este arquivo contém resumos/totalizações, não trades individuais.',
          `🎯 Detalhes ChatGPT: fileType=${analysis.fileType}, broker=${analysis.detectedBroker}, confidence=${analysis.confidence}`
        ]
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
    console.error('🔍 Stack trace completo:', error instanceof Error ? error.stack : 'N/A');
    
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
        error instanceof Error ? error.message : 'Erro desconhecido',
        `🔧 Debug info: ${error instanceof Error ? error.name : 'Unknown error type'}`
      ]
    };
  }
}