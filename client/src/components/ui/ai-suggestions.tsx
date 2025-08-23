import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { X, TrendingUp, AlertTriangle, Lightbulb, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface TradingAdvice {
  type: 'suggestion' | 'warning' | 'opportunity' | 'analysis';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  asset?: string;
}

interface AISuggestionsProps {
  userProfile?: any;
  recentTrades?: any[];
  onClose?: () => void;
}

const getIconForType = (type: string) => {
  switch (type) {
    case 'suggestion':
      return <Lightbulb className="h-4 w-4" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4" />;
    case 'opportunity':
      return <TrendingUp className="h-4 w-4" />;
    case 'analysis':
      return <BarChart3 className="h-4 w-4" />;
    default:
      return <Lightbulb className="h-4 w-4" />;
  }
};

const getColorForType = (type: string) => {
  switch (type) {
    case 'suggestion':
      return 'bg-zinc-700';
    case 'warning':
      return 'bg-red-900/50';
    case 'opportunity':
      return 'bg-green-900/50';
    case 'analysis':
      return 'bg-purple-900/50';
    default:
      return 'bg-zinc-700';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-900/50';
    case 'medium':
      return 'bg-yellow-900/50';
    case 'low':
      return 'bg-green-900/50';
    default:
      return 'bg-zinc-700';
  }
};

export function AISuggestions({ userProfile, recentTrades = [], onClose }: AISuggestionsProps) {
  const [dismissedAdvice, setDismissedAdvice] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const { data: advice = [], isLoading } = useQuery({
    queryKey: ['/api/ai/advice', userProfile?.id],
    queryFn: async () => {
      const userId = localStorage.getItem('user-id') || '';
      const response = await fetch('/api/ai/advice', {
        headers: {
          'user-id': userId
        }
      });
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Atualiza a cada 5 minutos
    enabled: showSuggestions
  });

  const filteredAdvice = advice.filter((item: TradingAdvice) => 
    !dismissedAdvice.includes(item.title)
  );

  const dismissAdvice = (title: string) => {
    setDismissedAdvice(prev => [...prev, title]);
  };

  if (!showSuggestions || filteredAdvice.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {filteredAdvice.map((item: TradingAdvice, index: number) => (
        <Card 
          key={`${item.title}-${index}`}
          className="bg-slate-900/95 border-slate-700 shadow-lg animate-in slide-in-from-right-5 duration-300"
          data-testid={`ai-suggestion-${item.type}`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getColorForType(item.type)}`}>
                  {getIconForType(item.type)}
                </div>
                <div>
                  <CardTitle className="text-white text-sm">{item.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(item.priority)} text-white border-0`}
                    >
                      {item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Média' : 'Baixa'}
                    </Badge>
                    {item.asset && (
                      <Badge variant="outline" className="text-xs bg-slate-700 text-slate-300">
                        {item.asset}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissAdvice(item.title)}
                className="text-slate-400 hover:text-white h-8 w-8 p-0"
                data-testid={`button-dismiss-${item.type}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-slate-300 text-sm leading-relaxed">{item.message}</p>
          </CardContent>
        </Card>
      ))}
      
      {filteredAdvice.length > 0 && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSuggestions(false)}
            className="text-slate-400 hover:text-white text-xs"
            data-testid="button-hide-all-suggestions"
          >
            Ocultar todas as sugestões
          </Button>
        </div>
      )}
    </div>
  );
}

export function AISuggestionsPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentAdvice, setCurrentAdvice] = useState<TradingAdvice | null>(null);

  const { data: advice = [] } = useQuery({
    queryKey: ['/api/ai/advice'],
    queryFn: async () => {
      const userId = localStorage.getItem('user-id') || '';
      const response = await fetch('/api/ai/advice', {
        headers: {
          'user-id': userId
        }
      });
      return response.json();
    },
    refetchInterval: 2 * 60 * 1000, // Verifica a cada 2 minutos
  });

  useEffect(() => {
    if (advice.length > 0) {
      const highPriorityAdvice = advice.find((item: TradingAdvice) => item.priority === 'high');
      if (highPriorityAdvice && !isVisible) {
        setCurrentAdvice(highPriorityAdvice);
        setIsVisible(true);
        
        // Auto-dismiss após 10 segundos
        setTimeout(() => {
          setIsVisible(false);
        }, 10000);
      }
    }
  }, [advice, isVisible]);

  if (!isVisible || !currentAdvice) {
    return null;
  }

  return (
    <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-right-5 duration-500">
      <Card className="bg-slate-900/95 border-slate-700 shadow-2xl max-w-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getColorForType(currentAdvice.type)}`}>
                {getIconForType(currentAdvice.type)}
              </div>
              <div>
                <CardTitle className="text-white text-sm">{currentAdvice.title}</CardTitle>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getPriorityColor(currentAdvice.priority)} text-white border-0 mt-1`}
                >
                  Prioridade {currentAdvice.priority === 'high' ? 'Alta' : currentAdvice.priority === 'medium' ? 'Média' : 'Baixa'}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="text-slate-400 hover:text-white h-8 w-8 p-0"
              data-testid="button-close-popup"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-slate-300 text-sm leading-relaxed">{currentAdvice.message}</p>
          {currentAdvice.asset && (
            <Badge variant="outline" className="text-xs bg-slate-700 text-slate-300 mt-2">
              {currentAdvice.asset}
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}