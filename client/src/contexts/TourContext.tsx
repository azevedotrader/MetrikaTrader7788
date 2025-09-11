import { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';

interface TourStep {
  id: string;
  title: string;
  description: string;
  page: string; // Rota da página
  targetSelector?: string; // Seletor CSS do elemento a destacar
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void; // Ação opcional a executar no passo
  waitForElement?: boolean; // Aguardar elemento aparecer na tela
}

interface TourContextType {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  startTour: () => void;
  stopTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Métrika!',
    description: 'Vamos fazer um tour completo pela plataforma de análise de trading. Você aprenderá como usar cada funcionalidade.',
    page: '/dashboard',
    position: 'center'
  },
  {
    id: 'dashboard-overview',
    title: 'Dashboard - Visão Geral',
    description: 'Este é seu painel principal. Aqui você visualiza um resumo completo da sua performance, incluindo rentabilidade total, número de trades e principais métricas.',
    page: '/dashboard',
    targetSelector: '[data-testid="dashboard-overview"]',
    position: 'bottom'
  },
  {
    id: 'metrics-cards',
    title: 'Cartões de Métricas',
    description: 'Estes cartões mostram suas principais estatísticas: rentabilidade, total de trades, taxa de acerto e outros indicadores importantes para acompanhar seu desempenho.',
    page: '/dashboard',
    targetSelector: '[data-testid="metrics-cards"]',
    position: 'bottom'
  },
  {
    id: 'performance-chart',
    title: 'Gráfico de Performance',
    description: 'Visualize a evolução da sua rentabilidade ao longo do tempo. Este gráfico ajuda a identificar tendências e períodos de melhor ou pior performance.',
    page: '/dashboard',
    targetSelector: '[data-testid="performance-chart"]',
    position: 'top'
  },
  {
    id: 'sidebar-navigation',
    title: 'Navegação Lateral',
    description: 'Use a barra lateral para navegar entre as diferentes seções da plataforma. Cada ícone representa uma funcionalidade específica.',
    page: '/dashboard',
    targetSelector: '[data-testid="sidebar"]',
    position: 'right'
  },
  {
    id: 'new-trade',
    title: 'Novo Trade',
    description: 'Aqui você pode registrar novos trades manualmente ou importar dados via CSV. É o ponto de entrada para todos os seus dados de trading.',
    page: '/novo-trade',
    targetSelector: '[data-testid="trade-form"]',
    position: 'right'
  },
  {
    id: 'csv-analysis',
    title: 'Análise de CSV com IA',
    description: 'Nossa IA pode analisar seus arquivos CSV automaticamente, detectando trades e extraindo informações importantes, independente do formato do arquivo.',
    page: '/novo-trade',
    targetSelector: '[data-testid="csv-import-section"]',
    position: 'left'
  },
  {
    id: 'risk-management',
    title: 'Gestão de Risco',
    description: 'Calcule o tamanho ideal das suas posições, gerencie o risco por operação e projete o crescimento do seu capital com base nas suas metas.',
    page: '/gestao',
    targetSelector: '[data-testid="risk-calculator"]',
    position: 'top'
  },
  {
    id: 'trading-calendar',
    title: 'Calendário de Trading',
    description: 'Visualize sua performance diária, identifique padrões temporais e analise seus melhores e piores dias de trading em formato de calendário.',
    page: '/calendario',
    targetSelector: '[data-testid="trading-calendar"]',
    position: 'top'
  },
  {
    id: 'trading-journal',
    title: 'Diário de Trading',
    description: 'Mantenha um registro detalhado das suas reflexões, emoções e lições aprendidas. O diário é fundamental para sua evolução como trader.',
    page: '/diario',
    targetSelector: '[data-testid="journal-entries"]',
    position: 'top'
  },
  {
    id: 'ai-chat',
    title: 'Chat com IA',
    description: 'Converse com nossa IA para obter insights sobre seus trades, estratégias e performance. Ela pode ajudar a analisar padrões e sugerir melhorias.',
    page: '/dashboard',
    targetSelector: '[data-testid="ai-chat-button"]',
    position: 'left'
  },
  {
    id: 'support',
    title: 'Suporte',
    description: 'Precisa de ajuda? Nossa seção de suporte oferece respostas para dúvidas frequentes e canal direto para entrar em contato conosco.',
    page: '/suporte',
    targetSelector: '[data-testid="support-content"]',
    position: 'top'
  },
  {
    id: 'tour-complete',
    title: 'Tour Concluído!',
    description: 'Parabéns! Agora você conhece todas as principais funcionalidades da plataforma. Continue explorando e aproveite ao máximo suas ferramentas de análise.',
    page: '/aprendizado',
    position: 'center'
  }
];

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();

  const steps = tourSteps;

  const startTour = () => {
    setIsActive(true);
    setCurrentStep(0);
    // Navegar para a primeira página do tour
    const firstStep = steps[0];
    if (firstStep.page) {
      setLocation(firstStep.page);
    }
  };

  const stopTour = () => {
    setIsActive(false);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      const nextStepIndex = currentStep + 1;
      const nextStep = steps[nextStepIndex];
      
      setCurrentStep(nextStepIndex);
      
      // Navegar para a página do próximo passo se for diferente da atual
      if (nextStep.page) {
        setLocation(nextStep.page);
      }
    } else {
      stopTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1;
      const prevStep = steps[prevStepIndex];
      
      setCurrentStep(prevStepIndex);
      
      // Navegar para a página do passo anterior se for diferente da atual
      if (prevStep.page) {
        setLocation(prevStep.page);
      }
    }
  };

  const skipTour = () => {
    stopTour();
  };

  // Executar ação do passo quando mudar
  useEffect(() => {
    if (isActive && steps[currentStep]?.action) {
      steps[currentStep].action!();
    }
  }, [isActive, currentStep]);

  const value = {
    isActive,
    currentStep,
    steps,
    startTour,
    stopTour,
    nextStep,
    prevStep,
    skipTour
  };

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}