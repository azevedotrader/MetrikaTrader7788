import { useEffect, useState } from 'react';
import { useTour } from '@/contexts/TourContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ArrowLeft, ArrowRight, Skip } from 'lucide-react';
import { useLocation } from 'wouter';

interface ElementPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TourOverlay() {
  const { isActive, currentStep, steps, nextStep, prevStep, skipTour, stopTour } = useTour();
  const [location] = useLocation();
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [elementPosition, setElementPosition] = useState<ElementPosition | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const currentTourStep = steps[currentStep];
  const isCurrentPage = currentTourStep?.page === location;

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

  // Calcular posição do tooltip
  useEffect(() => {
    if (!elementPosition) {
      // Se não há elemento específico, centralizar tooltip
      setTooltipPosition({
        top: window.innerHeight / 2 - 150,
        left: window.innerWidth / 2 - 200
      });
      return;
    }

    const tooltipWidth = 400;
    const tooltipHeight = 200;
    const margin = 20;

    let top = 0;
    let left = 0;

    switch (currentTourStep?.position) {
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
        top = window.innerHeight / 2 - tooltipHeight / 2;
        left = window.innerWidth / 2 - tooltipWidth / 2;
        break;
    }

    // Ajustar se tooltip sair da tela
    if (left < margin) left = margin;
    if (left + tooltipWidth > window.innerWidth - margin) {
      left = window.innerWidth - tooltipWidth - margin;
    }
    if (top < margin) top = margin;
    if (top + tooltipHeight > window.innerHeight - margin) {
      top = window.innerHeight - tooltipHeight - margin;
    }

    setTooltipPosition({ top, left });
  }, [elementPosition, currentTourStep?.position]);

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
        className="absolute w-[400px] bg-slate-800 border-slate-700 pointer-events-auto shadow-2xl"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          zIndex: 53
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-600 text-white">
                {currentStep + 1} / {steps.length}
              </Badge>
              <CardTitle className="text-white text-lg">
                {currentTourStep?.title}
              </CardTitle>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={stopTour}
              className="text-slate-400 hover:text-white h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-slate-300 leading-relaxed">
            {currentTourStep?.description}
          </p>
          
          {/* Barra de progresso */}
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Controles de navegação */}
          <div className="flex items-center justify-between">
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
                <Skip className="h-4 w-4 mr-1" />
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}