import { useState, useCallback, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserPlan } from "@/hooks/useUserPlan";
import { VipUpgradeModal } from "@/components/modals/vip-upgrade-modal";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileText,
  Crown,
  Lock,
  Wallet,
} from "lucide-react";
import type { Wallet as WalletType } from "@shared/schema";

export default function ImportarCSV() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { planType, isLoading: planLoading } = useUserPlan();
  
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [selectedBroker, setSelectedBroker] = useState<string>("");
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const isFreePlan = planType === 'free';

  // Fetch user's custom wallets
  const { data: wallets = [] } = useQuery<WalletType[]>({
    queryKey: ['/api/wallets'],
  });
  
  useEffect(() => {
    if (!planLoading && isFreePlan) {
      setShowUpgradeModal(true);
    }
  }, [planLoading, isFreePlan]);

  // Mutation para upload de CSV
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!csvFile || !selectedBroker) {
        throw new Error("Arquivo CSV e corretora são obrigatórios");
      }

      const formData = new FormData();
      formData.append("csvFile", csvFile);
      formData.append("broker", selectedBroker);
      
      // Include walletId if a custom wallet is selected
      if (selectedWalletId) {
        formData.append("walletId", selectedWalletId);
      }

      return apiRequest("POST", "/api/trades/upload-csv", formData);
    },
    onSuccess: (data: any) => {
      toast({
        title: "CSV importado com sucesso!",
        description: `${data.tradesImported || data.processedTrades || 'Vários'} trades foram processados e importados.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/csv-imports"] });
      
      // Reset form
      setCsvFile(null);
      setSelectedBroker("");
      setSelectedWalletId(null);
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro na importação",
        description: error.message || "Não foi possível importar o arquivo CSV",
        variant: "destructive",
      });
    },
  });

  const handleUpload = useCallback(() => {
    if (!csvFile) {
      toast({
        title: "Arquivo obrigatório",
        description: "Por favor, selecione um arquivo CSV para importar.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedBroker) {
      toast({
        title: "Mercado obrigatório",
        description: "Por favor, selecione o mercado/corretora do arquivo CSV.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate();
  }, [csvFile, selectedBroker, uploadMutation, toast]);

  if (isFreePlan) {
    return (
      <div className="space-y-4 lg:space-y-6 p-4 lg:p-6 pb-8">
        <Card className="bg-graphite/50 border-charcoal-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center p-6 max-w-md">
              <div className="w-16 h-16 bg-gradient-to-br from-[#6EE000] to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Recurso VIP</h3>
              <p className="text-zinc-400 mb-4">
                A importação de CSV está disponível apenas para assinantes VIP. 
                Faça upgrade para desbloquear este recurso.
              </p>
              <Button 
                onClick={() => setShowUpgradeModal(true)}
                className="bg-gradient-to-r from-[#6EE000] to-yellow-500 hover:from-[#6EE000] hover:to-yellow-600 text-white font-bold"
                data-testid="button-upgrade-csv"
              >
                <Crown className="w-4 h-4 mr-2" />
                Desbloquear Agora
              </Button>
            </div>
          </div>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Upload className="h-5 w-5 text-neutral-400" />
              {t('trade.import_trades_csv')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 opacity-30 pointer-events-none">
            <div className="h-48 flex items-center justify-center text-zinc-500">
              Conteúdo bloqueado para usuários Free
            </div>
          </CardContent>
        </Card>
        
        <VipUpgradeModal 
          open={showUpgradeModal} 
          onOpenChange={setShowUpgradeModal}
          feature="csv"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6 p-4 lg:p-6 pb-8">
      <Card className="bg-graphite/50 border-charcoal-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="h-5 w-5 text-neutral-400" />
            {t('trade.import_trades_csv')}
          </CardTitle>
        </CardHeader>
        <CardContent data-testid="csv-import-section" className="space-y-6">
          <div className="space-y-4">
            {/* Linha 1: Mercado e Método de Análise lado a lado */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-charcoal-300">
                  {t('form.select_market_label')}
                </label>
                <Select
                  value={selectedWalletId ? `wallet:${selectedWalletId}` : selectedBroker}
                  onValueChange={(value) => {
                    // Verificar se é uma carteira customizada
                    if (value.startsWith("wallet:")) {
                      const walletId = value.replace("wallet:", "");
                      const wallet = wallets.find(w => w.id === walletId);
                      if (wallet) {
                        setSelectedWalletId(walletId);
                        setSelectedBroker(wallet.name);
                      }
                    } else {
                      // Mercado padrão
                      setSelectedWalletId(null);
                      setSelectedBroker(value);
                    }
                  }}
                >
                  <SelectTrigger className="bg-charcoal-800 border-charcoal-600 text-white">
                    <SelectValue placeholder={t('form.crypto_b3_forex')} />
                  </SelectTrigger>
                  <SelectContent className="bg-charcoal-800 border-charcoal-600 max-h-72">
                    <SelectItem value="crypto">{t('form.crypto_icon')}</SelectItem>
                    <SelectItem value="b3">{t('form.b3_icon')}</SelectItem>
                    <SelectItem value="forex">{t('form.forex_icon')}</SelectItem>
                    {wallets.length > 0 && (
                      <>
                        <div className="border-t border-charcoal-600 my-1" />
                        <div className="px-2 py-1.5 text-xs text-charcoal-400 font-medium flex items-center gap-1">
                          <Wallet className="h-3 w-3" />
                          Carteiras Customizadas
                        </div>
                        {wallets.map((wallet) => (
                          <SelectItem 
                            key={wallet.id} 
                            value={`wallet:${wallet.id}`}
                          >
                            <span className="flex items-center gap-2">
                              <span 
                                className="inline-block w-2 h-2 rounded-full"
                                style={{ backgroundColor: wallet.color || '#8B5CF6' }}
                              />
                              {wallet.name}
                            </span>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-charcoal-300">
                  Método de Análise
                </label>
                <div className="bg-charcoal-800/50 p-3 rounded-lg border border-charcoal-600 h-[42px] flex items-center">
                  <div className="flex items-center gap-2">
                    <div className="text-yellow-500">⚡</div>
                    <span className="text-white font-medium text-sm">MetrikAI Tradicional</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-charcoal-300">
                Arquivo CSV (Os CSVS devem conter a data específica de cada trade para melhor performance).
              </label>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="bg-charcoal-800 border-charcoal-600 text-white file:bg-charcoal-700 file:text-white file:border-0 file:rounded-md file:px-4 file:py-2 file:mr-4"
              />
              <p className="text-sm text-charcoal-400 mt-2">
                {t('trade.select_csv_exported')}
              </p>
            </div>

            <div className="bg-charcoal-800/50 p-4 rounded-lg border border-charcoal-600">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-neutral-400" />
                {t('trade.csv_format_by_market')}
              </h4>
              {/* Layout responsivo: vertical no mobile, grid no desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-sm text-charcoal-400">
                <div className="space-y-1">
                  <strong className="text-white block">Forex:</strong>
                  <span className="text-xs leading-relaxed">Data, Ativo, Tipo, Volume, Preço Entrada, Stop Loss, Take Profit, Resultado</span>
                </div>
                <div className="space-y-1">
                  <strong className="text-white block">B3:</strong>
                  <span className="text-xs leading-relaxed">Data, Código, Operação, Quantidade, Preço, Total, Resultado</span>
                </div>
                <div className="space-y-1">
                  <strong className="text-white block">Crypto:</strong>
                  <span className="text-xs leading-relaxed">Time, Symbol, Side, Amount, Price, Fee, Total, PnL</span>
                </div>
              </div>
            </div>

            {/* Layout responsivo: botão e info do arquivo */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
              <div className="lg:col-span-2">
                <Button
                  onClick={handleUpload}
                  className="w-full gradient-purple-blue hover:opacity-90 transition-opacity"
                  disabled={
                    uploadMutation.isPending || !csvFile || !selectedBroker
                  }
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-spin" />
                      {t('trade.processing')}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {t('trade.import_fast')}
                    </>
                  )}
                </Button>
              </div>
              
              {csvFile && (
                <div className="bg-charcoal-800/50 p-3 rounded-lg border border-charcoal-600 lg:col-span-1">
                  <p className="text-sm text-charcoal-300 truncate">
                    <strong>Arquivo:</strong> {csvFile.name}
                  </p>
                  <p className="text-xs text-charcoal-400">
                    {(csvFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}