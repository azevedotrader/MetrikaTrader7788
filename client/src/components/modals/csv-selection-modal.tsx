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
import { apiRequest } from "@/lib/queryClient";

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
      const response = await apiRequest('POST', '/api/ai/analyze-csv-tips', { csvId });
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

    // Verificar se o usuário tem acesso à IA (apenas free precisa fazer upgrade)
    const isPaidPlan = planType === 'monthly' || planType === 'quarterly' || planType === 'annual';
    if (!isPaidPlan) {
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
      case 'forex': return 'bg-[#6EE000]/20 text-[#6EE000] border-[#6EE000]/30';
      case 'crypto': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'b3': return 'bg-blue-600/20 text-blue-600 border-blue-600/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl bg-[#0a0a0f] border-[#1e1e2e] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Selecionar CSV para Análise IA
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-[#6EE000] border-t-transparent rounded-full"></div>
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
                            ? 'border-[#6EE000] bg-[#6EE000]/10'
                            : 'border-zinc-700 bg-[#13131a]/50 hover:border-zinc-600'
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
                                <CheckCircle className="w-4 h-4 text-[#6EE000]" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            
                            <div className="text-sm">
                              <div>
                                <span className="text-slate-400">Trades importados:</span>
                                <span className="ml-2 text-[#6EE000] font-medium">
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
                    className="flex-1 bg-[#6EE000] hover:bg-[#6EE000] text-white"
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
        <DialogContent className="w-full max-w-[95vw] md:max-w-4xl bg-[#0a0a0f] border-[#1e1e2e] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-lg md:text-xl">
              <Zap className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
              <span className="text-sm md:text-base">Upgrade Necessário para Análise de CSV com IA</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 md:space-y-6">
            <div className="text-center">
              <p className="text-zinc-300 text-base md:text-lg mb-2 md:mb-4">
                🤖 Nossa IA está pronta para analisar seus CSVs e fornecer insights personalizados!
              </p>
              <p className="text-zinc-400 text-sm md:text-base">
                A análise de CSV com Inteligência Artificial está disponível apenas para membros premium.
              </p>
            </div>

            <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-3">
              {/* Plano Starter */}
              <div className="border border-zinc-700 rounded-lg p-4 md:p-6 bg-[#13131a]/50 hover:bg-[#13131a] transition-colors">
                <div className="text-center mb-3 md:mb-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-blue-600/20 rounded-lg mb-2 md:mb-3">
                    <Star className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-white">Starter</h3>
                  <p className="text-xs md:text-sm text-zinc-400">Perfeito para começar</p>
                </div>
                
                <div className="text-center mb-3 md:mb-4">
                  <div className="text-xl md:text-2xl font-bold text-blue-600">R$ 19,90</div>
                  <div className="text-xs md:text-sm text-zinc-400">/mês</div>
                </div>

                <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-zinc-300 mb-4 md:mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-[#6EE000] flex-shrink-0" />
                    <span>Análise IA de CSV</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-[#6EE000] flex-shrink-0" />
                    <span>Chat com Assistente IA</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-[#6EE000] flex-shrink-0" />
                    <span>Analytics avançados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-[#6EE000] flex-shrink-0" />
                    <span>Suporte prioritário</span>
                  </li>
                </ul>

                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm md:text-base py-2 md:py-3">
                  Escolher Starter
                </Button>
              </div>

              {/* Plano Pro */}
              <div className="border-2 border-[#6EE000] rounded-lg p-4 md:p-6 bg-[#6EE000]/10 hover:bg-[#6EE000]/15 transition-colors relative">
                <div className="absolute -top-2 md:-top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-[#6EE000] text-white px-2 py-0.5 md:px-3 md:py-1 text-xs md:text-sm">
                    MAIS POPULAR
                  </Badge>
                </div>
                
                <div className="text-center mb-3 md:mb-4 mt-3 md:mt-0">
                  <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-[#6EE000]/20 rounded-lg mb-2 md:mb-3">
                    <Crown className="w-5 h-5 md:w-6 md:h-6 text-[#6EE000]" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-white">Pro</h3>
                  <p className="text-xs md:text-sm text-zinc-400">Escolha mais popular</p>
                </div>
                
                <div className="text-center mb-3 md:mb-4">
                  <div className="text-xl md:text-2xl font-bold text-[#6EE000]">R$ 49,90</div>
                  <div className="text-xs md:text-sm text-zinc-400">/mês</div>
                </div>

                <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-zinc-300 mb-4 md:mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-[#6EE000] flex-shrink-0" />
                    <span>Tudo do Starter</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-[#6EE000] flex-shrink-0" />
                    <span>Gestão de risco avançada</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-[#6EE000] flex-shrink-0" />
                    <span>Estratégias personalizadas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-[#6EE000] flex-shrink-0" />
                    <span>Alertas em tempo real</span>
                  </li>
                </ul>

                <Button className="w-full bg-[#6EE000] hover:bg-[#6EE000] text-white text-sm md:text-base py-2 md:py-3">
                  Escolher Pro
                </Button>
              </div>

              {/* Plano VIP */}
              <div className="border border-zinc-700 rounded-lg p-4 md:p-6 bg-[#13131a]/50 hover:bg-[#13131a] transition-colors">
                <div className="text-center mb-3 md:mb-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-[#5bc800]/20 rounded-lg mb-2 md:mb-3">
                    <Crown className="w-5 h-5 md:w-6 md:h-6 text-[#6EE000]" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-white">VIP</h3>
                  <p className="text-xs md:text-sm text-zinc-400">Para traders sérios</p>
                </div>
                
                <div className="text-center mb-3 md:mb-4">
                  <div className="text-xl md:text-2xl font-bold text-[#6EE000]">R$ 97,00</div>
                  <div className="text-xs md:text-sm text-zinc-400">/mês</div>
                </div>

                <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-zinc-300 mb-4 md:mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-[#6EE000] flex-shrink-0" />
                    <span>Tudo do Pro</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-[#6EE000] flex-shrink-0" />
                    <span>Sessões 1-on-1</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-[#6EE000] flex-shrink-0" />
                    <span>Suporte VIP</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-[#6EE000] flex-shrink-0" />
                    <span>Sinais exclusivos</span>
                  </li>
                </ul>

                <Button className="w-full bg-[#5bc800] hover:bg-[#6EE000] text-white text-sm md:text-base py-2 md:py-3">
                  Escolher VIP
                </Button>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs md:text-sm text-zinc-400 mb-3 md:mb-4 px-2">
                ⚡ Faça upgrade agora e desbloqueie todo o potencial da análise de trading powered por IA!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full sm:flex-1 border-zinc-600 text-zinc-300 hover:bg-[#13131a] text-sm md:text-base py-2 md:py-3"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    // Aqui seria redirecionado para a página de planos
                    window.open('/pricing', '_blank');
                  }}
                  className="w-full sm:flex-1 bg-gradient-to-r from-[#6EE000] to-[#448aff] hover:from-[#5bc800] hover:to-[#3a7aff] text-white text-sm md:text-base py-2 md:py-3"
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