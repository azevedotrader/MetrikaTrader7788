import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileSpreadsheet, Clock, CheckCircle, AlertCircle, Crown, Star, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AiAnalysisResultsModal } from "./ai-analysis-results-modal";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserPlan } from "@/hooks/useUserPlan";

interface CsvImport {
  id: string;
  broker: string;
  fileName: string;
  displayName?: string;
  tradesImported: number;
  tradesSkipped: number;
  status: string;
  createdAt: string;
}

interface CsvSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export function CsvSelectionModal({ open, onOpenChange }: CsvSelectionModalProps) {
  const { t } = useLanguage();
  const [selectedCsvId, setSelectedCsvId] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AiTip[]>([]);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const { toast } = useToast();
  const { isAiEnabled, planType } = useUserPlan();

  const { data: csvImports = [], isLoading } = useQuery<CsvImport[]>({
    queryKey: ['/api/csv-imports'],
    enabled: open,
  });

  const csvAnalysisMutation = useMutation({
    mutationFn: async (csvId: string) => {
      const userId = localStorage.getItem('user-id') || '';
      const response = await fetch('/api/ai/analyze-csv-tips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId
        },
        body: JSON.stringify({ csvId })
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.tips && data.tips.length > 0) {
        // Abrir modal com análise completa
        setAnalysisResults(data.tips);
        setShowAnalysisModal(true);
        
        toast({
          title: t('trade.analysis_complete'),
          description: `${data.tips.length} ${t('trade.insights_generated')}`,
          duration: 5000
        });
      } else {
        toast({
          title: "🤖 Análise IA Finalizada",
          description: "CSV analisado. Adicione mais trades para receber dicas personalizadas."
        });
      }
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Erro na Análise",
        description: "Não foi possível analisar o CSV selecionado. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const handleAnalyze = () => {
    if (!selectedCsvId) {
      toast({
        title: "Selecione um CSV",
        description: "Escolha um arquivo CSV para analisar.",
        variant: "destructive"
      });
      return;
    }

    // Verificar se o usuário tem acesso à IA
    if (!isAiEnabled) {
      setShowUpgradeModal(true);
      return;
    }

    // Guardar nome do arquivo selecionado
    const selectedCsv = csvImports.find(csv => csv.id === selectedCsvId);
    if (selectedCsv) {
      setSelectedFileName(selectedCsv.displayName || selectedCsv.fileName);
    }

    csvAnalysisMutation.mutate(selectedCsvId);
    toast({
      title: "🤖 Iniciando Análise Profunda",
      description: "Nossa IA está analisando detalhadamente seus trades..."
    });
  };

  const getBrokerLabel = (broker: string) => {
    switch (broker) {
      case 'forex': return 'Forex';
      case 'crypto': return 'Crypto';
      case 'b3': return 'B3';
      default: return broker;
    }
  };

  const getBrokerColor = (broker: string) => {
    switch (broker) {
      case 'forex': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'crypto': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'b3': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Selecionar CSV para Análise IA
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full"></div>
                <span className="ml-2 text-slate-400">Carregando CSVs...</span>
              </div>
            ) : csvImports.length === 0 ? (
              <div className="text-center py-8">
                <FileSpreadsheet className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">Nenhum CSV importado encontrado.</p>
                <p className="text-sm text-slate-500 mt-2">
                  {t('trade.import_csv_first')}
                </p>
              </div>
            ) : (
              <>
                <ScrollArea className="max-h-96">
                  <div className="space-y-3">
                    {csvImports.map((csvImport) => (
                      <div
                        key={csvImport.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                          selectedCsvId === csvImport.id
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                        }`}
                        onClick={() => setSelectedCsvId(csvImport.id)}
                        data-testid={`csv-item-${csvImport.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-white font-medium">{csvImport.displayName || csvImport.fileName}</h3>
                              <Badge className={getBrokerColor(csvImport.broker)}>
                                {getBrokerLabel(csvImport.broker)}
                              </Badge>
                              {csvImport.status === 'completed' ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            
                            <div className="text-sm">
                              <div>
                                <span className="text-slate-400">Trades importados:</span>
                                <span className="ml-2 text-green-400 font-medium">
                                  {csvImport.tradesImported}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                              <Clock className="w-3 h-3" />
                              {format(new Date(csvImport.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex gap-3 pt-4 border-t border-zinc-700">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                    data-testid="cancel-csv-selection"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAnalyze}
                    disabled={!selectedCsvId || csvAnalysisMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    data-testid="analyze-selected-csv"
                  >
                    {csvAnalysisMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Analisando...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Analisar CSV
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <AiAnalysisResultsModal
        open={showAnalysisModal}
        onOpenChange={setShowAnalysisModal}
        tips={analysisResults}
        csvFileName={selectedFileName}
      />

      {/* Modal de Upgrade */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-xl">
              <Zap className="w-6 h-6 text-yellow-500" />
              Upgrade Necessário para Análise de CSV com IA
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="text-center">
              <p className="text-zinc-300 text-lg mb-4">
                🤖 Nossa IA está pronta para analisar seus CSVs e fornecer insights personalizados!
              </p>
              <p className="text-zinc-400">
                A análise de CSV com Inteligência Artificial está disponível apenas para membros premium.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Plano Starter */}
              <div className="border border-zinc-700 rounded-lg p-6 bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-lg mb-3">
                    <Star className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Starter</h3>
                  <p className="text-sm text-zinc-400">Perfeito para começar</p>
                </div>
                
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-blue-400">R$ 89</div>
                  <div className="text-sm text-zinc-400">/mês</div>
                </div>

                <ul className="space-y-2 text-sm text-zinc-300 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Análise IA de CSV
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Chat com Assistente IA
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Analytics avançados
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Suporte prioritário
                  </li>
                </ul>

                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Escolher Starter
                </Button>
              </div>

              {/* Plano Pro */}
              <div className="border-2 border-green-500 rounded-lg p-6 bg-green-500/10 hover:bg-green-500/15 transition-colors relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-green-500 text-white px-3 py-1">
                    MAIS POPULAR
                  </Badge>
                </div>
                
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-lg mb-3">
                    <Crown className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Pro</h3>
                  <p className="text-sm text-zinc-400">Escolha mais popular</p>
                </div>
                
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-green-400">R$ 239</div>
                  <div className="text-sm text-zinc-400">/mês</div>
                </div>

                <ul className="space-y-2 text-sm text-zinc-300 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Tudo do Starter
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Gestão de risco avançada
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Estratégias personalizadas
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Alertas em tempo real
                  </li>
                </ul>

                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  Escolher Pro
                </Button>
              </div>

              {/* Plano Black */}
              <div className="border border-zinc-700 rounded-lg p-6 bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-lg mb-3">
                    <Crown className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Black</h3>
                  <p className="text-sm text-zinc-400">Para traders sérios</p>
                </div>
                
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-purple-400">R$ 599</div>
                  <div className="text-sm text-zinc-400">/mês</div>
                </div>

                <ul className="space-y-2 text-sm text-zinc-300 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Tudo do Pro
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Sessões 1-on-1
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Suporte VIP
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Sinais exclusivos
                  </li>
                </ul>

                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  Escolher Black
                </Button>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-zinc-400 mb-4">
                ⚡ Faça upgrade agora e desbloqueie todo o potencial da análise de trading powered por IA!
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    // Aqui seria redirecionado para a página de planos
                    window.open('/pricing', '_blank');
                  }}
                  className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                >
                  Ver Todos os Planos
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}