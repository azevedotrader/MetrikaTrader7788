import { useEffect, useState, useRef } from 'react';
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
  const [finalPosition, setFinalPosition] = useState<string>('center');
  const [viewport, setViewport] = useState<ViewportInfo>({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024
  });
  
  // Ref para controlar timeouts e evitar vazamentos
  const retryTimeoutRef = useRef<number | null>(null);

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

  // Calcular posição do elemento usando coordenadas de viewport
  const calculateElementPosition = (element: Element): ElementPosition => {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    };
  };

  // Encontrar e posicionar elemento alvo
  const findAndPositionElement = () => {
    // Limpar timeout anterior se existir
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (!isActive || !isCurrentPage || !currentTourStep?.targetSelector) {
      setTargetElement(null);
      setElementPosition(null);
      return;
    }

    const element = document.querySelector(currentTourStep.targetSelector!);
    if (element) {
      setTargetElement(element);
      setElementPosition(calculateElementPosition(element));
      
      // Scroll suave para o elemento
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (currentTourStep.waitForElement) {
      // Tentar novamente após delay para elementos dinâmicos (máximo 10 tentativas)
      retryTimeoutRef.current = window.setTimeout(findAndPositionElement, 500);
    }
  };

  // Encontrar elemento quando mudar de passo ou página
  useEffect(() => {
    findAndPositionElement();
    
    // Limpar timeout se o componente for desmontado ou passo mudar
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [isActive, isCurrentPage, currentStep, currentTourStep?.targetSelector, currentTourStep?.waitForElement]);

  // Recalcular posições no scroll e resize
  useEffect(() => {
    if (!targetElement) return;

    let rafId: number;
    const updatePosition = () => {
      if (targetElement) {
        setElementPosition(calculateElementPosition(targetElement));
      }
    };

    const debouncedUpdate = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updatePosition);
    };

    window.addEventListener('scroll', debouncedUpdate, { passive: true });
    window.addEventListener('resize', debouncedUpdate);
    window.addEventListener('orientationchange', debouncedUpdate);
    
    return () => {
      window.removeEventListener('scroll', debouncedUpdate);
      window.removeEventListener('resize', debouncedUpdate);
      window.removeEventListener('orientationchange', debouncedUpdate);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [targetElement]);

  // Função para obter dimensões responsivas do tooltip
  const getTooltipDimensions = () => {
    if (viewport.isMobile) {
      return {
        width: Math.min(350, viewport.width - 32),
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

  // Função para verificar se uma posição cabe na tela
  const positionFitsInViewport = (position: string, elementPos: ElementPosition, tooltipWidth: number, tooltipHeight: number, margin: number): boolean => {
    let top = 0;
    let left = 0;
    
    switch (position) {
      case 'top':
        top = elementPos.top - tooltipHeight - margin;
        left = elementPos.left + elementPos.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = elementPos.top + elementPos.height + margin;
        left = elementPos.left + elementPos.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = elementPos.top + elementPos.height / 2 - tooltipHeight / 2;
        left = elementPos.left - tooltipWidth - margin;
        break;
      case 'right':
        top = elementPos.top + elementPos.height / 2 - tooltipHeight / 2;
        left = elementPos.left + elementPos.width + margin;
        break;
      default:
        return true; // center sempre cabe
    }
    
    return (
      top >= margin && 
      top + tooltipHeight <= viewport.height - margin &&
      left >= margin && 
      left + tooltipWidth <= viewport.width - margin
    );
  };

  // Função para calcular posição derivada (unificada para tooltip e seta)
  const getDerivedPosition = (requestedPosition: string | undefined, elementPos: ElementPosition | null) => {
    if (!elementPos) return 'center';
    
    const { width: tooltipWidth, height: tooltipHeight, margin } = getTooltipDimensions();
    
    // Lista de posições em ordem de preferência
    const positionPriority = viewport.isMobile ? 
      ['bottom', 'top', 'center'] : 
      [requestedPosition, 'bottom', 'top', 'left', 'right', 'center'].filter(Boolean);
    
    // Tentar cada posição até encontrar uma que cabe
    for (const position of positionPriority) {
      if (positionFitsInViewport(position!, elementPos, tooltipWidth, tooltipHeight, margin)) {
        return position!;
      }
    }
    
    // Fallback para center se nenhuma posição couber
    return 'center';
  };

  // Calcular posição do tooltip responsivo
  useEffect(() => {
    const { width: tooltipWidth, height: tooltipHeight, margin } = getTooltipDimensions();
    
    // Calcular posição final unificada (inteligente)
    const derivedPosition = getDerivedPosition(currentTourStep?.position, elementPosition);
    setFinalPosition(derivedPosition);

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

    switch (derivedPosition) {
      case 'top':
        top = elementPosition.top - tooltipHeight - margin;
        left = elementPosition.left + elementPosition.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = elementPosition.top + elementPosition.height + margin;
        left = elementPosition.left + elementPosition.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = elementPosition.top + elementPosition.height / 2 - tooltipHeight / 2;
        left = elementPosition.left - tooltipWidth - margin;
        break;
      case 'right':
        top = elementPosition.top + elementPosition.height / 2 - tooltipHeight / 2;
        left = elementPosition.left + elementPosition.width + margin;
        break;
      case 'center':
      default:
        top = Math.max(margin, (viewport.height - tooltipHeight) / 2);
        left = Math.max(margin, (viewport.width - tooltipWidth) / 2);
        break;
    }

    // Clamp final apenas para ajustes menores (já calculamos uma posição que deve caber)
    left = Math.max(margin, Math.min(left, viewport.width - tooltipWidth - margin));
    top = Math.max(margin, Math.min(top, viewport.height - tooltipHeight - margin));

    setTooltipPosition({ top, left });
  }, [elementPosition, currentTourStep?.position, viewport]);

  if (!isActive || !isCurrentPage) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      
      {/* Destaque do elemento com múltiplas camadas */}
      {elementPosition && (
        <>
          {/* Spotlight principal com overlay escuro ao redor */}
          <div
            className="absolute rounded-lg bg-transparent"
            style={{
              top: elementPosition.top - (viewport.isMobile ? 8 : 6),
              left: elementPosition.left - (viewport.isMobile ? 8 : 6),
              width: elementPosition.width + (viewport.isMobile ? 16 : 12),
              height: elementPosition.height + (viewport.isMobile ? 16 : 12),
              zIndex: 49,
              boxShadow: `0 0 0 9999px rgba(0,0,0,0.75)`,
              border: '2px solid rgba(59, 130, 246, 0.7)'
            }}
          />
          
          {/* Destaque principal com animação otimizada */}
          <div
            className="absolute rounded-lg bg-transparent"
            style={{
              top: elementPosition.top - (viewport.isMobile ? 4 : 3),
              left: elementPosition.left - (viewport.isMobile ? 4 : 3),
              width: elementPosition.width + (viewport.isMobile ? 8 : 6),
              height: elementPosition.height + (viewport.isMobile ? 8 : 6),
              zIndex: 50,
              border: '3px solid rgb(22, 163, 74)',
              filter: 'drop-shadow(0 0 20px rgba(34, 197, 94, 0.8))',
              animation: 'tourHighlight 2s ease-in-out infinite'
            }}
          />
          
          {/* Seta apontando para o elemento */}
          {(() => {
            const { width: tooltipWidth, height: tooltipHeight } = getTooltipDimensions();
            const arrowSize = viewport.isMobile ? 10 : 12;
            let arrowTop = 0;
            let arrowLeft = 0;
            
            // Usar a posição final unificada
            switch (finalPosition) {
              case 'top':
                arrowTop = tooltipPosition.top + tooltipHeight;
                arrowLeft = tooltipPosition.left + tooltipWidth / 2 - arrowSize;
                break;
              case 'bottom':
                arrowTop = tooltipPosition.top - arrowSize;
                arrowLeft = tooltipPosition.left + tooltipWidth / 2 - arrowSize;
                break;
              case 'left':
                arrowTop = tooltipPosition.top + tooltipHeight / 2 - arrowSize;
                arrowLeft = tooltipPosition.left + tooltipWidth;
                break;
              case 'right':
                arrowTop = tooltipPosition.top + tooltipHeight / 2 - arrowSize;
                arrowLeft = tooltipPosition.left - arrowSize;
                break;
              default:
                return null; // Sem seta para posição center
            }
            
            return (
              <div
                className="absolute w-0 h-0"
                style={{
                  top: arrowTop,
                  left: arrowLeft,
                  zIndex: 52,
                  borderLeft: finalPosition === 'right' ? `${arrowSize}px solid #1e293b` : `${arrowSize}px solid transparent`,
                  borderRight: finalPosition === 'left' ? `${arrowSize}px solid #1e293b` : `${arrowSize}px solid transparent`,
                  borderTop: finalPosition === 'top' ? `${arrowSize}px solid #1e293b` : `${arrowSize}px solid transparent`,
                  borderBottom: finalPosition === 'bottom' ? `${arrowSize}px solid #1e293b` : `${arrowSize}px solid transparent`
                }}
              />
            );
          })()}
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