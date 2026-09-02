import { useState, useCallback } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  Wallet,
  FileSpreadsheet,
  Edit2,
  Trash2,
} from "lucide-react";
import type { Wallet as WalletType } from "@shared/schema";

export default function ImportarCSV() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [selectedBroker, setSelectedBroker] = useState<string>("");
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);

  // Imports list state
  const [editingCsv, setEditingCsv] = useState<{ id: string; currentName: string } | null>(null);
  const [newCsvName, setNewCsvName] = useState("");

  // Fetch user's custom wallets
  const { data: wallets = [] } = useQuery<WalletType[]>({
    queryKey: ['/api/wallets'],
  });

  // Fetch CSV imports list
  const { data: csvImports = [] } = useQuery<any[]>({
    queryKey: ['/api/csv-imports'],
  });

  // ── Upload mutation ────────────────────────────────────────────────────────
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!csvFile || !selectedBroker) {
        throw new Error("Arquivo CSV e corretora são obrigatórios");
      }
      const formData = new FormData();
      formData.append("csvFile", csvFile);
      formData.append("broker", selectedBroker);
      if (selectedWalletId) formData.append("walletId", selectedWalletId);
      return apiRequest("POST", "/api/trades/upload-csv", formData);
    },
    onSuccess: (data: any) => {
      toast({
        title: "CSV importado com sucesso!",
        description: `${data.tradesImported || data.processedTrades || 'Vários'} trades foram processados e importados.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/csv-imports"] });
      setCsvFile(null);
      setSelectedBroker("");
      setSelectedWalletId(null);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
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
      toast({ title: "Arquivo obrigatório", description: "Por favor, selecione um arquivo CSV.", variant: "destructive" });
      return;
    }
    if (!selectedBroker) {
      toast({ title: "Mercado obrigatório", description: "Por favor, selecione o mercado do arquivo CSV.", variant: "destructive" });
      return;
    }
    uploadMutation.mutate();
  }, [csvFile, selectedBroker, uploadMutation, toast]);

  // ── Rename mutation ────────────────────────────────────────────────────────
  const renameCsvMutation = useMutation({
    mutationFn: async (data: { csvId: string; displayName: string }) =>
      apiRequest("PATCH", `/api/csv-imports/${data.csvId}/rename`, { displayName: data.displayName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/csv-imports"] });
      setEditingCsv(null);
      setNewCsvName("");
      toast({ title: "Nome atualizado", description: "Nome do arquivo atualizado com sucesso." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível atualizar o nome.", variant: "destructive" });
    },
  });

  // ── Delete mutation ────────────────────────────────────────────────────────
  const deleteCsvMutation = useMutation({
    mutationFn: async (csvId: string) => apiRequest("DELETE", `/api/csv-imports/${csvId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/csv-imports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      toast({ title: "CSV excluído", description: "Arquivo e todos os trades relacionados foram excluídos." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível excluir o arquivo.", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4 lg:space-y-6 p-4 lg:p-6 pb-8">

      {/* ── Upload form ─────────────────────────────────────────────────────── */}
      <Card className="bg-graphite/50 border-charcoal-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="h-5 w-5 text-neutral-400" />
            {t('trade.import_trades_csv')}
          </CardTitle>
        </CardHeader>
        <CardContent data-testid="csv-import-section" className="space-y-6">
          <div className="space-y-4">
            {/* Linha 1: Mercado + Carteira + Método de Análise */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Mercado */}
              <div>
                <label className="block text-sm font-medium mb-2 text-charcoal-300">
                  {t('form.select_market_label')}
                </label>
                <Select value={selectedBroker} onValueChange={setSelectedBroker}>
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

              {/* Carteira */}
              <div>
                <label className="block text-sm font-medium mb-2 text-charcoal-300 flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5" />
                  Carteira <span className="text-charcoal-500 font-normal">(opcional)</span>
                </label>
                <Select
                  value={selectedWalletId || "none"}
                  onValueChange={(value) => setSelectedWalletId(value === "none" ? null : value)}
                >
                  <SelectTrigger className="bg-charcoal-800 border-charcoal-600 text-white">
                    <SelectValue placeholder="Nenhuma carteira" />
                  </SelectTrigger>
                  <SelectContent className="bg-charcoal-800 border-charcoal-600 max-h-64">
                    <SelectItem value="none">
                      <span className="text-charcoal-400">— Sem carteira específica</span>
                    </SelectItem>
                    {wallets.length > 0 && (
                      <>
                        <div className="border-t border-charcoal-600 my-1" />
                        {wallets.map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            <span className="flex items-center gap-2">
                              <span
                                className="inline-block w-2 h-2 rounded-full flex-shrink-0"
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

              {/* Método de Análise */}
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
                Arquivo CSV (Os CSVs devem conter a data específica de cada trade para melhor performance).
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
              <div className="lg:col-span-2">
                <Button
                  onClick={handleUpload}
                  className="w-full gradient-purple-blue hover:opacity-90 transition-opacity"
                  disabled={uploadMutation.isPending || !csvFile || !selectedBroker}
                >
                  {uploadMutation.isPending ? (
                    <><Upload className="w-4 h-4 mr-2 animate-spin" />{t('trade.processing')}</>
                  ) : (
                    <><Upload className="w-4 h-4 mr-2" />{t('trade.import_fast')}</>
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

      {/* ── Histórico de importações ─────────────────────────────────────────── */}
      <Card className="bg-[#0a0a0f]/90 border-[#1e1e2e]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-neutral-400" />
            {t('imports.csv_imported')}
          </CardTitle>
          <CardDescription>
            Gerencie seus arquivos CSV importados e os trades relacionados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {csvImports.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
              <h3 className="text-lg font-medium mb-2">{t('empty.no_csv_imports')}</h3>
              <p className="text-sm">Nenhum CSV importado ainda. Use o formulário acima para importar.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {csvImports.map((importItem: any) => (
                <div
                  key={importItem.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-[#13131a]/50 rounded-lg space-y-3 sm:space-y-0"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${importItem.status === "completed" ? "bg-green-600" : "bg-yellow-500"}`}
                    />
                    <div className="min-w-0 flex-1">
                      {editingCsv?.id === importItem.id ? (
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                          <input
                            type="text"
                            value={newCsvName}
                            onChange={(e) => setNewCsvName(e.target.value)}
                            className="bg-[#13131a] border border-zinc-600 text-white px-2 py-1 rounded text-sm w-full sm:w-auto min-w-0"
                            placeholder="Nome do arquivo"
                            data-testid={`input-csv-name-${importItem.id}`}
                          />
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                if (newCsvName.trim()) {
                                  renameCsvMutation.mutate({ csvId: importItem.id, displayName: newCsvName.trim() });
                                }
                              }}
                              disabled={renameCsvMutation.isPending}
                              className="h-7 px-2 flex-shrink-0"
                              data-testid={`button-save-csv-${importItem.id}`}
                            >
                              ✓
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setEditingCsv(null); setNewCsvName(""); }}
                              className="h-7 px-2 flex-shrink-0"
                              data-testid={`button-cancel-csv-${importItem.id}`}
                            >
                              ✕
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="font-medium text-white truncate pr-2">
                          {importItem.displayName || importItem.fileName}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-2 flex-shrink-0">
                    <div className="text-left sm:text-right">
                      <div className="text-white text-sm font-medium">
                        {importItem.tradesImported} trades
                      </div>
                      <div className="text-xs text-zinc-400">
                        {new Date(importItem.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    {editingCsv?.id !== importItem.id && (
                      <div className="flex space-x-1 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingCsv({ id: importItem.id, currentName: importItem.displayName || importItem.fileName });
                            setNewCsvName(importItem.displayName || importItem.fileName);
                          }}
                          className="h-7 w-7 p-0 text-zinc-400 hover:text-white flex items-center justify-center"
                          data-testid={`button-edit-csv-${importItem.id}`}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm(`Tem certeza que deseja excluir "${importItem.displayName || importItem.fileName}"?\n\nEsta ação irá deletar o arquivo CSV e todos os trades relacionados.\n\nEsta ação não pode ser desfeita.`)) {
                              deleteCsvMutation.mutate(importItem.id);
                            }
                          }}
                          disabled={deleteCsvMutation.isPending}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-400 border-red-400 hover:border-red-300 flex items-center justify-center"
                          data-testid={`button-delete-csv-${importItem.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
