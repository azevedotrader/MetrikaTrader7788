import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { AlertTriangle, TrendingUp, TrendingDown, BarChart3, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

interface TradeAnalysis {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  suggestion: string;
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: string;
}

interface AITradeAnalysisProps {
  tradeData: {
    ativo: string;
    mercado: string;
    setup: string;
    tipo: string;
    alvo: number;
    stop: number;
    emocao?: string;
    comentario?: string;
  };
  onAnalysisComplete?: (analysis: TradeAnalysis) => void;
}

const getSentimentIcon = (sentiment: string) => {
  switch (sentiment) {
    case 'bullish':
      return <TrendingUp className="h-4 w-4 text-green-400" />;
    case 'bearish':
      return <TrendingDown className="h-4 w-4 text-red-400" />;
    default:
      return <BarChart3 className="h-4 w-4 text-yellow-400" />;
  }
};

const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case 'bullish':
      return 'bg-green-600';
    case 'bearish':
      return 'bg-red-600';
    default:
      return 'bg-yellow-600';
  }
};

const getRiskColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'low':
      return 'bg-green-600';
    case 'medium':
      return 'bg-yellow-600';
    case 'high':
      return 'bg-red-600';
    default:
      return 'bg-gray-600';
  }
};

export function AITradeAnalysis({ tradeData, onAnalysisComplete }: AITradeAnalysisProps) {
  const [analysis, setAnalysis] = useState<TradeAnalysis | null>(null);

  const analysisMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/ai/analyze-trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: (result) => {
      setAnalysis(result);
      onAnalysisComplete?.(result);
    },
    onError: (error) => {
      console.error('Erro na análise:', error);
    }
  });

  const handleAnalyze = () => {
    analysisMutation.mutate(tradeData);
  };

  if (!analysis && !analysisMutation.isPending) {
    return (
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-400" />
            Análise IA do Trade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-300 mb-4">
            Obtenha uma análise inteligente do seu trade com sugestões personalizadas.
          </p>
          <Button 
            onClick={handleAnalyze}
            className="gradient-purple-blue hover:opacity-90"
            data-testid="button-analyze-trade"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analisar Trade com IA
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (analysisMutation.isPending) {
    return (
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
            Analisando Trade...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-300">
            Nossa IA está analisando seu trade. Aguarde alguns instantes...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  return (
    <Card className="bg-slate-900/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-purple-400" />
          Análise IA do Trade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sentiment e Confiança */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getSentimentIcon(analysis.sentiment)}
              <Badge 
                className={`${getSentimentColor(analysis.sentiment)} text-white border-0`}
                data-testid={`badge-sentiment-${analysis.sentiment}`}
              >
                {analysis.sentiment === 'bullish' ? 'Alta' : 
                 analysis.sentiment === 'bearish' ? 'Baixa' : 'Neutro'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">Confiança:</span>
              <Badge variant="outline" className="text-slate-300">
                {Math.round(analysis.confidence * 100)}%
              </Badge>
            </div>
          </div>
          <Badge 
            className={`${getRiskColor(analysis.riskLevel)} text-white border-0`}
            data-testid={`badge-risk-${analysis.riskLevel}`}
          >
            {analysis.riskLevel === 'low' ? 'Risco Baixo' : 
             analysis.riskLevel === 'medium' ? 'Risco Médio' : 'Risco Alto'}
          </Badge>
        </div>

        {/* Sugestão */}
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
          <h4 className="text-white font-medium mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            Sugestão
          </h4>
          <p className="text-slate-300 text-sm leading-relaxed">
            {analysis.suggestion}
          </p>
        </div>

        {/* Recomendação */}
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
          <h4 className="text-white font-medium mb-2">Recomendação Final</h4>
          <p className="text-slate-300 text-sm leading-relaxed">
            {analysis.recommendation}
          </p>
        </div>

        <Button 
          onClick={handleAnalyze}
          variant="outline"
          size="sm"
          className="border-slate-600 text-slate-300 hover:bg-slate-800"
          data-testid="button-reanalyze"
        >
          Nova Análise
        </Button>
      </CardContent>
    </Card>
  );
}