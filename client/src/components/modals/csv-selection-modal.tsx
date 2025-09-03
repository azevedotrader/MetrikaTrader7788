import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileSpreadsheet, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AiAnalysisResultsModal } from "./ai-analysis-results-modal";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const { toast } = useToast();

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
    </>
  );
}