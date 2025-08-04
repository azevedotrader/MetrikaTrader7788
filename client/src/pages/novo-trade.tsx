import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertTradeSchema, type InsertTrade } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, DollarSign, Target, TrendingUp, TrendingDown, Upload, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

const setupOptions = [
  "Breakout", "Pullback", "Reversão", "Tendência", "Support/Resistance",
  "Fibonacci", "Candlestick Pattern", "Divergência", "Scalping", "Swing"
];

const emocaoOptions = [
  { value: "confiante", label: "😎 Confiante", icon: "😎" },
  { value: "ansioso", label: "😰 Ansioso", icon: "😰" },
  { value: "impulsivo", label: "🔥 Impulsivo", icon: "🔥" },
  { value: "calmo", label: "😌 Calmo", icon: "😌" },
  { value: "eufórico", label: "🤩 Eufórico", icon: "🤩" },
  { value: "frustrado", label: "😤 Frustrado", icon: "😤" },
  { value: "neutro", label: "😐 Neutro", icon: "😐" }
];

export default function NovoTrade() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBroker, setSelectedBroker] = useState<string>("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const form = useForm<InsertTrade>({
    resolver: zodResolver(insertTradeSchema),
    defaultValues: {
      dataHora: new Date().toISOString().slice(0, 16),
      ativo: "",
      mercado: "crypto",
      setup: "",
      capitalUtilizado: "1", // Default value for backend compatibility
      quantidade: "1", // Default value for backend compatibility  
      tipo: "compra",
      stop: "", // Stop Loss (valor de perda)
      alvo: "", // Take Profit
      resultado: "", // Result
      risco: "0",
      comentario: "",
      emocao: "neutro",
      precoEntrada: "0",
      precoSaida: "0",
      corretora: "crypto",
      status: "fechado"
    },
  });

  const createTradeMutation = useMutation({
    mutationFn: async (data: InsertTrade) => {
      // Get user from localStorage correctly
      const userId = localStorage.getItem('user-id');
      if (!userId) {
        throw new Error("Usuário não autenticado");
      }
      
      const response = await fetch("/api/trades", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          "user-id": userId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao salvar trade");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Trade registrado!",
        description: "Seu trade foi salvo com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar trade",
        variant: "destructive",
      });
    },
  });

  // CSV upload mutation
  const uploadMutation = useMutation({
    mutationFn: ({ file, broker }: { file: File; broker: string }) => {
      const userId = localStorage.getItem('user-id');
      if (!userId) {
        throw new Error("Usuário não autenticado");
      }
      
      const formData = new FormData();
      formData.append('csvFile', file);
      formData.append('broker', broker);
      
      return fetch('/api/trades/upload-csv', {
        method: 'POST',
        body: formData,
        headers: {
          'user-id': userId
        }
      }).then(async res => {
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Erro ao importar CSV");
        }
        return res.json();
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trades/by-broker'] });
      queryClient.invalidateQueries({ queryKey: ['/api/csv-imports'] });
      setIsUploadDialogOpen(false);
      setCsvFile(null);
      setSelectedBroker("");
      
      toast({
        title: "Importação concluída",
        description: `${data.tradesImported} trades importados com sucesso.`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na importação",
        description: error.message || "Erro ao importar arquivo CSV",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: InsertTrade) => {
    // Ensure required backend fields have values
    const processedData = {
      ...data,
      capitalUtilizado: data.capitalUtilizado || "1", // Backend requires this
      quantidade: data.quantidade || "1", // Backend requires this
      precoEntrada: data.precoEntrada || "0", // Backend compatibility
      precoSaida: data.precoSaida || "0", // Backend compatibility
      risco: data.risco || "0", // Backend compatibility
    };
    
    createTradeMutation.mutate(processedData);
  };

  const handleUpload = () => {
    if (!csvFile || !selectedBroker) {
      toast({
        title: "Dados incompletos",
        description: "Selecione um arquivo e uma corretora",
        variant: "destructive"
      });
      return;
    }
    
    uploadMutation.mutate({ file: csvFile, broker: selectedBroker });
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Novo Trade</h1>
        <p className="text-slate-400 mt-2">Registre os detalhes da sua operação ou importe via CSV</p>
      </div>

      <Tabs defaultValue="manual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual</TabsTrigger>
          <TabsTrigger value="csv">Importar CSV</TabsTrigger>
        </TabsList>

        <TabsContent value="manual">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-400" />
                Dados da Operação
              </CardTitle>
            </CardHeader>
            <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Linha 1 - Data/Hora, Ativo, Mercado */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="dataHora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Data e Hora *</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          className="bg-slate-800 border-slate-600 text-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Ativo *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: BTCUSDT, EURUSD, PETR4"
                          className="bg-slate-800 border-slate-600 text-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mercado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Mercado *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                            <SelectValue placeholder="Selecione o mercado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          <SelectItem value="crypto">🪙 Crypto</SelectItem>
                          <SelectItem value="forex">💱 Forex</SelectItem>
                          <SelectItem value="b3">📈 B3</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Linha 2 - Setup, Tipo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="setup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Setup *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                            <SelectValue placeholder="Selecione o setup" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          {setupOptions.map((setup) => (
                            <SelectItem key={setup} value={setup}>
                              {setup}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Tipo *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                            <SelectValue placeholder="Compra ou Venda" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          <SelectItem value="compra">
                            <span className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-400" />
                              Compra
                            </span>
                          </SelectItem>
                          <SelectItem value="venda">
                            <span className="flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-red-400" />
                              Venda
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Linha 3 - Valores Simplificados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="alvo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Alvo (valor de ganho)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="bg-slate-800 border-slate-600 text-white pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stop"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Stop (valor de perda)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="bg-slate-800 border-slate-600 text-white pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Linha 5 - Emoção */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emocao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Emoção Percebida</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                            <SelectValue placeholder="Como você se sentiu?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          {emocaoOptions.map((emocao) => (
                            <SelectItem key={emocao.value} value={emocao.value}>
                              {emocao.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Comentário */}
              <FormField
                control={form.control}
                name="comentario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Comentário sobre o Trade</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva seu raciocínio, observações sobre o mercado, lições aprendidas..."
                        className="bg-slate-800 border-slate-600 text-white min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={createTradeMutation.isPending}
                  className="gradient-purple-blue hover:opacity-90 transition-opacity"
                >
                  {createTradeMutation.isPending ? "Salvando..." : "Salvar Trade"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Limpar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="csv">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="h-5 w-5 text-purple-400" />
                Importar Trades via CSV
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-300">Selecione a Corretora</label>
                  <Select value={selectedBroker} onValueChange={setSelectedBroker}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue placeholder="Escolha a corretora do arquivo CSV" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="forex">🏦 Tickmill (Forex)</SelectItem>
                      <SelectItem value="b3">📈 Clear (B3)</SelectItem>
                      <SelectItem value="crypto">🪙 Gate.io (Crypto)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-300">Arquivo CSV</label>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="bg-slate-800 border-slate-600 text-white file:bg-slate-700 file:text-white file:border-0 file:rounded-md file:px-4 file:py-2 file:mr-4"
                  />
                  <p className="text-sm text-slate-400 mt-2">
                    Selecione um arquivo CSV exportado da sua corretora
                  </p>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
                  <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    Formato do CSV por Corretora
                  </h4>
                  <div className="space-y-2 text-sm text-slate-400">
                    <p><strong className="text-white">Tickmill:</strong> Data, Ativo, Tipo, Volume, Preço Entrada, Stop Loss, Take Profit, Resultado</p>
                    <p><strong className="text-white">Clear:</strong> Data, Código, Operação, Quantidade, Preço, Total, Resultado</p>
                    <p><strong className="text-white">Gate.io:</strong> Time, Symbol, Side, Amount, Price, Fee, Total, PnL</p>
                  </div>
                </div>

                <Button 
                  onClick={handleUpload} 
                  className="w-full gradient-purple-blue hover:opacity-90 transition-opacity"
                  disabled={uploadMutation.isPending || !csvFile || !selectedBroker}
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Importar Trades
                    </>
                  )}
                </Button>

                {csvFile && (
                  <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-600">
                    <p className="text-sm text-slate-300">
                      <strong>Arquivo selecionado:</strong> {csvFile.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Tamanho: {(csvFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}