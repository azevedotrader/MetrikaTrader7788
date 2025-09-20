import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
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
} from "lucide-react";

export default function ImportarCSV() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [selectedBroker, setSelectedBroker] = useState<string>("");

  // Mutation para upload de CSV
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!csvFile || !selectedBroker) {
        throw new Error("Arquivo CSV e corretora são obrigatórios");
      }

      const formData = new FormData();
      formData.append("csvFile", csvFile);
      formData.append("broker", selectedBroker);

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
                  value={selectedBroker}
                  onValueChange={setSelectedBroker}
                >
                  <SelectTrigger className="bg-charcoal-800 border-charcoal-600 text-white">
                    <SelectValue placeholder={t('form.crypto_b3_forex')} />
                  </SelectTrigger>
                  <SelectContent className="bg-charcoal-800 border-charcoal-600">
                    <SelectItem value="crypto">{t('form.crypto_icon')}</SelectItem>
                    <SelectItem value="b3">{t('form.b3_icon')}</SelectItem>
                    <SelectItem value="forex">{t('form.forex_icon')}</SelectItem>
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