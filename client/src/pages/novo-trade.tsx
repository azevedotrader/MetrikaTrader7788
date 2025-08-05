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
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [currentTradeData, setCurrentTradeData] = useState<any>(null);
  
  // Take/Stop form state
  const [takeValue, setTakeValue] = useState("");
  const [stopValue, setStopValue] = useState("");
  const [tradeResult, setTradeResult] = useState<"take" | "loss" | "">("");
  const [riskRewardRatio, setRiskRewardRatio] = useState<number | null>(null);
  const [finalResult, setFinalResult] = useState<number | null>(null);

  // Calculate Risk/Reward Ratio and Final Result
  const calculateRiskReward = (take: string, stop: string, result: "take" | "loss" | "") => {
    const takeNum = parseFloat(take);
    const stopNum = parseFloat(stop);
    
    if (takeNum > 0 && stopNum > 0) {
      const rrr = takeNum / stopNum;
      setRiskRewardRatio(rrr);
      
      if (result === "take") {
        setFinalResult(takeNum);
      } else if (result === "loss") {
        setFinalResult(-stopNum);
      } else {
        setFinalResult(null);
      }
    } else {
      setRiskRewardRatio(null);
      setFinalResult(null);
    }
  };

  // Handle Take/Stop form submission
  const handleTakeStopSubmit = () => {
    if (!takeValue || !stopValue || !tradeResult) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha Take, Stop e selecione o resultado",
        variant: "destructive"
      });
      return;
    }

    const resultValue = tradeResult === "take" ? takeValue : `-${stopValue}`;
    
    // Create trade with calculated values
    const tradeData: InsertTrade = {
      dataHora: new Date().toISOString().slice(0, 16),
      ativo: "TAKE/STOP",
      mercado: "crypto",
      setup: "Take/Stop",
      capitalUtilizado: "1",
      quantidade: "1",
      tipo: "compra",
      stop: stopValue,
      alvo: takeValue,
      resultado: resultValue,
      risco: "0",
      comentario: `RRR: 1:${riskRewardRatio?.toFixed(2)} | Resultado: ${tradeResult === "take" ? "✅ Take" : "❌ Loss"}`,
      emocao: "neutro",
      precoEntrada: "0",
      precoSaida: "0",
      corretora: "crypto",
      status: "fechado"
    };

    createTradeMutation.mutate(tradeData);
    
    // Reset form
    setTakeValue("");
    setStopValue("");
    setTradeResult("");
    setRiskRewardRatio(null);
    setFinalResult(null);
  };

  // Auto-calculate when values change
  useEffect(() => {
    calculateRiskReward(takeValue, stopValue, tradeResult);
  }, [takeValue, stopValue, tradeResult]);

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manual">Manual</TabsTrigger>
          <TabsTrigger value="take-stop">Take/Stop</TabsTrigger>
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
                      <FormLabel className="text-slate-300">Take Profit (valor de ganho)</FormLabel>
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

        <TabsContent value="take-stop">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-400" />
                🎯 Gestão Take/Stop
              </CardTitle>
              <CardDescription className="text-slate-400">
                Calcule automaticamente sua razão risco/retorno e registre o resultado da operação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inputs Take/Stop */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Take Profit (Valor de Ganho) *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="1000.00"
                        value={takeValue}
                        onChange={(e) => setTakeValue(e.target.value)}
                        className="bg-slate-800 border-slate-600 text-white pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Stop Loss (Valor de Perda) *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="200.00"
                        value={stopValue}
                        onChange={(e) => setStopValue(e.target.value)}
                        className="bg-slate-800 border-slate-600 text-white pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Resultado da Operação *</label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={tradeResult === "take" ? "default" : "outline"}
                        onClick={() => setTradeResult("take")}
                        className={`${
                          tradeResult === "take" 
                            ? "bg-green-600 hover:bg-green-700 text-white" 
                            : "border-slate-600 text-slate-300 hover:bg-green-600/20"
                        }`}
                      >
                        ✅ Take
                      </Button>
                      <Button
                        type="button"
                        variant={tradeResult === "loss" ? "default" : "outline"}
                        onClick={() => setTradeResult("loss")}
                        className={`${
                          tradeResult === "loss" 
                            ? "bg-red-600 hover:bg-red-700 text-white" 
                            : "border-slate-600 text-slate-300 hover:bg-red-600/20"
                        }`}
                      >
                        ❌ Loss
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Calculations Display */}
                <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-600">
                  <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-purple-400" />
                    Cálculos Automáticos
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Razão Risco/Retorno:</span>
                      <span className="text-purple-400 font-semibold text-lg">
                        {riskRewardRatio ? `1:${riskRewardRatio.toFixed(2)}` : "--"}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Resultado Financeiro:</span>
                      <span className={`font-semibold text-lg ${
                        finalResult === null ? 'text-slate-400' :
                        finalResult >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {finalResult === null ? "--" : 
                         finalResult >= 0 ? `+R$ ${finalResult.toFixed(2)}` : `R$ ${finalResult.toFixed(2)}`}
                      </span>
                    </div>

                    {riskRewardRatio && (
                      <div className="mt-4 p-3 bg-slate-700/50 rounded border">
                        <div className="text-xs text-slate-400 mb-1">Análise RRR:</div>
                        <div className={`text-sm font-medium ${
                          riskRewardRatio >= 3 ? 'text-green-400' :
                          riskRewardRatio >= 2 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {riskRewardRatio >= 3 ? "🟢 Excelente (≥3:1)" :
                           riskRewardRatio >= 2 ? "🟡 Bom (≥2:1)" : "🔴 Arriscado (<2:1)"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleTakeStopSubmit}
                  disabled={createTradeMutation.isPending || !takeValue || !stopValue || !tradeResult}
                  className="gradient-purple-blue hover:opacity-90 transition-opacity"
                >
                  {createTradeMutation.isPending ? "Salvando..." : "💾 Registrar Take/Stop"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setTakeValue("");
                    setStopValue("");
                    setTradeResult("");
                    setRiskRewardRatio(null);
                    setFinalResult(null);
                  }}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  🔄 Limpar
                </Button>
              </div>

              <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-600">
                <h5 className="text-white font-medium mb-2">💡 Como usar:</h5>
                <div className="text-sm text-slate-400 space-y-1">
                  <p>1. Insira o valor do <strong>Take Profit</strong> (quanto você ganharia)</p>
                  <p>2. Insira o valor do <strong>Stop Loss</strong> (quanto você perderia)</p>
                  <p>3. Selecione se a operação foi <strong>✅ Take</strong> ou <strong>❌ Loss</strong></p>
                  <p>4. O sistema calcula automaticamente a RRR e o resultado financeiro</p>
                </div>
              </div>
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
                  <label className="block text-sm font-medium mb-2 text-slate-300">Selecione o Mercado</label>
                  <Select value={selectedBroker} onValueChange={setSelectedBroker}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue placeholder="Crypto, B3 ou Forex" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="crypto">🪙 Crypto</SelectItem>
                      <SelectItem value="b3">📈 B3</SelectItem>
                      <SelectItem value="forex">🏦 Forex</SelectItem>
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
                    Selecione um arquivo CSV exportado do seu mercado
                  </p>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
                  <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    Formato do CSV por Mercado
                  </h4>
                  <div className="space-y-2 text-sm text-slate-400">
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