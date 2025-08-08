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
      
      console.log(`📊 ANÁLISE DETALHADA DOS TRADES:`);
      console.log(`Total de trades no banco: ${trades.length}`);
      
      // Separar trades por origem
      const csvTrades = trades.filter(t => t.origem === 'csv');
      const manualTrades = trades.filter(t => t.origem === 'manual');
      const apiTrades = trades.filter(t => t.origem === 'api');
      
      console.log(`\n📂 TRADES POR ORIGEM:`);
      console.log(`- CSV: ${csvTrades.length}`);
      console.log(`- Manual: ${manualTrades.length}`);
      console.log(`- API: ${apiTrades.length}`);
      
      // Analisar trades CSV com mais detalhe
      console.log(`\n🔍 ANÁLISE DOS TRADES CSV:`);
      csvTrades.forEach((trade, index) => {
        const resultado = parseFloat(trade.resultado || '0');
        console.log(`${index + 1}. ${trade.ativo} (${trade.tipo}) = R$ ${resultado.toFixed(2)} | Data: ${trade.dataHora.substring(0,10)} | Obs: ${trade.observacoes?.substring(0,50) || 'N/A'}`);
      });
      
      // Identificar trades negativos REAIS
      const allTradesWithNum = trades.map(t => ({
        ...t,
        resultado: parseFloat(t.resultado || '0')
      }));
      
      const negativeTrades = allTradesWithNum.filter(t => t.resultado < 0);
      const zeroTrades = allTradesWithNum.filter(t => t.resultado === 0);
      const positiveTrades = allTradesWithNum.filter(t => t.resultado > 0);
      
      console.log(`\n💸 TRADES NEGATIVOS (${negativeTrades.length}):`);
      negativeTrades.forEach((trade, index) => {
        console.log(`${index + 1}. ${trade.ativo} (${trade.tipo}) = R$ ${trade.resultado.toFixed(2)} | Origem: ${trade.origem}`);
      });
      
      console.log(`\n🔘 TRADES ZERO (${zeroTrades.length}):`);
      if (zeroTrades.length > 10) {
        console.log(`Primeiros 10 de ${zeroTrades.length}:`);
        zeroTrades.slice(0, 10).forEach((trade, index) => {
          console.log(`${index + 1}. ${trade.ativo} (${trade.tipo}) = R$ 0.00 | Origem: ${trade.origem}`);
        });
      } else {
        zeroTrades.forEach((trade, index) => {
          console.log(`${index + 1}. ${trade.ativo} (${trade.tipo}) = R$ 0.00 | Origem: ${trade.origem}`);
        });
      }
      
      console.log(`\n📈 TRADES POSITIVOS: ${positiveTrades.length}`);
      
      // Recalcular métricas APENAS com trades CSV válidos
      const csvTradesWithNum = csvTrades.map(t => ({
        ...t,
        resultado: parseFloat(t.resultado || '0')
      }));
      
      if (csvTradesWithNum.length > 0) {
        const csvNegative = csvTradesWithNum.filter(t => t.resultado < 0);
        const csvPositive = csvTradesWithNum.filter(t => t.resultado > 0);
        
        console.log(`\n🎯 RECÁLCULO APENAS COM TRADES CSV:`);
        console.log(`- Trades CSV negativos: ${csvNegative.length}`);
        console.log(`- Trades CSV positivos: ${csvPositive.length}`);
        
        if (csvNegative.length > 0 && csvPositive.length > 0) {
          const avgWin = csvPositive.reduce((sum, t) => sum + t.resultado, 0) / csvPositive.length;
          const avgLoss = Math.abs(csvNegative.reduce((sum, t) => sum + t.resultado, 0) / csvNegative.length);
          const riskReward = avgWin / avgLoss;
          
          console.log(`💰 Ganho médio (CSV): R$ ${avgWin.toFixed(2)}`);
          console.log(`💸 Perda média (CSV): R$ ${avgLoss.toFixed(2)}`);
          console.log(`⚖️ Risk/Reward (CSV): ${riskReward.toFixed(2)}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Erro:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na requisição:', error.message);
});

req.end();
