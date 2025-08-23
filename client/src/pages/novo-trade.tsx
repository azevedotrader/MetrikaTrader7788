import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertTradeSchema, type InsertTrade } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, DollarSign, Target, TrendingUp, TrendingDown, Upload, FileText, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { AITradeAnalysis } from "@/components/ui/ai-trade-analysis";

const setupOptions = [
  "Breakout", "Pullback", "Reversão", "Tendência", "Support/Resistance",
  "Fibonacci", "Candlestick Pattern", "Divergência", "Scalping", "Swing"
];

const emocaoOptions = [
  { value: "confiante", label: "● Confiante", icon: "●" },
  { value: "ansioso", label: "▲ Ansioso", icon: "▲" },
  { value: "impulsivo", label: "♦ Impulsivo", icon: "♦" },
  { value: "calmo", label: "◆ Calmo", icon: "◆" },
  { value: "eufórico", label: "★ Eufórico", icon: "★" },
  { value: "frustrado", label: "■ Frustrado", icon: "■" },
  { value: "neutro", label: "○ Neutro", icon: "○" }
];

export default function NovoTrade() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBroker, setSelectedBroker] = useState<string>("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvName, setCsvName] = useState<string>("");
  const [csvDescription, setCsvDescription] = useState<string>("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [currentTradeData, setCurrentTradeData] = useState<any>(null);
  
  // Take/Stop calculation state
  const [tradeResult, setTradeResult] = useState<"take" | "loss" | "">("");
  const [riskRewardRatio, setRiskRewardRatio] = useState<number | null>(null);
  const [finalResult, setFinalResult] = useState<number | null>(null);

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

  // Calculate Risk/Reward Ratio and Final Result based on form values
  const calculateRiskReward = () => {
    const takeValue = form.watch("alvo");
    const stopValue = form.watch("stop");
    
    const takeNum = parseFloat(takeValue || "0");
    const stopNum = parseFloat(stopValue || "0");
    
    if (takeNum > 0 && stopNum > 0) {
      const rrr = takeNum / stopNum;
      setRiskRewardRatio(rrr);
      
      if (tradeResult === "take") {
        setFinalResult(takeNum);
      } else if (tradeResult === "loss") {
        setFinalResult(-stopNum);
      } else {
        setFinalResult(null);
      }
    } else {
      setRiskRewardRatio(null);
      setFinalResult(null);
    }
  };

  // Auto-calculate when values change
  useEffect(() => {
    calculateRiskReward();
  }, [form.watch("alvo"), form.watch("stop"), tradeResult]);

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
    mutationFn: ({ file, broker, name, description }: { file: File; broker: string; name: string; description: string }) => {
      const userId = localStorage.getItem('user-id');
      if (!userId) {
        throw new Error("Usuário não autenticado");
      }
      
      const formData = new FormData();
      formData.append('csvFile', file);
      formData.append('broker', broker);
      formData.append('csvName', name || file.name);
      formData.append('csvDescription', description || 'Importação sem descrição');
      
      return fetch('/api/trades/upload-csv', {
        method: 'POST',
        body: formData,
        headers: {
          'x-user-id': userId
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
      setCsvName("");
      setCsvDescription("");
      
      toast({
        title: "Importação concluída",
        description: `${data.tradesImported} trades importados com sucesso.\n📊 Método: ${data.methodUsed || data.processingMethod || 'Não especificado'}`
      });
    },
    onError: (error: any) => {
      console.log("CSV Upload Error:", error);
      
      // Detectar erro de validação de datas
      if (error.message?.includes("não contém datas de trades válidas") || 
          error.details?.reason === "MISSING_VALID_DATES") {
        
        const errorDetails = error.details || {};
        let description = "❌ Arquivo CSV rejeitado:\n\n";
        
        if (!errorDetails.dateColumn) {
          description += "📅 Nenhuma coluna de data encontrada.\n\n";
          description += "Colunas obrigatórias aceitas:\n";
          description += "• Data, Data/Hora, Date, Trade Date\n\n";
          description += "💡 Solução: Renomeie uma coluna para 'Data' e tente novamente.";
        } else {
          description += `📅 Coluna "${errorDetails.dateColumn}" encontrada, mas sem datas válidas.\n\n`;
          description += "📊 Formatos aceitos:\n";
          description += "• dd/MM/yyyy (25/12/2024)\n";
          description += "• dd/MM/yyyy HH:mm (25/12/2024 14:30)\n";
          description += "• yyyy-MM-dd (2024-12-25)\n";
          description += "• dd-MM-yyyy (25-12-2024)\n\n";
          
          if (errorDetails.sampleDates?.length > 0) {
            description += `🔍 Exemplos encontrados:\n`;
            description += errorDetails.sampleDates.slice(0, 3).map((date: string) => `• "${date}"`).join('\n');
            description += "\n\n";
          }
          
          description += "💡 Verifique o formato das datas e tente novamente.";
        }
        
        toast({
          title: "Validação de Datas Falhada",
          description,
          variant: "destructive",
          duration: 8000 // Mais tempo para ler
        });
        
      } else {
        // Outros tipos de erro
        toast({
          title: "Erro na importação",
          description: error.message || "Erro ao importar arquivo CSV",
          variant: "destructive"
        });
      }
    }
  });

  const onSubmit = (data: InsertTrade) => {
    // Calculate result based on take/stop and trade result selection
    let calculatedResult = data.resultado;
    
    if (data.alvo && data.stop && tradeResult) {
      const takeNum = parseFloat(data.alvo);
      const stopNum = parseFloat(data.stop);
      
      if (tradeResult === "take") {
        calculatedResult = takeNum.toString();
      } else if (tradeResult === "loss") {
        calculatedResult = (-stopNum).toString();
      }
      
      // Add RRR info to comment
      if (takeNum > 0 && stopNum > 0) {
        const rrr = (takeNum / stopNum).toFixed(2);
        const rrrInfo = `RRR: 1:${rrr} | Resultado: ${tradeResult === "take" ? "◉ Take" : "○ Loss"}`;
        data.comentario = data.comentario ? `${data.comentario}\n\n${rrrInfo}` : rrrInfo;
      }
    }

    // Ensure required backend fields have values
    const processedData = {
      ...data,
      resultado: calculatedResult,
      capitalUtilizado: data.capitalUtilizado || "1", // Backend requires this
      quantidade: data.quantidade || "1", // Backend requires this
      precoEntrada: data.precoEntrada || "0", // Backend compatibility
      precoSaida: data.precoSaida || "0", // Backend compatibility
      risco: data.risco || "0", // Backend compatibility
    };
    
    createTradeMutation.mutate(processedData);
    
    // Reset result selection after submit
    setTradeResult("");
    setRiskRewardRatio(null);
    setFinalResult(null);
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
    
    uploadMutation.mutate({ 
      file: csvFile, 
      broker: selectedBroker,
      name: csvName,
      description: csvDescription
    });
  };

  return (
    <div className="space-y-4 lg:space-y-6 p-4 lg:p-6 pb-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Novo Trade</h1>
        <p className="text-charcoal-400 mt-2 text-sm lg:text-base">Registre os detalhes da sua operação ou importe via CSV</p>
      </div>
      <Tabs defaultValue="manual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual</TabsTrigger>
          <TabsTrigger value="csv">Importar CSV</TabsTrigger>
        </TabsList>

        <TabsContent value="manual">
          <Card className="bg-graphite/50 border-charcoal-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-neutral-400" />
                Dados da Operação
              </CardTitle>
            </CardHeader>
            <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Linha 1 - Data/Hora, Ativo, Mercado */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
                <FormField
                  control={form.control}
                  name="dataHora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-charcoal-300">Data e Hora *</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          className="bg-charcoal-800 border-charcoal-600 text-white"
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
                      <FormLabel className="text-charcoal-300">Ativo *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: BTCUSDT, EURUSD, PETR4"
                          className="bg-charcoal-800 border-charcoal-600 text-white"
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
                      <FormLabel className="text-charcoal-300">Mercado *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-charcoal-800 border-charcoal-600 text-white">
                            <SelectValue placeholder="Selecione o mercado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-charcoal-800 border-charcoal-600">
                          <SelectItem value="crypto">₿ Crypto</SelectItem>
                          <SelectItem value="forex">$ Forex</SelectItem>
                          <SelectItem value="b3">▲ B3</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Linha 2 - Setup, Tipo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                <FormField
                  control={form.control}
                  name="setup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-charcoal-300">Setup *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-charcoal-800 border-charcoal-600 text-white">
                            <SelectValue placeholder="Selecione o setup" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-charcoal-800 border-charcoal-600">
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
                      <FormLabel className="text-charcoal-300">Tipo *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-charcoal-800 border-charcoal-600 text-white">
                            <SelectValue placeholder="Compra ou Venda" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-charcoal-800 border-charcoal-600">
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

              {/* Linha 3 - Take/Stop com Resultado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="alvo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-charcoal-300">Take Profit (valor de ganho) *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-charcoal-400" />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="1000.00"
                            className="bg-charcoal-800 border-charcoal-600 text-white pl-10"
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
                      <FormLabel className="text-charcoal-300">Stop Loss (valor de perda) *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-charcoal-400" />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="200.00"
                            className="bg-charcoal-800 border-charcoal-600 text-white pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Resultado da Operação e Cálculos */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-3 text-charcoal-300">Resultado da Operação *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={tradeResult === "take" ? "default" : "outline"}
                      onClick={() => setTradeResult("take")}
                      className={`${
                        tradeResult === "take" 
                          ? "bg-green-600 hover:bg-green-700 text-white" 
                          : "border-charcoal-600 text-charcoal-300 hover:bg-green-600/20"
                      }`}
                    >
                      ◉ Take
                    </Button>
                    <Button
                      type="button"
                      variant={tradeResult === "loss" ? "default" : "outline"}
                      onClick={() => setTradeResult("loss")}
                      className={`${
                        tradeResult === "loss" 
                          ? "bg-red-600 hover:bg-red-700 text-white" 
                          : "border-charcoal-600 text-charcoal-300 hover:bg-red-600/20"
                      }`}
                    >
                      ○ Loss
                    </Button>
                  </div>
                </div>

                {/* Calculations Display */}
                {(riskRewardRatio || finalResult !== null) && (
                  <div className="bg-charcoal-800/50 p-4 rounded-lg border border-charcoal-600">
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-neutral-400" />
                      Cálculos Automáticos
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-charcoal-300 text-sm mb-1">Razão Risco/Retorno</div>
                        <div className="text-neutral-400 font-semibold text-lg">
                          {riskRewardRatio ? `1:${riskRewardRatio.toFixed(2)}` : "--"}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-charcoal-300 text-sm mb-1">Resultado Financeiro</div>
                        <div className={`font-semibold text-lg ${
                          finalResult === null ? 'text-charcoal-400' :
                          finalResult >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {finalResult === null ? "--" : 
                           finalResult >= 0 ? `+R$ ${finalResult.toFixed(2)}` : `R$ ${finalResult.toFixed(2)}`}
                        </div>
                      </div>
                    </div>

                    {riskRewardRatio && (
                      <div className="mt-3 p-2 bg-charcoal-700/50 rounded text-center">
                        <div className={`text-sm font-medium ${
                          riskRewardRatio >= 3 ? 'text-green-400' :
                          riskRewardRatio >= 2 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {riskRewardRatio >= 3 ? "● Excelente (≥3:1)" :
                           riskRewardRatio >= 2 ? "▲ Bom (≥2:1)" : "■ Arriscado (<2:1)"}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Linha 5 - Emoção */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emocao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-charcoal-300">Emoção Percebida</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-charcoal-800 border-charcoal-600 text-white">
                            <SelectValue placeholder="Como você se sentiu?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-charcoal-800 border-charcoal-600">
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
                    <FormLabel className="text-charcoal-300">Comentário sobre o Trade</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva seu raciocínio, observações sobre o mercado, lições aprendidas..."
                        className="bg-charcoal-800 border-charcoal-600 text-white min-h-[100px]"
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
                  className="border-charcoal-600 text-charcoal-300 hover:bg-charcoal-800"
                >
                  Limpar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const formData = form.getValues();
                    if (formData.ativo && formData.mercado && formData.setup && formData.tipo) {
                      setCurrentTradeData({
                        ativo: formData.ativo,
                        mercado: formData.mercado,
                        setup: formData.setup,
                        tipo: formData.tipo,
                        alvo: parseFloat(formData.alvo || "0"),
                        stop: parseFloat(formData.stop || "0"),
                        emocao: formData.emocao,
                        comentario: formData.comentario
                      });
                      setShowAIAnalysis(true);
                    } else {
                      toast({
                        title: "Campos obrigatórios",
                        description: "Preencha pelo menos: Ativo, Mercado, Setup e Tipo para análise.",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="border-purple-600 text-purple-300 hover:bg-purple-900/20"
                >
                  🤖 Analisar com IA
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
          </Card>
          
          {/* AI Analysis Component */}
          {showAIAnalysis && currentTradeData && (
            <div className="mt-6">
              <AITradeAnalysis 
                tradeData={currentTradeData}
                onAnalysisComplete={(analysis) => {
                  console.log('Análise concluída:', analysis);
                }}
              />
            </div>
          )}
        </TabsContent>



        <TabsContent value="csv">
          <Card className="bg-graphite/50 border-charcoal-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="h-5 w-5 text-neutral-400" />
                Importar Trades via CSV
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-charcoal-300">Selecione o Mercado</label>
                  <Select value={selectedBroker} onValueChange={setSelectedBroker}>
                    <SelectTrigger className="bg-charcoal-800 border-charcoal-600 text-white">
                      <SelectValue placeholder="Crypto, B3 ou Forex" />
                    </SelectTrigger>
                    <SelectContent className="bg-charcoal-800 border-charcoal-600">
                      <SelectItem value="crypto">🪙 Crypto</SelectItem>
                      <SelectItem value="b3">📈 B3</SelectItem>
                      <SelectItem value="forex">🏦 Forex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-charcoal-300">Arquivo CSV</label>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="bg-charcoal-800 border-charcoal-600 text-white file:bg-charcoal-700 file:text-white file:border-0 file:rounded-md file:px-4 file:py-2 file:mr-4"
                  />
                  <p className="text-sm text-charcoal-400 mt-2">
                    Selecione um arquivo CSV exportado do seu mercado
                  </p>
                </div>

                <div className="bg-charcoal-800/50 p-4 rounded-lg border border-charcoal-600">
                  <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-neutral-400" />
                    Formato do CSV por Mercado
                  </h4>
                  <div className="space-y-2 text-sm text-charcoal-400">
                    <p><strong className="text-white">Forex:</strong> Data, Ativo, Tipo, Volume, Preço Entrada, Stop Loss, Take Profit, Resultado</p>
                    <p><strong className="text-white">B3:</strong> Data, Código, Operação, Quantidade, Preço, Total, Resultado</p>
                    <p><strong className="text-white">Crypto:</strong> Time, Symbol, Side, Amount, Price, Fee, Total, PnL</p>
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
                  <div className="bg-charcoal-800/50 p-3 rounded-lg border border-charcoal-600">
                    <p className="text-sm text-charcoal-300">
                      <strong>Arquivo selecionado:</strong> {csvFile.name}
                    </p>
                    <p className="text-xs text-charcoal-400 mt-1">
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