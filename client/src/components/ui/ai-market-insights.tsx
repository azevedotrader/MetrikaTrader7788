import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { Input } from "./input";
import { TrendingUp, Search, Clock, Target, AlertCircle, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

interface MarketInsight {
  asset: string;
  analysis: string;
  suggestion: string;
  timeframe: string;
  confidence: number;
}

export function AIMarketInsights() {
  const [searchAsset, setSearchAsset] = useState("");
  const [insights, setInsights] = useState<MarketInsight[]>([]);

  const insightMutation = useMutation({
    mutationFn: async (asset: string) => {
      const response = await fetch(`/api/ai/market-insight/${asset}`);
      return response.json();
    },
    onSuccess: (newInsight) => {
      setInsights(prev => {
        const filtered = prev.filter(insight => insight.asset !== newInsight.asset);
        return [newInsight, ...filtered].slice(0, 5); // Keep only 5 most recent
      });
    },
    onError: (error) => {
      console.error('Erro ao buscar insight:', error);
    }
  });

  const handleSearch = () => {
    if (searchAsset.trim()) {
      insightMutation.mutate(searchAsset.trim().toUpperCase());
      setSearchAsset("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-600';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Insights de Mercado IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              value={searchAsset}
              onChange={(e) => setSearchAsset(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite o ativo (ex: BTCUSD, PETR4, EURUSD)"
              className="bg-slate-800 border-slate-600 text-white"
              data-testid="input-search-asset"
            />
            <Button
              onClick={handleSearch}
              disabled={!searchAsset.trim() || insightMutation.isPending}
              className="gradient-purple-blue hover:opacity-90"
              data-testid="button-search-insight"
            >
              {insightMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {insights.length === 0 && !insightMutation.isPending && (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400">
                Pesquise por um ativo para obter insights de mercado
              </p>
            </div>
          )}

          <div className="space-y-4">
            {insights.map((insight, index) => (
              <Card 
                key={`${insight.asset}-${index}`}
                className="bg-slate-800/50 border-slate-600"
                data-testid={`insight-card-${insight.asset}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-600" />
                      {insight.asset}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={`${getConfidenceColor(insight.confidence)} text-white border-0`}
                        data-testid={`confidence-${insight.asset}`}
                      >
                        {formatConfidence(insight.confidence)}
                      </Badge>
                      <Badge variant="outline" className="text-slate-300 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {insight.timeframe}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      Análise
                    </h4>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {insight.analysis}
                    </p>
                  </div>
                  
                  <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600">
                    <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Sugestão
                    </h4>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {insight.suggestion}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}