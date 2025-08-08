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
      
      // Filtrar apenas os trades estruturados (não UNKNOWN)
      const structuredTrades = trades.filter(t => t.ativo !== 'UNKNOWN' && t.resultado !== '0');
      
      console.log(`📊 ANÁLISE FINAL - APENAS TRADES ESTRUTURADOS:`);
      console.log(`Total de trades estruturados: ${structuredTrades.length}`);
      
      if (structuredTrades.length === 0) {
        console.log('❌ Nenhum trade estruturado encontrado');
        return;
      }
      
      // Converter resultados para números
      const tradesWithNumbers = structuredTrades.map(trade => ({
        ...trade,
        resultado: parseFloat(trade.resultado || '0')
      }));
      
      // Ordenar do pior para o melhor
      const tradesSorted = tradesWithNumbers.sort((a, b) => a.resultado - b.resultado);
      
      console.log(`\n🔍 TODOS OS TRADES ESTRUTURADOS (ordenados):`);
      tradesSorted.forEach((trade, index) => {
        const signal = trade.resultado < 0 ? '❌' : '✅';
        console.log(`${index + 1}. ${signal} ${trade.ativo} (${trade.tipo}): R$ ${trade.resultado.toFixed(2)}`);
      });
      
      // Identificar pior e melhor
      const worstTrade = tradesSorted[0];
      const bestTrade = tradesSorted[tradesSorted.length - 1];
      
      console.log(`\n🎯 PIOR TRADE: ${worstTrade.ativo} (${worstTrade.tipo}) = R$ ${worstTrade.resultado.toFixed(2)}`);
      console.log(`🎯 MELHOR TRADE: ${bestTrade.ativo} (${bestTrade.tipo}) = R$ ${bestTrade.resultado.toFixed(2)}`);
      
      // Separar ganhos e perdas
      const winningTrades = tradesWithNumbers.filter(t => t.resultado > 0);
      const losingTrades = tradesWithNumbers.filter(t => t.resultado < 0);
      
      console.log(`\n📊 DISTRIBUIÇÃO:`);
      console.log(`📈 Trades ganhos: ${winningTrades.length}`);
      console.log(`📉 Trades perdidos: ${losingTrades.length}`);
      console.log(`💼 Win Rate: ${((winningTrades.length / tradesWithNumbers.length) * 100).toFixed(1)}%`);
      
      if (winningTrades.length > 0 && losingTrades.length > 0) {
        const avgWin = winningTrades.reduce((sum, t) => sum + t.resultado, 0) / winningTrades.length;
        const avgLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.resultado, 0) / losingTrades.length);
        const riskReward = avgWin / avgLoss;
        
        console.log(`\n💰 Ganho médio: R$ ${avgWin.toFixed(2)}`);
        console.log(`💸 Perda média: R$ ${avgLoss.toFixed(2)}`);
        console.log(`⚖️ RISK/REWARD CORRETO: ${riskReward.toFixed(2)}`);
      }
      
      const totalResult = tradesWithNumbers.reduce((sum, t) => sum + t.resultado, 0);
      console.log(`\n💼 RESULTADO TOTAL: R$ ${totalResult.toFixed(2)}`);
      
      console.log(`\n✅ MÉTRICAS FINAIS CORRETAS:`);
      console.log(`- Pior trade: ${worstTrade.ativo} R$ ${worstTrade.resultado.toFixed(2)}`);
      console.log(`- Melhor trade: ${bestTrade.ativo} R$ ${bestTrade.resultado.toFixed(2)}`);
      console.log(`- Risk/Reward: ${riskReward.toFixed(2)}`);
      console.log(`- Total P&L: R$ ${totalResult.toFixed(2)}`);
      
    } catch (error) {
      console.error('❌ Erro:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na requisição:', error.message);
});

req.end();
