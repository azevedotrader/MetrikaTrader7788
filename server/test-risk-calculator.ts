/**
 * TESTE DE VALIDAÇÃO DO CALCULADOR DE RISCO
 * Valida o exemplo fornecido pelo usuário
 */

import { calculateRiskManagementParameters, type QuestionnaireAnswers } from './risk-profile-calculator';

// Exemplo do usuário
const exampleAnswers: QuestionnaireAnswers = {
  q1: "A", // Iniciante
  q2: "B", // Moderado
  q3: ["B"], // B3
  q4: "A", // Day Trade
  q5_winRate: 50,
  q5_riskReward: 2.0,
  q6: "B", // Desconfortável
  q7: "B", // Cauteloso
};

console.log('🧪 TESTE DO CALCULADOR DE RISCO\n');
console.log('📋 Entrada:');
console.log('  - P1 (Experiência): A (Iniciante)');
console.log('  - P2 (Objetivo): B (Moderado)');
console.log('  - P3 (Mercados): B (B3)');
console.log('  - P4 (Timeframe): A (Day Trade)');
console.log('  - P5 (Métricas): win_rate=50%, risk_reward=2.0');
console.log('  - P6 (Psicologia Perda): B (Desconfortável)');
console.log('  - P7 (Psicologia Drawdown): B (Cauteloso)\n');

console.log('🔄 Processamento:\n');

console.log('1️⃣  Perfil Base (Moderado - P2=B):');
console.log('   - risk_per_operation = 0.01 (1%)');
console.log('   - max_daily_risk = 0.03 (3%)');
console.log('   - max_weekly_risk = 0.06 (6%)');
console.log('   - min_risk_reward_ratio = 2.0 (1:2)');
console.log('   - drawdown_trigger_losses = 4\n');

console.log('2️⃣  Ajuste por Iniciante (P1=A):');
console.log('   - risk_per_operation = 0.01 * 0.5 = 0.005 (0.5%)\n');

console.log('3️⃣  Ajuste por Day Trade (P4=A):');
console.log('   - max_daily_risk = 0.03 * 1.20 = 0.036 (3.6%)\n');

console.log('4️⃣  Ajuste por Win Rate (P5):');
console.log('   - expectativa = (0.50 * 2.0) - (0.50 * 1) = 1.0 - 0.5 = 0.5');
console.log('   - expectativa >= 0.1 → SEM AJUSTE\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Calcular resultado
const resultado = calculateRiskManagementParameters(exampleAnswers);

console.log('✅ RESULTADO CALCULADO:\n');
console.log(JSON.stringify({
  risk_per_operation: resultado.risk_per_operation,
  max_daily_risk: resultado.max_daily_risk,
  max_weekly_risk: resultado.max_weekly_risk,
  min_risk_reward_ratio: resultado.min_risk_reward_ratio,
  drawdown_trigger_losses: resultado.drawdown_trigger_losses
}, null, 2));

console.log('\n📊 Interpretação para o usuário:\n');
console.log(`   • Risco por operação: ${(resultado.risk_per_operation * 100).toFixed(1)}%`);
console.log(`   • Risco máximo diário: ${(resultado.max_daily_risk * 100).toFixed(1)}%`);
console.log(`   • Risco máximo semanal: ${(resultado.max_weekly_risk * 100).toFixed(1)}%`);
console.log(`   • Relação R:R mínima: 1:${resultado.min_risk_reward_ratio.toFixed(1)}`);
console.log(`   • Reduzir risco após ${resultado.drawdown_trigger_losses} perdas seguidas\n`);

// Validar se bate com o esperado
const esperado = {
  risk_per_operation: 0.005,
  max_daily_risk: 0.036,
  max_weekly_risk: 0.06,
  min_risk_reward_ratio: 2.0,
  drawdown_trigger_losses: 4
};

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('🎯 VALIDAÇÃO:\n');

let todosCorretos = true;

if (resultado.risk_per_operation === esperado.risk_per_operation) {
  console.log('   ✅ risk_per_operation: CORRETO (0.005)');
} else {
  console.log(`   ❌ risk_per_operation: ERRO (esperado: ${esperado.risk_per_operation}, obtido: ${resultado.risk_per_operation})`);
  todosCorretos = false;
}

if (resultado.max_daily_risk === esperado.max_daily_risk) {
  console.log('   ✅ max_daily_risk: CORRETO (0.036)');
} else {
  console.log(`   ❌ max_daily_risk: ERRO (esperado: ${esperado.max_daily_risk}, obtido: ${resultado.max_daily_risk})`);
  todosCorretos = false;
}

if (resultado.max_weekly_risk === esperado.max_weekly_risk) {
  console.log('   ✅ max_weekly_risk: CORRETO (0.06)');
} else {
  console.log(`   ❌ max_weekly_risk: ERRO (esperado: ${esperado.max_weekly_risk}, obtido: ${resultado.max_weekly_risk})`);
  todosCorretos = false;
}

if (resultado.min_risk_reward_ratio === esperado.min_risk_reward_ratio) {
  console.log('   ✅ min_risk_reward_ratio: CORRETO (2.0)');
} else {
  console.log(`   ❌ min_risk_reward_ratio: ERRO (esperado: ${esperado.min_risk_reward_ratio}, obtido: ${resultado.min_risk_reward_ratio})`);
  todosCorretos = false;
}

if (resultado.drawdown_trigger_losses === esperado.drawdown_trigger_losses) {
  console.log('   ✅ drawdown_trigger_losses: CORRETO (4)');
} else {
  console.log(`   ❌ drawdown_trigger_losses: ERRO (esperado: ${esperado.drawdown_trigger_losses}, obtido: ${resultado.drawdown_trigger_losses})`);
  todosCorretos = false;
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (todosCorretos) {
  console.log('🎉 TESTE PASSOU! Todos os valores estão corretos!\n');
  process.exit(0);
} else {
  console.log('❌ TESTE FALHOU! Há valores incorretos.\n');
  process.exit(1);
}
