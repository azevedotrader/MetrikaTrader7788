import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { X, FileSpreadsheet, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

interface CsvTip {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'success' | 'info';
  priority: 'high' | 'medium' | 'low';
  action: string;
  basedOn: string;
}

interface CsvTipsPopupProps {
  onClose?: () => void;
}

export function CsvTipsPopup({ onClose }: CsvTipsPopupProps) {
  const [currentTip, setCurrentTip] = useState<CsvTip | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const csvTipsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai/analyze-csv-tips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.tips && data.tips.length > 0) {
        // Mostrar dica de maior prioridade
        const highPriorityTip = data.tips.find((tip: CsvTip) => tip.priority === 'high') || data.tips[0];
        setCurrentTip(highPriorityTip);
        setIsVisible(true);
      } else {
        // Mostrar mensagem quando não há dicas
        setCurrentTip({
          id: 'no-tips',
          title: 'Nenhuma análise disponível',
          message: 'Não encontrei padrões específicos nos seus dados CSV no momento. Continue operando e importe mais dados para análises mais precisas.',
          type: 'info',
          priority: 'low',
          action: 'Continue importando dados CSV das suas corretoras',
          basedOn: 'Análise dos dados disponíveis'
        });
        setIsVisible(true);
      }
    },
    onError: (error) => {
      console.error('Erro ao buscar dicas CSV:', error);
      setCurrentTip({
        id: 'error',
        title: 'Erro na análise',
        message: 'Não foi possível analisar seus dados CSV no momento. Tente novamente em alguns instantes.',
        type: 'warning',
        priority: 'medium',
        action: 'Tente novamente mais tarde',
        basedOn: 'Erro do sistema'
      });
      setIsVisible(true);
    }
  });

  const handleAnalyzeCsv = () => {
    csvTipsMutation.mutate();
  };

  const handleClose = () => {
    setIsVisible(false);
    setCurrentTip(null);
    onClose?.();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <FileSpreadsheet className="h-5 w-5 text-purple-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-600';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-yellow-500';
      case 'success':
        return 'border-green-600';
      case 'info':
        return 'border-blue-600';
      default:
        return 'border-purple-600';
    }
  };

  // Botão movido para sidebar - não mostrar o botão flutuante
  if (!isVisible && !csvTipsMutation.isPending) {
    return null;
  }

  if (csvTipsMutation.isPending) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm">
        <Card className="bg-slate-900 border-slate-700 shadow-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin">
                <FileSpreadsheet className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-white font-medium">Analisando dados CSV...</p>
                <p className="text-slate-400 text-sm">Nossa IA está estudando seus trades</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentTip) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className={`bg-slate-900 ${getTypeColor(currentTip.type)} border-2 shadow-2xl animate-in slide-in-from-bottom-5`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {getIcon(currentTip.type)}
              <CardTitle className="text-white text-sm flex items-center gap-2">
                Análise CSV
                <Badge 
                  className={`${getPriorityColor(currentTip.priority)} text-white text-xs`}
                  data-testid={`csv-tip-priority-${currentTip.priority}`}
                >
                  {currentTip.priority.toUpperCase()}
                </Badge>
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
              data-testid="close-csv-tip"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <h3 className="text-white font-medium mb-2 text-sm">
            {currentTip.title}
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed mb-3">
            {currentTip.message}
          </p>
          
          <div className="bg-slate-800/50 p-3 rounded mb-3">
            <h4 className="text-slate-300 font-medium text-xs mb-1">Baseado em:</h4>
            <p className="text-slate-400 text-xs">{currentTip.basedOn}</p>
          </div>
          
          <div className="bg-purple-900/20 p-3 rounded mb-4">
            <h4 className="text-purple-600 font-medium text-xs mb-1">Ação sugerida:</h4>
            <p className="text-purple-200 text-xs">{currentTip.action}</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleClose}
              className="bg-slate-700 hover:bg-slate-600 text-white text-xs"
              data-testid="ok-csv-tip"
            >
              Entendi
            </Button>
            <Button
              size="sm"
              onClick={handleAnalyzeCsv}
              variant="outline"
              className="border-purple-600 text-purple-600 hover:bg-purple-900/20 text-xs"
              data-testid="reanalyze-csv"
            >
              Nova Análise
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}