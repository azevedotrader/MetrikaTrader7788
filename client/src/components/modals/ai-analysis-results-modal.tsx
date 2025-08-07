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
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'opportunity':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'suggestion':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const sortedTips = [...tips].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-900 border-slate-700">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <Brain className="w-6 h-6 text-purple-400" />
              Análise Profunda de Trading
            </DialogTitle>
            {csvFileName && (
              <p className="text-slate-400 mt-1">
                Análise baseada no arquivo: <span className="text-purple-300">{csvFileName}</span>
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo Geral */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">
              📊 Resumo da Análise
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-purple-400">{tips.length}</p>
                <p className="text-sm text-slate-400">Insights Gerados</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">
                  {tips.filter(t => t.priority === 'high').length}
                </p>
                <p className="text-sm text-slate-400">Alta Prioridade</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">
                  {tips.filter(t => t.type === 'opportunity').length}
                </p>
                <p className="text-sm text-slate-400">Oportunidades</p>
              </div>
            </div>
          </div>

          {/* Lista de Dicas */}
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-4">
              {sortedTips.map((tip, index) => (
                <div
                  key={tip.id}
                  className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors"
                  data-testid={`ai-tip-${tip.id}`}
                >
                  {/* Header da Dica */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getTypeColor(tip.type)}`}>
                        {getTypeIcon(tip.type)}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white">
                          {tip.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getPriorityColor(tip.priority)}>
                            {tip.priority === 'high' ? 'Alta' : 
                             tip.priority === 'medium' ? 'Média' : 'Baixa'} Prioridade
                          </Badge>
                          <Badge className={getTypeColor(tip.type)}>
                            {tip.type === 'critical' ? 'Crítico' :
                             tip.type === 'warning' ? 'Atenção' :
                             tip.type === 'opportunity' ? 'Oportunidade' : 'Sugestão'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-slate-400">
                        #{index + 1}
                      </span>
                    </div>
                  </div>

                  {/* Conteúdo da Dica */}
                  <div className="space-y-4">
                    {/* Análise Detalhada */}
                    <div>
                      <h5 className="text-sm font-semibold text-purple-300 mb-2">
                        🔍 Análise Detalhada
                      </h5>
                      <p className="text-slate-300 leading-relaxed">
                        {tip.message}
                      </p>
                    </div>

                    <Separator className="bg-slate-700" />

                    {/* Baseado Em */}
                    <div>
                      <h5 className="text-sm font-semibold text-blue-300 mb-2">
                        📈 Baseado nos Dados
                      </h5>
                      <p className="text-slate-400 text-sm">
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
                      <h5 className="text-sm font-semibold text-green-300 mb-2">
                        🎯 Ação Recomendada
                      </h5>
                      <p className="text-slate-300 text-sm">
                        {tip.action}
                      </p>
                    </div>

                    {/* Impacto Esperado */}
                    {tip.impact && (
                      <>
                        <Separator className="bg-slate-700" />
                        <div>
                          <h5 className="text-sm font-semibold text-yellow-300 mb-2">
                            ⚡ Impacto Esperado
                          </h5>
                          <p className="text-slate-400 text-sm">
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

          {/* Rodapé com Ações */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
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
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
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