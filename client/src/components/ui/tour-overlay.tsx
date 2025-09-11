import { useEffect, useState } from 'react';
import { useTour } from '@/contexts/TourContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ArrowLeft, ArrowRight, SkipForward } from 'lucide-react';
import { useLocation } from 'wouter';

interface ElementPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface ViewportInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
}

export function TourOverlay() {
  const { isActive, currentStep, steps, nextStep, prevStep, skipTour, stopTour } = useTour();
  const [location] = useLocation();
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [elementPosition, setElementPosition] = useState<ElementPosition | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [viewport, setViewport] = useState<ViewportInfo>({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024
  });

  const currentTourStep = steps[currentStep];
  const isCurrentPage = currentTourStep?.page === location;

  // Atualizar informações do viewport
  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setViewport({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024
      });
    };

    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);
    
    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  // Encontrar elemento alvo quando mudar de passo ou página
  useEffect(() => {
    if (!isActive || !isCurrentPage || !currentTourStep?.targetSelector) {
      setTargetElement(null);
      setElementPosition(null);
      return;
    }

    const findElement = () => {
      const element = document.querySelector(currentTourStep.targetSelector!);
      if (element) {
        setTargetElement(element);
        
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        setElementPosition({
          top: rect.top + scrollTop,
          left: rect.left + scrollLeft,
          width: rect.width,
          height: rect.height
        });

        // Scroll suave para o elemento
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    // Tentar encontrar o elemento imediatamente
    findElement();

    // Se não encontrou, tentar novamente após um delay (para elementos que carregam dinamicamente)
    if (!targetElement && currentTourStep.waitForElement) {
      const timeout = setTimeout(findElement, 500);
      return () => clearTimeout(timeout);
    }
  }, [isActive, isCurrentPage, currentStep, currentTourStep?.targetSelector, currentTourStep?.waitForElement]);

  // Calcular posição do tooltip responsivo
  useEffect(() => {
    // Dimensões responsivas do tooltip
    const getTooltipDimensions = () => {
      if (viewport.isMobile) {
        return {
          width: Math.min(350, viewport.width - 32), // 16px margin em cada lado
          height: 220,
          margin: 16
        };
      } else if (viewport.isTablet) {
        return {
          width: Math.min(400, viewport.width - 64),
          height: 200,
          margin: 32
        };
      } else {
        return {
          width: 420,
          height: 200,
          margin: 40
        };
      }
    };

    const { width: tooltipWidth, height: tooltipHeight, margin } = getTooltipDimensions();

    if (!elementPosition) {
      // Se não há elemento específico, centralizar tooltip
      setTooltipPosition({
        top: Math.max(margin, (viewport.height - tooltipHeight) / 2),
        left: Math.max(margin, (viewport.width - tooltipWidth) / 2)
      });
      return;
    }

    let top = 0;
    let left = 0;
    let position = currentTourStep?.position;

    // Em mobile, preferir posições que não saiam da tela
    if (viewport.isMobile && elementPosition) {
      const spaceAbove = elementPosition.top;
      const spaceBelow = viewport.height - (elementPosition.top + elementPosition.height);
      const spaceLeft = elementPosition.left;
      const spaceRight = viewport.width - (elementPosition.left + elementPosition.width);

      // Escolher a melhor posição automaticamente no mobile
      if (spaceBelow > tooltipHeight + margin && spaceBelow > spaceAbove) {
        position = 'bottom';
      } else if (spaceAbove > tooltipHeight + margin) {
        position = 'top';
      } else {
        position = 'center';
      }
    }

    switch (position) {
      case 'top':
        top = elementPosition.top - tooltipHeight - margin;
        left = elementPosition.left + elementPosition.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = elementPosition.top + elementPosition.height + margin;
        left = elementPosition.left + elementPosition.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        if (viewport.isMobile) {
          // No mobile, colocar embaixo do elemento em vez de ao lado
          top = elementPosition.top + elementPosition.height + margin;
          left = elementPosition.left + elementPosition.width / 2 - tooltipWidth / 2;
        } else {
          top = elementPosition.top + elementPosition.height / 2 - tooltipHeight / 2;
          left = elementPosition.left - tooltipWidth - margin;
        }
        break;
      case 'right':
        if (viewport.isMobile) {
          // No mobile, colocar embaixo do elemento em vez de ao lado
          top = elementPosition.top + elementPosition.height + margin;
          left = elementPosition.left + elementPosition.width / 2 - tooltipWidth / 2;
        } else {
          top = elementPosition.top + elementPosition.height / 2 - tooltipHeight / 2;
          left = elementPosition.left + elementPosition.width + margin;
        }
        break;
      case 'center':
      default:
        top = (viewport.height - tooltipHeight) / 2;
        left = (viewport.width - tooltipWidth) / 2;
        break;
    }

    // Garantir que o tooltip não saia da tela
    left = Math.max(margin, Math.min(left, viewport.width - tooltipWidth - margin));
    top = Math.max(margin, Math.min(top, viewport.height - tooltipHeight - margin));

    setTooltipPosition({ top, left });
  }, [elementPosition, currentTourStep?.position, viewport]);

  if (!isActive || !isCurrentPage) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-black/60" />
      
      {/* Destaque do elemento */}
      {elementPosition && (
        <>
          {/* Spotlight no elemento */}
          <div
            className="absolute border-2 border-blue-400 rounded-lg bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] animate-pulse"
            style={{
              top: elementPosition.top - 4,
              left: elementPosition.left - 4,
              width: elementPosition.width + 8,
              height: elementPosition.height + 8,
              zIndex: 51
            }}
          />
          
          {/* Seta apontando para o elemento */}
          <div
            className="absolute w-0 h-0 z-52"
            style={{
              top: currentTourStep?.position === 'top' 
                ? tooltipPosition.top + 200
                : currentTourStep?.position === 'bottom' 
                ? tooltipPosition.top - 12
                : tooltipPosition.top + 100,
              left: currentTourStep?.position === 'left'
                ? tooltipPosition.left + 400
                : currentTourStep?.position === 'right'
                ? tooltipPosition.left - 12
                : tooltipPosition.left + 200,
              borderLeft: currentTourStep?.position === 'right' ? '12px solid #1e293b' : '12px solid transparent',
              borderRight: currentTourStep?.position === 'left' ? '12px solid #1e293b' : '12px solid transparent',
              borderTop: currentTourStep?.position === 'bottom' ? '12px solid #1e293b' : '12px solid transparent',
              borderBottom: currentTourStep?.position === 'top' ? '12px solid #1e293b' : '12px solid transparent'
            }}
          />
        </>
      )}

      {/* Tooltip com informações */}
      <Card
        className={`absolute bg-slate-800 border-slate-700 pointer-events-auto shadow-2xl transition-all duration-200 ${
          viewport.isMobile ? 'w-[350px] max-w-[calc(100vw-32px)]' : 
          viewport.isTablet ? 'w-[400px] max-w-[calc(100vw-64px)]' : 
          'w-[420px]'
        }`}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          zIndex: 53
        }}
      >
        <CardHeader className={`pb-3 ${viewport.isMobile ? 'p-4' : 'p-6'}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Badge variant="secondary" className={`bg-blue-600 text-white flex-shrink-0 ${
                viewport.isMobile ? 'text-xs px-2 py-1' : ''
              }`}>
                {currentStep + 1} / {steps.length}
              </Badge>
              <CardTitle className={`text-white min-w-0 ${
                viewport.isMobile ? 'text-base leading-tight' : 'text-lg'
              }`}>
                {currentTourStep?.title}
              </CardTitle>
            </div>
            <Button
              size={viewport.isMobile ? "sm" : "sm"}
              variant="ghost"
              onClick={stopTour}
              className={`text-slate-400 hover:text-white flex-shrink-0 ${
                viewport.isMobile ? 'h-8 w-8 p-0' : 'h-6 w-6 p-0'
              }`}
            >
              <X className={viewport.isMobile ? "h-5 w-5" : "h-4 w-4"} />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className={`space-y-4 ${viewport.isMobile ? 'p-4' : 'p-6'}`}>
          <p className={`text-slate-300 leading-relaxed ${
            viewport.isMobile ? 'text-sm' : 'text-base'
          }`}>
            {currentTourStep?.description}
          </p>
          
          {/* Barra de progresso */}
          <div className={`w-full bg-slate-700 rounded-full ${
            viewport.isMobile ? 'h-1.5' : 'h-2'
          }`}>
            <div 
              className={`bg-blue-500 rounded-full transition-all duration-300 ${
                viewport.isMobile ? 'h-1.5' : 'h-2'
              }`}
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Controles de navegação */}
          <div className={`flex items-center ${
            viewport.isMobile ? 'flex-col gap-3' : 'justify-between'
          }`}>
            {viewport.isMobile ? (
              // Layout mobile: botões em coluna
              <>
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="flex-1 text-slate-300 border-slate-600 hover:bg-slate-700 h-10"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={skipTour}
                    className="flex-1 text-slate-400 hover:text-white h-10"
                  >
                    <SkipForward className="h-4 w-4 mr-1" />
                    Pular
                  </Button>
                </div>
                
                <Button
                  size="sm"
                  onClick={nextStep}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-10"
                >
                  {currentStep === steps.length - 1 ? 'Finalizar' : 'Próximo'}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </>
            ) : (
              // Layout desktop: botões em linha
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="text-slate-300 border-slate-600 hover:bg-slate-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={skipTour}
                    className="text-slate-400 hover:text-white"
                  >
                    <SkipForward className="h-4 w-4 mr-1" />
                    Pular
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={nextStep}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {currentStep === steps.length - 1 ? 'Finalizar' : 'Próximo'}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}