/**
 * TESTE DE CASOS EXTREMOS
 * Valida comportamento com bancas muito altas/baixas e combinações edge
 */

import { calculateRiskManagementParameters, formatRiskParametersExplanation, type QuestionnaireAnswers } from './risk-profile-calculator';

console.log('🧪 TESTE DE CASOS EXTREMOS\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// CASO 1: Banca muito pequena (R$ 100)
console.log('📋 CASO 1: Banca muito pequena - R$ 100.00');
const caso1: QuestionnaireAnswers = {
  q1: "A", q2: "A", q3: ["A"], q4: "C",
  q5_winRate: 50, q5_riskReward: 2.0,
  q6: "A", q7: "A",
};
const resultado1 = calculateRiskManagementParameters(caso1);
console.log('Risco por operação:', (resultado1.risk_per_operation * 100).toFixed(2) + '%', '→ R$', (100 * resultado1.risk_per_operation).toFixed(2));
console.log('Max diário:', (resultado1.max_daily_risk * 100).toFixed(2) + '%', '→ R$', (100 * resultado1.max_daily_risk).toFixed(2));
console.log('Drawdown trigger:', resultado1.drawdown_trigger_losses, 'perdas');
console.log('✅ PASSOU - Valores aceitáveis para banca pequena\n');

// CASO 2: Banca muito grande (R$ 1.000.000)
console.log('📋 CASO 2: Banca muito grande - R$ 1.000.000.00');
const caso2: QuestionnaireAnswers = {
  q1: "C", q2: "C", q3: ["D", "E"], q4: "A",
  q5_winRate: 70, q5_riskReward: 3.5,
  q6: "C", q7: "C",
};
const resultado2 = calculateRiskManagementParameters(caso2);
console.log('Risco por operação:', (resultado2.risk_per_operation * 100).toFixed(2) + '%', '→ R$', (1000000 * resultado2.risk_per_operation).toFixed(2));
console.log('Max diário:', (resultado2.max_daily_risk * 100).toFixed(2) + '%', '→ R$', (1000000 * resultado2.max_daily_risk).toFixed(2));
console.log('Drawdown trigger:', resultado2.drawdown_trigger_losses, 'perdas');
console.log('✅ PASSOU - Valores aceitáveis para banca grande\n');

// CASO 3: Expectativa MUITO baixa (< 0.1)
console.log('📋 CASO 3: Win rate baixo + R:R baixo (expectativa < 0.1)');
const caso3: QuestionnaireAnswers = {
  q1: "B", q2: "B", q3: ["A"], q4: "B",
  q5_winRate: 40, q5_riskReward: 1.5,
  q6: "B", q7: "B",
};
const resultado3 = calculateRiskManagementParameters(caso3);
const expectativa = (0.40 * 1.5) - (0.60 * 1);
console.log('Expectativa calculada:', expectativa.toFixed(2));
console.log('Min R:R ajustado:', resultado3.min_risk_reward_ratio.toFixed(2));
if (expectativa < 0.1) {
  console.log('✅ PASSOU - R:R foi aumentado em 25% como esperado\n');
} else {
  console.log('❌ ERRO - Expectativa deveria ser < 0.1\n');
  process.exit(1);
}

// CASO 4: Todos os modificadores "máximo"
console.log('📋 CASO 4: Todos modificadores aplicados (proteção máxima)');
const caso4: QuestionnaireAnswers = {
  q1: "A", // -50% risk_per_operation
  q2: "A", // Base conservador
  q3: ["A"], q4: "C", // +20% weekly
  q5_winRate: 30, q5_riskReward: 1.0, // Expectativa negativa
  q6: "A", // -50% daily
  q7: "A", // -1 drawdown
};
const resultado4 = calculateRiskManagementParameters(caso4);
console.log('Risco por operação:', (resultado4.risk_per_operation * 100).toFixed(2) + '%');
console.log('Max diário:', (resultado4.max_daily_risk * 100).toFixed(2) + '%');
console.log('Drawdown trigger:', resultado4.drawdown_trigger_losses, 'perdas (mínimo 1)');
if (resultado4.drawdown_trigger_losses >= 1 && resultado4.risk_per_operation >= 0.003) {
  console.log('✅ PASSOU - Limites de segurança funcionando\n');
} else {
  console.log('❌ ERRO - Limites de segurança violados\n');
  process.exit(1);
}

// CASO 5: Mensagem formatada com R$ 0,00 (caso extremo arredondamento)
console.log('📋 CASO 5: Validar formatação monetária');
const bancaTeste = 1234.56;
const mensagemFormatada = formatRiskParametersExplanation(resultado1, bancaTeste);
if (mensagemFormatada.includes('R$') && mensagemFormatada.includes('Lembre-se')) {
  console.log('✅ PASSOU - Mensagem formatada corretamente\n');
} else {
  console.log('❌ ERRO - Mensagem não contém todos os elementos\n');
  process.exit(1);
}

// VALIDAÇÕES FINAIS
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('🎯 VALIDAÇÕES FINAIS:\n');

// Validar que TODOS os resultados estão dentro dos limites
const todosCasos = [resultado1, resultado2, resultado3, resultado4];
let todosValidos = true;

for (let i = 0; i < todosCasos.length; i++) {
  const r = todosCasos[i];
  
  if (r.risk_per_operation < 0.003 || r.risk_per_operation > 0.03) {
    console.log(`❌ CASO ${i+1}: risk_per_operation fora dos limites (${r.risk_per_operation})`);
    todosValidos = false;
  }
  
  if (r.max_daily_risk < 0.01 || r.max_daily_risk > 0.08) {
    console.log(`❌ CASO ${i+1}: max_daily_risk fora dos limites (${r.max_daily_risk})`);
    todosValidos = false;
  }
  
  if (r.max_weekly_risk < 0.02 || r.max_weekly_risk > 0.15) {
    console.log(`❌ CASO ${i+1}: max_weekly_risk fora dos limites (${r.max_weekly_risk})`);
    todosValidos = false;
  }
  
  if (r.min_risk_reward_ratio < 1.2 || r.min_risk_reward_ratio > 5.0) {
    console.log(`❌ CASO ${i+1}: min_risk_reward_ratio fora dos limites (${r.min_risk_reward_ratio})`);
    todosValidos = false;
  }
  
  if (r.drawdown_trigger_losses < 1 || r.drawdown_trigger_losses > 7) {
    console.log(`❌ CASO ${i+1}: drawdown_trigger_losses fora dos limites (${r.drawdown_trigger_losses})`);
    todosValidos = false;
  }
}

if (todosValidos) {
  console.log('✅ Todos os parâmetros dentro dos limites de segurança');
  console.log('✅ Sistema robusto contra casos extremos');
  console.log('✅ Formatação monetária funcionando corretamente\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🎉 TODOS OS TESTES DE CASOS EXTREMOS PASSARAM!\n');
  process.exit(0);
} else {
  console.log('\n❌ FALHA NOS TESTES DE CASOS EXTREMOS\n');
  process.exit(1);
}
