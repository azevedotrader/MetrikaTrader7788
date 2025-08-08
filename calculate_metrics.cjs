// Script para calcular métricas dos trades importados
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/trades',
  method: 'GET',
  headers: {
    'user-id': '1'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const trades = JSON.parse(data);
      
      if (!trades || trades.length === 0) {
        console.log('❌ Nenhum trade encontrado');
        return;
      }
      
      console.log(`📊 Total de trades: ${trades.length}`);
      
      // Converter resultados para números
      const tradesWithNumbers = trades.map(trade => ({
        ...trade,
        resultado: parseFloat(trade.resultado || '0')
      }));
      
      // Ordenar por resultado (do pior para o melhor)
      const tradesSorted = tradesWithNumbers.sort((a, b) => a.resultado - b.resultado);
      
      console.log('\n🔍 Todos os trades (ordenados do pior para o melhor):');
      tradesSorted.forEach((trade, index) => {
        console.log(`${index + 1}. ${trade.ativo} (${trade.tipo}): R$ ${trade.resultado.toFixed(2)}`);
      });
      
      // Identificar pior e melhor trade
      const worstTrade = tradesSorted[0];
      const bestTrade = tradesSorted[tradesSorted.length - 1];
      
      console.log(`\n🎯 PIOR TRADE: ${worstTrade.ativo} (${worstTrade.tipo}) = R$ ${worstTrade.resultado.toFixed(2)}`);
      console.log(`🎯 MELHOR TRADE: ${bestTrade.ativo} (${bestTrade.tipo}) = R$ ${bestTrade.resultado.toFixed(2)}`);
      
      // Calcular métricas de Risk/Reward
      const winningTrades = tradesWithNumbers.filter(t => t.resultado > 0);
      const losingTrades = tradesWithNumbers.filter(t => t.resultado < 0);
      
      console.log(`\n📈 Trades ganhos: ${winningTrades.length}`);
      console.log(`📉 Trades perdidos: ${losingTrades.length}`);
      
      if (winningTrades.length > 0 && losingTrades.length > 0) {
        const avgWin = winningTrades.reduce((sum, t) => sum + t.resultado, 0) / winningTrades.length;
        const avgLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.resultado, 0) / losingTrades.length);
        const avgRiskReward = avgWin / avgLoss;
        
        console.log(`\n💰 Ganho médio: R$ ${avgWin.toFixed(2)}`);
        console.log(`💸 Perda média: R$ ${avgLoss.toFixed(2)}`);
        console.log(`⚖️ RISK/REWARD MÉDIO: ${avgRiskReward.toFixed(2)}`);
      }
      
      const totalResult = tradesWithNumbers.reduce((sum, t) => sum + t.resultado, 0);
      console.log(`\n💼 RESULTADO TOTAL: R$ ${totalResult.toFixed(2)}`);
      
    } catch (error) {
      console.error('❌ Erro ao processar dados:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na requisição:', error.message);
});

req.end();
