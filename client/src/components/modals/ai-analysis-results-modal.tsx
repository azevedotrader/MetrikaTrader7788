import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, TrendingUp, Target, Brain, X } from "lucide-react";

interface AiTip {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  action: string;
  basedOn: string;
  impact?: string;
  metrics?: string;
}

interface AiAnalysisResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tips: AiTip[];
  csvFileName?: string;
}

export function AiAnalysisResultsModal({ 
  open, 
  onOpenChange, 
  tips, 
  csvFileName 
}: AiAnalysisResultsModalProps) {

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'critical':
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'opportunity':
        return <TrendingUp className="w-5 h-5" />;
      case 'suggestion':
        return <Target className="w-5 h-5" />;
      default:
        return <Brain className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-600/20 text-red-600 border-red-600/30';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'opportunity':
        return 'bg-green-600/20 text-green-600 border-green-600/30';
      case 'suggestion':
        return 'bg-blue-600/20 text-blue-600 border-blue-600/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-600 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const sortedTips = [...tips].sort((a, b) => {
    const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
    return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-7xl h-[95vh] max-h-[95vh] md:w-[90vw] lg:w-[85vw] bg-slate-900 border-slate-700 overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4 border-b border-slate-700">
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 flex-shrink-0" />
              <span className="truncate">Análise Profunda de Trading</span>
            </DialogTitle>
            {csvFileName && (
              <p className="text-slate-400 mt-1 text-sm break-all">
                Análise baseada no arquivo: <span className="text-purple-600">{csvFileName}</span>
              </p>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Resumo Geral */}
          <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4 flex-shrink-0">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3">
              📊 Resumo da Análise
            </h3>
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
              <div className="p-2">
                <p className="text-xl sm:text-2xl font-bold text-purple-600">{tips.length}</p>
                <p className="text-xs sm:text-sm text-slate-400">Insights Gerados</p>
              </div>
              <div className="p-2">
                <p className="text-xl sm:text-2xl font-bold text-red-600">
                  {tips.filter(t => t.priority === 'high').length}
                </p>
                <p className="text-xs sm:text-sm text-slate-400">Alta Prioridade</p>
              </div>
              <div className="p-2">
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {tips.filter(t => t.type === 'opportunity').length}
                </p>
                <p className="text-xs sm:text-sm text-slate-400">Oportunidades</p>
              </div>
            </div>
          </div>

          {/* Lista de Dicas com Scroll */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full max-h-[calc(95vh-280px)] pr-2 sm:pr-4">
              <div className="space-y-4 pr-2">
                {sortedTips.map((tip, index) => (
                <div
                  key={tip.id}
                  className="bg-slate-800/50 rounded-lg p-3 sm:p-4 md:p-6 border border-slate-700 hover:border-slate-600 transition-colors mb-4"
                  data-testid={`ai-tip-${tip.id}`}
                >
                  {/* Header da Dica */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${getTypeColor(tip.type)} flex-shrink-0`}>
                        {getTypeIcon(tip.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base sm:text-lg font-semibold text-white break-words">
                          {tip.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge className={`${getPriorityColor(tip.priority)} text-xs`}>
                            {tip.priority === 'high' ? 'Alta' : 
                             tip.priority === 'medium' ? 'Média' : 'Baixa'} Prioridade
                          </Badge>
                          <Badge className={`${getTypeColor(tip.type)} text-xs`}>
                            {tip.type === 'critical' ? 'Crítico' :
                             tip.type === 'warning' ? 'Atenção' :
                             tip.type === 'opportunity' ? 'Oportunidade' : 'Sugestão'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs sm:text-sm font-medium text-slate-400">
                        #{index + 1}
                      </span>
                    </div>
                  </div>

                  {/* Conteúdo da Dica */}
                  <div className="space-y-4">
                    {/* Análise Detalhada */}
                    <div>
                      <h5 className="text-sm font-semibold text-purple-600 mb-2">
                        🔍 Análise Detalhada
                      </h5>
                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                        {tip.message}
                      </p>
                    </div>

                    <Separator className="bg-slate-700" />

                    {/* Baseado Em */}
                    <div>
                      <h5 className="text-sm font-semibold text-blue-600 mb-2">
                        📈 Baseado nos Dados
                      </h5>
                      <p className="text-slate-400 text-sm whitespace-pre-wrap break-words">
                        {tip.basedOn}
                      </p>
                      {tip.metrics && (
                        <p className="text-xs text-slate-500 mt-1">
                          <strong>Métricas:</strong> {tip.metrics}
                        </p>
                      )}
                    </div>

                    <Separator className="bg-slate-700" />

                    {/* Ação Recomendada */}
                    <div>
                      <h5 className="text-sm font-semibold text-green-600 mb-2">
                        🎯 Ação Recomendada
                      </h5>
                      <p className="text-slate-300 text-sm whitespace-pre-wrap break-words">
                        {tip.action}
                      </p>
                    </div>

                    {/* Impacto Esperado */}
                    {tip.impact && (
                      <>
                        <Separator className="bg-slate-700" />
                        <div>
                          <h5 className="text-sm font-semibold text-yellow-500 mb-2">
                            ⚡ Impacto Esperado
                          </h5>
                          <p className="text-slate-400 text-sm whitespace-pre-wrap break-words">
                            {tip.impact}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Rodapé com Ações */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-slate-700 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 text-sm sm:text-base"
              data-testid="close-analysis-modal"
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                // Função para exportar análise ou implementar ações
                const analysisText = tips.map(tip => 
                  `${tip.title}\n${tip.message}\nAção: ${tip.action}\n`
                ).join('\n---\n');
                
                navigator.clipboard.writeText(analysisText);
                // Pode adicionar toast aqui
              }}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm sm:text-base"
              data-testid="copy-analysis"
            >
              📋 Copiar Análise
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}