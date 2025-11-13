/**
 * FLUXO CONVERSACIONAL DO QUESTIONÁRIO DE GESTÃO DE RISCO
 * Sistema que gerencia o questionário de 7 perguntas via WhatsApp
 */

import type { QuestionnaireAnswers } from './risk-profile-calculator';
import { sanitizeQuestionnaireMetrics } from './questionnaire-sanitizer';

export type QuestionType = 'single_choice' | 'multiple_choice' | 'numeric';

export interface Question {
  id: number;
  text: string;
  type: QuestionType;
  options?: { key: string; label: string }[];
  validation?: (answer: string) => boolean;
  parser?: (answer: string) => any;
  helpText?: string;
}

/**
 * DEFINIÇÃO DAS 7 PERGUNTAS DO QUESTIONÁRIO
 */
export const QUESTIONS: Question[] = [
  {
    id: 1,
    text: '❓ *Pergunta 1/7:*\n\nQual é o seu nível de experiência no mercado financeiro?',
    type: 'single_choice',
    options: [
      { key: 'A', label: '(A) Iniciante (Menos de 1 ano)' },
      { key: 'B', label: '(B) Intermediário (1 a 3 anos)' },
      { key: 'C', label: '(C) Avançado (Mais de 3 anos)' },
    ],
    validation: (answer) => ['A', 'B', 'C'].includes(answer.toUpperCase()),
    parser: (answer) => answer.toUpperCase() as 'A' | 'B' | 'C',
  },
  {
    id: 2,
    text: '❓ *Pergunta 2/7:*\n\nQual é o seu objetivo principal com o trading?',
    type: 'single_choice',
    options: [
      { key: 'A', label: '(A) Preservação de Capital (Perfil Conservador)' },
      { key: 'B', label: '(B) Equilíbrio Risco/Retorno (Perfil Moderado)' },
      { key: 'C', label: '(C) Crescimento Agressivo (Perfil Arrojado)' },
    ],
    validation: (answer) => ['A', 'B', 'C'].includes(answer.toUpperCase()),
    parser: (answer) => answer.toUpperCase() as 'A' | 'B' | 'C',
  },
  {
    id: 3,
    text: '❓ *Pergunta 3/7:*\n\nEm quais mercados você opera principalmente?\n\n_Você pode escolher mais de uma opção. Separe por vírgula (ex: A,D,E)_',
    type: 'multiple_choice',
    options: [
      { key: 'A', label: '(A) Ações (Mercado à vista)' },
      { key: 'B', label: '(B) Futuros (Índice, Dólar, Commodities)' },
      { key: 'C', label: '(C) Opções' },
      { key: 'D', label: '(D) Forex' },
      { key: 'E', label: '(E) Criptomoedas' },
    ],
    validation: (answer) => {
      const choices = answer
        .toUpperCase()
        .split(/[,\s]+/)
        .filter(Boolean);
      return choices.length > 0 && choices.every((c) => ['A', 'B', 'C', 'D', 'E'].includes(c));
    },
    parser: (answer) => {
      return answer
        .toUpperCase()
        .split(/[,\s]+/)
        .filter(Boolean);
    },
  },
  {
    id: 4,
    text: '❓ *Pergunta 4/7:*\n\nQual é o seu principal horizonte de tempo operacional (timeframe)?',
    type: 'single_choice',
    options: [
      { key: 'A', label: '(A) Day Trade' },
      { key: 'B', label: '(B) Swing Trade' },
      { key: 'C', label: '(C) Position Trade' },
    ],
    validation: (answer) => ['A', 'B', 'C'].includes(answer.toUpperCase()),
    parser: (answer) => answer.toUpperCase() as 'A' | 'B' | 'C',
  },
  {
    id: 5,
    text: '❓ *Pergunta 5/7 (OPCIONAL):*\n\nQual é a sua taxa de acerto (Win Rate) e Risco/Retorno médios?\n\n*Win Rate:* Número de 0 a 100 (ex: 45)\n*Risk/Reward:* Número decimal (ex: 2.5 para 1:2.5)\n\n📝 *Formato:* Digite os valores separados por vírgula\n*Exemplo:* 45, 2.5\n\n_Ou digite "PULAR" para prosseguir sem informar_',
    type: 'numeric',
    validation: (answer) => {
      const normalized = answer.trim().toUpperCase();
      if (normalized === 'PULAR' || normalized === 'SKIP') return true;

      const parts = answer.split(/[,;]/).map((p) => p.trim());
      if (parts.length !== 2) return false;

      const winRate = parseFloat(parts[0]);
      const riskReward = parseFloat(parts[1]);

      return !isNaN(winRate) && !isNaN(riskReward) && winRate >= 0 && winRate <= 100 && riskReward >= 0.5 && riskReward <= 10;
    },
    parser: (answer) => {
      const normalized = answer.trim().toUpperCase();
      if (normalized === 'PULAR' || normalized === 'SKIP') {
        return { winRate: undefined, riskReward: undefined };
      }

      const parts = answer.split(/[,;]/).map((p) => p.trim());
      const winRate = parseFloat(parts[0]);
      const riskReward = parseFloat(parts[1]);

      // Validate ranges and return undefined if out of bounds
      const validWinRate = !isNaN(winRate) && winRate >= 0 && winRate <= 100 ? winRate : undefined;
      const validRiskReward = !isNaN(riskReward) && riskReward >= 0.5 && riskReward <= 10 ? riskReward : undefined;

      return {
        winRate: validWinRate,
        riskReward: validRiskReward,
      };
    },
    helpText: 'Digite dois números separados por vírgula (Win Rate 0-100, Risk/Reward 0.5-10) ou "PULAR"',
  },
  {
    id: 6,
    text: '❓ *Pergunta 6/7:*\n\nComo você se sentiria e o que faria após uma perda de *5% do seu capital total* em um único dia?',
    type: 'single_choice',
    options: [
      { key: 'A', label: '(A) Muito abalado. Pararia de operar por dias.' },
      { key: 'B', label: '(B) Desconfortável, mas pararia no dia e revisaria os erros.' },
      { key: 'C', label: '(C) Frustrado, mas focado. Seguiria o plano e voltaria no dia seguinte.' },
    ],
    validation: (answer) => ['A', 'B', 'C'].includes(answer.toUpperCase()),
    parser: (answer) => answer.toUpperCase() as 'A' | 'B' | 'C',
  },
  {
    id: 7,
    text: '❓ *Pergunta 7/7:*\n\nQual sua reação a uma sequência de *5 ou mais operações perdedoras consecutivas*?',
    type: 'single_choice',
    options: [
      { key: 'A', label: '(A) Começo a duvidar da minha estratégia e penso em parar/mudar.' },
      { key: 'B', label: '(B) Fico mais cauteloso e reduzo o risco temporariamente por conta própria.' },
      { key: 'C', label: '(C) Sigo o plano, pois sei que é estatisticamente normal.' },
    ],
    validation: (answer) => ['A', 'B', 'C'].includes(answer.toUpperCase()),
    parser: (answer) => answer.toUpperCase() as 'A' | 'B' | 'C',
  },
];

/**
 * Formata a mensagem de uma pergunta para envio via WhatsApp
 */
export function formatQuestion(question: Question): string {
  let message = question.text + '\n\n';

  if (question.options && question.options.length > 0) {
    question.options.forEach((opt) => {
      message += opt.label + '\n';
    });
    message += '\n';
  }

  if (question.type === 'single_choice') {
    const keys = question.options?.map((o) => o.key).join(', ') || 'A, B, C';
    message += `💬 *Digite ${keys}*`;
  } else if (question.type === 'multiple_choice') {
    message += '💬 *Digite as opções separadas por vírgula*';
  } else if (question.type === 'numeric' && question.helpText) {
    message += `💬 ${question.helpText}`;
  }

  return message;
}

/**
 * Valida a resposta do usuário para uma pergunta
 */
export function validateAnswer(questionId: number, answer: string): {
  isValid: boolean;
  errorMessage?: string;
} {
  const question = QUESTIONS.find((q) => q.id === questionId);

  if (!question) {
    return { isValid: false, errorMessage: 'Pergunta não encontrada' };
  }

  if (!answer || answer.trim().length === 0) {
    return { isValid: false, errorMessage: 'Por favor, forneça uma resposta' };
  }

  const isValid = question.validation ? question.validation(answer) : true;

  if (!isValid) {
    let errorMessage = '❌ Resposta inválida.\n\n';
    if (question.type === 'single_choice') {
      const keys = question.options?.map((o) => o.key).join(', ') || 'A, B, C';
      errorMessage += `Por favor, digite uma das opções: ${keys}`;
    } else if (question.type === 'multiple_choice') {
      errorMessage += 'Por favor, digite opções válidas separadas por vírgula (ex: A,D,E)';
    } else if (question.helpText) {
      errorMessage += question.helpText;
    }

    return { isValid: false, errorMessage };
  }

  return { isValid: true };
}

/**
 * Processa a resposta e retorna o valor parseado
 */
export function parseAnswer(questionId: number, answer: string): any {
  const question = QUESTIONS.find((q) => q.id === questionId);

  if (!question || !question.parser) {
    return answer;
  }

  return question.parser(answer);
}

/**
 * Converte respostas parciais para o formato QuestionnaireAnswers
 * VALIDA RANGES: Descarta valores fora dos limites permitidos
 * USA SANITIZAÇÃO PROFUNDA: Aceita strings, arrays, objetos e converte para números válidos
 */
export function convertToQuestionnaireAnswers(partialAnswers: any): QuestionnaireAnswers | null {
  if (!partialAnswers.q1 || !partialAnswers.q2 || !partialAnswers.q3 || !partialAnswers.q4 || !partialAnswers.q6 || !partialAnswers.q7) {
    return null; // Respostas incompletas
  }

  // Usar sanitizador profundo para métricas opcionais
  const metrics = sanitizeQuestionnaireMetrics(
    partialAnswers.q5_winRate,
    partialAnswers.q5_riskReward
  );

  return {
    q1: partialAnswers.q1,
    q2: partialAnswers.q2,
    q3: partialAnswers.q3,
    q4: partialAnswers.q4,
    q5_winRate: metrics.winRate,
    q5_riskReward: metrics.riskReward,
    q6: partialAnswers.q6,
    q7: partialAnswers.q7,
  };
}

/**
 * Mensagem de boas-vindas ao iniciar o questionário
 */
export function getWelcomeMessage(bankrollValue: number): string {
  return `
🎯 *Ótimo! Vou criar sua gestão de risco personalizada*

💰 *Valor do Capital:* R$ ${bankrollValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

📋 Vou fazer *7 perguntas* para entender seu perfil de trader e criar uma gestão 100% personalizada para você.

⏱️ Leva menos de 2 minutos.

Vamos começar? 🚀
  `.trim();
}

/**
 * Mensagem de progresso entre perguntas
 */
export function getProgressMessage(currentQuestion: number): string {
  const totalQuestions = 7;
  const percentage = Math.round((currentQuestion / totalQuestions) * 100);

  return `\n\n📊 Progresso: ${currentQuestion}/${totalQuestions} (${percentage}%)`;
}

/**
 * Mensagem de confirmação de resposta
 */
export function getConfirmationMessage(questionId: number, parsedAnswer: any): string {
  const question = QUESTIONS.find((q) => q.id === questionId);

  if (!question) return '✅ Resposta registrada!';

  if (question.type === 'single_choice') {
    const option = question.options?.find((o) => o.key === parsedAnswer);
    return `✅ Registrado: ${option?.label || parsedAnswer}`;
  } else if (question.type === 'multiple_choice') {
    const selectedOptions = parsedAnswer.map((key: string) => {
      const opt = question.options?.find((o) => o.key === key);
      return opt?.label || key;
    });
    return `✅ Mercados selecionados:\n${selectedOptions.join('\n')}`;
  } else if (question.id === 5) {
    if (parsedAnswer.winRate === undefined) {
      return '✅ Ok, vamos continuar sem essas métricas';
    }
    return `✅ Registrado:\n• Win Rate: ${parsedAnswer.winRate}%\n• Risk/Reward: 1:${parsedAnswer.riskReward}`;
  }

  return '✅ Resposta registrada!';
}
