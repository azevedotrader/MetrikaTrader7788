/**
 * HANDLER DO QUESTIONÁRIO DE GESTÃO DE RISCO VIA WHATSAPP
 * Gerencia o fluxo conversacional completo do questionário
 */

import { storage } from './storage';
import {
  QUESTIONS,
  formatQuestion,
  validateAnswer,
  parseAnswer,
  convertToQuestionnaireAnswers,
  getWelcomeMessage,
  getProgressMessage,
  getConfirmationMessage,
} from './questionnaire-flow';
import { calculateRiskProfile, formatProfileExplanation } from './risk-profile-calculator';
import { buildProjection, calculateTargetBalance } from './bankroll-helpers';

/**
 * Inicia o questionário de gestão de risco
 * Comando: /gestao criar 1000
 */
export async function startQuestionnaire(userId: string, bankrollValue: number): Promise<string> {
  try {
    // Validar valor da banca
    if (!bankrollValue || bankrollValue <= 0) {
      return '❌ Valor inválido. Use: /gestao criar VALOR\nExemplo: /gestao criar 1000';
    }

    // Verificar se já existe gestão ativa
    const existingBankroll = await storage.getBankrollManagement(userId);
    if (existingBankroll) {
      return '⚠️ Você já tem uma gestão de risco ativa.\n\nPara criar uma nova, primeiro delete a antiga enviando: /gestao deletar';
    }

    // Criar ou resetar estado do questionário
    await storage.createQuestionnaireState({
      userId,
      currentQuestion: 1,
      bankrollValue: bankrollValue.toString(),
      partialAnswers: {},
    });

    // Enviar mensagem de boas-vindas + primeira pergunta
    const welcomeMsg = getWelcomeMessage(bankrollValue);
    const firstQuestion = QUESTIONS[0];
    const questionMsg = formatQuestion(firstQuestion);

    return `${welcomeMsg}\n\n${questionMsg}`;
  } catch (error) {
    console.error('Erro ao iniciar questionário:', error);
    return '❌ Erro ao iniciar questionário. Tente novamente.';
  }
}

/**
 * Processa uma resposta do usuário no questionário
 */
export async function processQuestionnaireAnswer(userId: string, answer: string): Promise<string> {
  try {
    // Buscar estado atual do questionário
    const state = await storage.getQuestionnaireState(userId);

    if (!state) {
      return '❌ Nenhum questionário em andamento.\n\nInicie um novo com: /gestao criar VALOR';
    }

    const currentQuestion = state.currentQuestion;

    // Validar resposta
    const validation = validateAnswer(currentQuestion, answer);

    if (!validation.isValid) {
      return validation.errorMessage || 'Resposta inválida. Tente novamente.';
    }

    // Parsear resposta
    const parsedAnswer = parseAnswer(currentQuestion, answer);

    // Atualizar respostas parciais
    const partialAnswers = (state.partialAnswers as any) || {};

    if (currentQuestion === 5) {
      // Pergunta 5: win rate e risk/reward
      partialAnswers.q5_winRate = parsedAnswer.winRate;
      partialAnswers.q5_riskReward = parsedAnswer.riskReward;
    } else {
      partialAnswers[`q${currentQuestion}`] = parsedAnswer;
    }

    // Mensagem de confirmação
    const confirmationMsg = getConfirmationMessage(currentQuestion, parsedAnswer);

    // Verificar se é a última pergunta
    if (currentQuestion === 7) {
      // QUESTIONÁRIO COMPLETO - Calcular perfil e criar gestão
      return await finalizeQuestionnaire(userId, state.bankrollValue!, partialAnswers);
    }

    // Avançar para próxima pergunta
    const nextQuestionNumber = currentQuestion + 1;
    await storage.updateQuestionnaireState(userId, {
      currentQuestion: nextQuestionNumber,
      partialAnswers,
    });

    const nextQuestion = QUESTIONS[nextQuestionNumber - 1];
    const questionMsg = formatQuestion(nextQuestion);
    const progressMsg = getProgressMessage(nextQuestionNumber);

    return `${confirmationMsg}\n${progressMsg}\n\n${questionMsg}`;
  } catch (error) {
    console.error('Erro ao processar resposta do questionário:', error);
    return '❌ Erro ao processar resposta. Tente novamente.';
  }
}

/**
 * Finaliza o questionário e cria a gestão de risco personalizada
 */
async function finalizeQuestionnaire(userId: string, bankrollValue: string, partialAnswers: any): Promise<string> {
  try {
    // Converter para formato QuestionnaireAnswers
    const answers = convertToQuestionnaireAnswers(partialAnswers);

    if (!answers) {
      return '❌ Erro: Respostas incompletas. Por favor, reinicie o questionário.';
    }

    // Calcular perfil de risco personalizado
    const riskProfile = calculateRiskProfile(answers);

    // Calcular projeções
    const bankrollValueNum = parseFloat(bankrollValue);
    const projectedGrowth = buildProjection(
      bankrollValueNum,
      riskProfile.dailyProfitTarget,
      riskProfile.horizonDays
    );
    const targetBalance = calculateTargetBalance(
      bankrollValueNum,
      riskProfile.dailyProfitTarget,
      riskProfile.horizonDays
    );

    // Criar gestão de banca no banco de dados
    await storage.createBankrollManagement({
      userId,
      bankrollValue,
      
      // Respostas do questionário
      experienceLevel: answers.q1,
      tradingObjective: answers.q2,
      tradingMarkets: answers.q3,
      tradingTimeframe: answers.q4,
      customWinRate: answers.q5_winRate?.toString(),
      customRiskReward: answers.q5_riskReward?.toString(),
      psychologicalProfile: answers.q6,
      lossReactionProfile: answers.q7,
      questionnaireAnswers: partialAnswers,
      
      // Perfil calculado
      profile: riskProfile.profile,
      timeHorizon: riskProfile.timeHorizon,
      horizonDays: riskProfile.horizonDays,
      riskPerTrade: riskProfile.riskPerTrade.toString(),
      dailyProfitTarget: riskProfile.dailyProfitTarget.toString(),
      
      // Projeções
      projectedGrowth,
      targetBalance: targetBalance.toString(),
      autoAdjust: true,
      consecutiveWins: 0,
      consecutiveLosses: 0,
    });

    // Deletar estado do questionário
    await storage.deleteQuestionnaireState(userId);

    // Formatar mensagem de sucesso
    const explanation = formatProfileExplanation(riskProfile);

    return `
${explanation}

💰 *Meta Final*: R$ ${targetBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} em ${riskProfile.horizonDays} dias

🎯 *Próximos Passos*:
• Continue registrando seus trades normalmente
• Seu risco será ajustado automaticamente
• Use /gestao para ver status

_Boa sorte nos seus trades!_ 📈
    `.trim();
  } catch (error) {
    console.error('Erro ao finalizar questionário:', error);
    return '❌ Erro ao criar gestão de risco. Entre em contato com o suporte.';
  }
}

/**
 * Cancela o questionário em andamento
 */
export async function cancelQuestionnaire(userId: string): Promise<string> {
  try {
    const state = await storage.getQuestionnaireState(userId);

    if (!state) {
      return 'ℹ️ Você não tem nenhum questionário em andamento.';
    }

    await storage.deleteQuestionnaireState(userId);

    return '✅ Questionário cancelado.\n\nVocê pode iniciar um novo a qualquer momento com: /gestao criar VALOR';
  } catch (error) {
    console.error('Erro ao cancelar questionário:', error);
    return '❌ Erro ao cancelar questionário.';
  }
}

/**
 * Verifica se usuário está em um questionário ativo
 */
export async function isInQuestionnaire(userId: string): Promise<boolean> {
  try {
    const state = await storage.getQuestionnaireState(userId);
    return !!state;
  } catch (error) {
    return false;
  }
}

/**
 * Retorna o progresso atual do questionário
 */
export async function getQuestionnaireProgress(userId: string): Promise<string> {
  try {
    const state = await storage.getQuestionnaireState(userId);

    if (!state) {
      return 'ℹ️ Você não tem nenhum questionário em andamento.\n\nInicie um novo com: /gestao criar VALOR';
    }

    const progress = getProgressMessage(state.currentQuestion);
    const currentQuestion = QUESTIONS[state.currentQuestion - 1];
    const questionMsg = formatQuestion(currentQuestion);

    return `📊 Questionário em andamento\n${progress}\n\n${questionMsg}`;
  } catch (error) {
    console.error('Erro ao buscar progresso:', error);
    return '❌ Erro ao buscar progresso do questionário.';
  }
}
