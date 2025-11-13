/**
 * TESTE VISUAL DA MENSAGEM FINAL
 * Mostra como o usuário receberá a mensagem no WhatsApp
 */

import { calculateRiskManagementParameters, formatRiskParametersExplanation, type QuestionnaireAnswers } from './risk-profile-calculator';

// Exemplo 1: Iniciante Moderado Day Trader com banca de R$ 1000
const exemplo1: QuestionnaireAnswers = {
  q1: "A", // Iniciante
  q2: "B", // Moderado
  q3: ["A"], // Ações
  q4: "A", // Day Trade
  q5_winRate: 50,
  q5_riskReward: 2.0,
  q6: "B", // Desconfortável
  q7: "B", // Cauteloso
};

const bankroll1 = 1000; // R$ 1.000

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📱 EXEMPLO 1: Iniciante Moderado Day Trader (R$ 1.000)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const resultado1 = calculateRiskManagementParameters(exemplo1);
const mensagem1 = formatRiskParametersExplanation(resultado1, bankroll1);

console.log(mensagem1);

console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📱 EXEMPLO 2: Trader Avançado Arrojado Swing (R$ 10.000)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Exemplo 2: Avançado Arrojado Swing Trader com banca de R$ 10.000
const exemplo2: QuestionnaireAnswers = {
  q1: "C", // Avançado
  q2: "C", // Arrojado
  q3: ["D", "E"], // Forex + Cripto
  q4: "B", // Swing Trade
  q5_winRate: 65,
  q5_riskReward: 3.0,
  q6: "C", // Focado
  q7: "C", // Segue plano
};

const bankroll2 = 10000; // R$ 10.000

const resultado2 = calculateRiskManagementParameters(exemplo2);
const mensagem2 = formatRiskParametersExplanation(resultado2, bankroll2);

console.log(mensagem2);

console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📱 EXEMPLO 3: Iniciante Conservador com expectativa baixa (R$ 500)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Exemplo 3: Iniciante Conservador com win rate baixo
const exemplo3: QuestionnaireAnswers = {
  q1: "A", // Iniciante
  q2: "A", // Conservador
  q3: ["A"], // Ações
  q4: "C", // Position Trade
  q5_winRate: 35,
  q5_riskReward: 1.2,
  q6: "A", // Muito abalado
  q7: "A", // Duvida estratégia
};

const bankroll3 = 500; // R$ 500

const resultado3 = calculateRiskManagementParameters(exemplo3);
const mensagem3 = formatRiskParametersExplanation(resultado3, bankroll3);

console.log(mensagem3);

console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('✅ Mensagens geradas com sucesso!');
console.log('📲 Essas são as mensagens que os usuários receberão no WhatsApp\n');
