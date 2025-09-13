import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useLanguage } from './LanguageContext';

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

const getTourSteps = (t: (key: string) => string): TourStep[] => [
  {
    id: 'welcome',
    title: t('tour.welcome.title'),
    description: t('tour.welcome.description'),
    page: '/dashboard',
    position: 'center'
  },
  {
    id: 'dashboard-overview',
    title: t('tour.dashboard_overview.title'),
    description: t('tour.dashboard_overview.description'),
    page: '/dashboard',
    targetSelector: '[data-testid="dashboard-overview"]',
    position: 'bottom'
  },
  {
    id: 'metrics-cards',
    title: t('tour.metrics_cards.title'),
    description: t('tour.metrics_cards.description'),
    page: '/dashboard',
    targetSelector: '[data-testid="metrics-cards"]',
    position: 'bottom'
  },
  {
    id: 'performance-chart',
    title: t('tour.performance_chart.title'),
    description: t('tour.performance_chart.description'),
    page: '/dashboard',
    targetSelector: '[data-testid="performance-chart"]',
    position: 'top'
  },
  {
    id: 'sidebar-navigation',
    title: t('tour.sidebar_navigation.title'),
    description: t('tour.sidebar_navigation.description'),
    page: '/dashboard',
    targetSelector: '[data-testid="sidebar"]',
    position: 'right'
  },
  {
    id: 'new-trade',
    title: t('tour.new_trade.title'),
    description: t('tour.new_trade.description'),
    page: '/novo-trade',
    targetSelector: '[data-testid="trade-form"]',
    position: 'right'
  },
  {
    id: 'csv-analysis',
    title: t('tour.csv_analysis.title'),
    description: t('tour.csv_analysis.description'),
    page: '/novo-trade',
    targetSelector: '[data-testid="csv-import-section"]',
    position: 'left'
  },
  {
    id: 'risk-management',
    title: t('tour.risk_management.title'),
    description: t('tour.risk_management.description'),
    page: '/gestao',
    targetSelector: '[data-testid="risk-calculator"]',
    position: 'top'
  },
  {
    id: 'trading-calendar',
    title: t('tour.trading_calendar.title'),
    description: t('tour.trading_calendar.description'),
    page: '/calendario',
    targetSelector: '[data-testid="trading-calendar"]',
    position: 'top'
  },
  {
    id: 'trading-journal',
    title: t('tour.trading_journal.title'),
    description: t('tour.trading_journal.description'),
    page: '/diario',
    targetSelector: '[data-testid="journal-entries"]',
    position: 'top'
  },
  {
    id: 'ai-chat',
    title: t('tour.ai_chat.title'),
    description: t('tour.ai_chat.description'),
    page: '/dashboard',
    targetSelector: '[data-testid="ai-chat-button"]',
    position: 'left'
  },
  {
    id: 'support',
    title: t('tour.support.title'),
    description: t('tour.support.description'),
    page: '/suporte',
    targetSelector: '[data-testid="support-content"]',
    position: 'top'
  },
  {
    id: 'tour-complete',
    title: t('tour.complete.title'),
    description: t('tour.complete.description'),
    page: '/aprendizado',
    position: 'center'
  }
];

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  // Usar useMemo para evitar re-renderizações desnecessárias e garantir sincronia
  const steps = useMemo(() => getTourSteps(t), [t]);

  const startTour = () => {
    if (!steps.length) return;
    setIsActive(true);
    setCurrentStep(0);
    // Navegar para a primeira página do tour
    const firstStep = steps[0];
    if (firstStep?.page) {
      setTimeout(() => {
        setLocation(firstStep.page);
      }, 100);
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
      
      // Navegar para a página do próximo passo
      if (nextStep.page) {
        setTimeout(() => {
          setLocation(nextStep.page);
        }, 100);
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
      
      // Navegar para a página do passo anterior
      if (prevStep.page) {
        setTimeout(() => {
          setLocation(prevStep.page);
        }, 100);
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
  }, [isActive, currentStep, steps]);

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