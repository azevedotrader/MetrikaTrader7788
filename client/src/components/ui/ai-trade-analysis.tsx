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
    setup?: string;
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
      return <TrendingUp className="h-4 w-4 text-[#6EE000]" />;
    case 'bearish':
      return <TrendingDown className="h-4 w-4 text-[#FF1F3D]" />;
    default:
      return <BarChart3 className="h-4 w-4 text-yellow-500" />;
  }
};

const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case 'bullish':
      return 'bg-[#6EE000]';
    case 'bearish':
      return 'bg-[#FF1F3D]';
    default:
      return 'bg-yellow-500';
  }
};

const getRiskColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'low':
      return 'bg-[#6EE000]';
    case 'medium':
      return 'bg-yellow-500';
    case 'high':
      return 'bg-[#FF1F3D]';
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
      <Card className="bg-[#0a0a0f]/50 border-[#1e1e2e]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#6EE000]" />
            Análise IA do Trade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#e0e0e0] mb-4">
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
      <Card className="bg-[#0a0a0f]/50 border-[#1e1e2e]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Loader2 className="h-5 w-5 text-[#6EE000] animate-spin" />
            Analisando Trade...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#e0e0e0]">
            Nossa IA está analisando seu trade. Aguarde alguns instantes...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  return (
    <Card className="bg-[#0a0a0f]/50 border-[#1e1e2e]">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#6EE000]" />
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
              <span className="text-[#6e7191] text-sm">Confiança:</span>
              <Badge variant="outline" className="text-[#e0e0e0]">
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
        <div className="bg-[#0f0f1a]/50 p-4 rounded-lg border border-[#28283a]">
          <h4 className="text-white font-medium mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Sugestão
          </h4>
          <p className="text-[#e0e0e0] text-sm leading-relaxed">
            {analysis.suggestion}
          </p>
        </div>

        {/* Recomendação */}
        <div className="bg-[#0f0f1a]/50 p-4 rounded-lg border border-[#28283a]">
          <h4 className="text-white font-medium mb-2">Recomendação Final</h4>
          <p className="text-[#e0e0e0] text-sm leading-relaxed">
            {analysis.recommendation}
          </p>
        </div>

        <Button 
          onClick={handleAnalyze}
          variant="outline"
          size="sm"
          className="border-[#28283a] text-[#e0e0e0] hover:bg-[#0f0f1a]"
          data-testid="button-reanalyze"
        >
          Nova Análise
        </Button>
      </CardContent>
    </Card>
  );
}