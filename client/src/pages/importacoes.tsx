import { useState, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  FileText,
  Edit3,
  Edit2,
  Trash2,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { CsvSelectionModal } from "@/components/modals/csv-selection-modal";

export default function Importacoes() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingCsv, setEditingCsv] = useState<{
    id: string;
    currentName: string;
  } | null>(null);
  const [newCsvName, setNewCsvName] = useState("");
  const [editingTrade, setEditingTrade] = useState<any>(null);
  const [showEditTradeDialog, setShowEditTradeDialog] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);

  // Fetch CSV imports
  const { data: csvImports = [] } = useQuery({
    queryKey: ["/api/csv-imports"],
  });

  // Fetch manual trades
  const { data: allTrades = [] } = useQuery({
    queryKey: ["/api/trades"],
  });

  const manualTrades = useMemo(() => {
    return allTrades.filter((trade: any) => trade.origem === "manual");
  }, [allTrades]);

  // Broker info for display
  const brokerInfo = {
    crypto: { name: "Gate.io", color: "bg-purple-500" },
    forex: { name: "Tickmill", color: "bg-blue-500" },
    b3: { name: "Clear", color: "bg-green-600" },
  };

  // Rename CSV mutation
  const renameCsvMutation = useMutation({
    mutationFn: async (data: { csvId: string; displayName: string }) => {
      return apiRequest("PATCH", `/api/csv-imports/${data.csvId}`, { 
        displayName: data.displayName 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/csv-imports"] });
      setEditingCsv(null);
      setNewCsvName("");
      toast({
        title: "Nome atualizado",
        description: "O nome do arquivo foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o nome do arquivo.",
        variant: "destructive",
      });
    },
  });

  // Delete CSV mutation
  const deleteCsvMutation = useMutation({
    mutationFn: async (csvId: string) => {
      return apiRequest("DELETE", `/api/csv-imports/${csvId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/csv-imports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      toast({
        title: "CSV excluído",
        description: "O arquivo CSV e todos os trades relacionados foram excluídos.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o arquivo CSV.",
        variant: "destructive",
      });
    },
  });

  // Delete manual trade mutation
  const deleteManualTradeMutation = useMutation({
    mutationFn: async (tradeId: string) => {
      return apiRequest("DELETE", `/api/trades/${tradeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      toast({
        title: "Trade excluído",
        description: "O trade manual foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o trade.",
        variant: "destructive",
      });
    },
  });

  return (
    <div data-testid="importacoes-page" className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {t('dashboard.imports_and_trades')}
            </h1>
            <p className="text-zinc-400 mt-1">
              {t('imports.manage_description')}
            </p>
          </div>
          <Button
            onClick={() => setShowCsvModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
            data-testid="button-new-csv-import"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            {t('brokers.csv_import')}
          </Button>
        </div>
      </div>

      {/* Tabs Content */}
      <Tabs defaultValue="csv-imports" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-zinc-900/90 border border-zinc-800 rounded-lg p-1 gap-1">
          <TabsTrigger 
            value="csv-imports" 
            className="data-[state=active]:bg-zinc-800 data-[state=active]:border data-[state=active]:border-zinc-700 text-zinc-400 data-[state=active]:text-white py-3 px-3 rounded-md transition-all duration-200 hover:text-white hover:bg-zinc-800/50 text-sm font-medium flex items-center justify-center"
          >
            <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">{t('imports.csv_imported')}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="manual-trades" 
            className="data-[state=active]:bg-zinc-800 data-[state=active]:border data-[state=active]:border-zinc-700 text-zinc-400 data-[state=active]:text-white py-3 px-3 rounded-md transition-all duration-200 hover:text-white hover:bg-zinc-800/50 text-sm font-medium flex items-center justify-center"
          >
            <Edit3 className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">{t('imports.manual_trades')}</span>
          </TabsTrigger>
        </TabsList>

        {/* CSV Imports Tab */}
        <TabsContent value="csv-imports" className="space-y-4 mt-6">
          <Card className="bg-zinc-900/90 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">{t('imports.csv_imported')}</CardTitle>
              <CardDescription>
                Gerencie seus arquivos CSV importados e os trades relacionados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(csvImports as any[]).length === 0 ? (
                <div className="text-center py-12 text-zinc-400">
                  <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                  <h3 className="text-lg font-medium mb-2">{t('empty.no_csv_imports')}</h3>
                  <p className="text-sm mb-6">Comece importando seu primeiro arquivo CSV</p>
                  <Button
                    onClick={() => setShowCsvModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Importar CSV
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {(csvImports as any[]).map((importItem: any) => (
                    <div
                      key={importItem.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-zinc-800/50 rounded-lg space-y-3 sm:space-y-0"
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div
                          className={`w-3 h-3 rounded-full flex-shrink-0 ${importItem.status === "completed" ? "bg-green-600" : "bg-yellow-600"}`}
                        />
                        <div className="min-w-0 flex-1">
                          {editingCsv?.id === importItem.id ? (
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                              <input
                                type="text"
                                value={newCsvName}
                                onChange={(e) => setNewCsvName(e.target.value)}
                                className="bg-zinc-800 border border-zinc-600 text-white px-2 py-1 rounded text-sm w-full sm:w-auto min-w-0"
                                placeholder="Nome do arquivo"
                                data-testid={`input-csv-name-${importItem.id}`}
                              />
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (newCsvName.trim()) {
                                      renameCsvMutation.mutate({
                                        csvId: importItem.id,
                                        displayName: newCsvName.trim(),
                                      });
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
                                  onClick={() => {
                                    setEditingCsv(null);
                                    setNewCsvName("");
                                  }}
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
                          <div className="text-sm text-zinc-400 mt-1">
                            {brokerInfo[
                              importItem.broker as keyof typeof brokerInfo
                            ]?.name || importItem.broker}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-2 flex-shrink-0">
                        <div className="text-left sm:text-right">
                          <div className="text-white text-sm font-medium">
                            {importItem.tradesImported} trades
                          </div>
                          <div className="text-xs text-zinc-400">
                            {new Date(importItem.createdAt).toLocaleDateString(
                              "pt-BR",
                            )}
                          </div>
                        </div>
                        {editingCsv?.id !== importItem.id && (
                          <div className="flex space-x-1 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingCsv({
                                  id: importItem.id,
                                  currentName:
                                    importItem.displayName ||
                                    importItem.fileName,
                                });
                                setNewCsvName(
                                  importItem.displayName || importItem.fileName,
                                );
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
                                if (
                                  confirm(
                                    `Tem certeza que deseja excluir "${importItem.displayName || importItem.fileName}"?\n\nEsta ação irá deletar:\n• O arquivo CSV\n• Todos os trades relacionados a este CSV\n\nEsta ação não pode ser desfeita.`,
                                  )
                                ) {
                                  deleteCsvMutation.mutate(importItem.id);
                                }
                              }}
                              disabled={deleteCsvMutation.isPending}
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-600 border-red-400 hover:border-red-300 flex items-center justify-center"
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
        </TabsContent>

        {/* Manual Trades Tab */}
        <TabsContent value="manual-trades" className="space-y-4 mt-6">
          <Card className="bg-zinc-900/90 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">{t('imports.manual_trades')}</CardTitle>
              <CardDescription>
                Gerencie os trades criados manualmente na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              {manualTrades.length === 0 ? (
                <div className="text-center py-12 text-zinc-400">
                  <Edit3 className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                  <h3 className="text-lg font-medium mb-2">{t('empty.no_manual_trades')}</h3>
                  <p className="text-sm mb-6">Crie seu primeiro trade manual</p>
                  <Button
                    onClick={() => window.location.href = '/novo-trade'}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Novo Trade
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {manualTrades.map((trade: any) => (
                    <div
                      key={trade.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-zinc-800/50 rounded-lg space-y-3 sm:space-y-0"
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div
                          className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            parseFloat(trade.resultado || "0") >= 0 ? "bg-green-600" : "bg-red-600"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-white truncate pr-2">
                            {trade.ativo} - {trade.tipo === 'compra' ? '📈' : '📉'} {trade.tipo}
                          </div>
                          <div className="text-sm text-zinc-400 mt-1">
                            {brokerInfo[
                              trade.mercado as keyof typeof brokerInfo
                            ]?.name || trade.mercado} • Manual
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-2 flex-shrink-0">
                        <div className="text-left sm:text-right">
                          <div className={`text-sm font-medium ${
                            parseFloat(trade.resultado || "0") >= 0 ? "text-green-600" : "text-red-600"
                          }`}>
                            R$ {parseFloat(trade.resultado || "0").toFixed(2)}
                          </div>
                          <div className="text-xs text-zinc-400">
                            {new Date(trade.dataHora).toLocaleDateString(
                              "pt-BR",
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingTrade(trade);
                              setShowEditTradeDialog(true);
                            }}
                            className="h-7 w-7 p-0 text-zinc-400 hover:text-white flex items-center justify-center"
                            data-testid={`button-edit-trade-${trade.id}`}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (
                                confirm(
                                  `Tem certeza que deseja excluir este trade?\n\nAtivo: ${trade.ativo}\nTipo: ${trade.tipo}\nResultado: R$ ${parseFloat(trade.resultado || "0").toFixed(2)}\n\nEsta ação não pode ser desfeita.`,
                                )
                              ) {
                                deleteManualTradeMutation.mutate(trade.id);
                              }
                            }}
                            disabled={deleteManualTradeMutation.isPending}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-600 border-red-400 hover:border-red-300 flex items-center justify-center"
                            data-testid={`button-delete-trade-${trade.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CSV Import Modal */}
      <CsvSelectionModal 
        open={showCsvModal} 
        onOpenChange={setShowCsvModal}
      />
    </div>
  );
}