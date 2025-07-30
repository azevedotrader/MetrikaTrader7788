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
import { CalendarIcon, DollarSign, Target, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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

  const form = useForm<InsertTrade>({
    resolver: zodResolver(insertTradeSchema),
    defaultValues: {
      dataHora: new Date().toISOString().slice(0, 16),
      ativo: "",
      mercado: "crypto",
      setup: "",
      capitalUtilizado: "",
      quantidade: "",
      tipo: "compra",
      stop: "",
      alvo: "",
      resultado: "",
      risco: "",
      comentario: "",
      emocao: "neutro",
      precoEntrada: "",
      precoSaida: "",
      corretora: "",
      status: "fechado"
    },
  });

  const createTradeMutation = useMutation({
    mutationFn: async (data: InsertTrade) => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch("/api/trades", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          "user-id": user.id || '',
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

  const onSubmit = (data: InsertTrade) => {
    createTradeMutation.mutate(data);
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Novo Trade</h1>
        <p className="text-slate-400 mt-2">Registre os detalhes da sua operação</p>
      </div>

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

              {/* Linha 2 - Setup, Tipo, Corretora */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <FormField
                  control={form.control}
                  name="corretora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Corretora</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                            <SelectValue placeholder="Selecione a corretora" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          <SelectItem value="tickmill">Tickmill (Forex)</SelectItem>
                          <SelectItem value="clear">Clear (B3)</SelectItem>
                          <SelectItem value="gate.io">Gate.io (Crypto)</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Linha 3 - Valores monetários */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="capitalUtilizado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Capital Utilizado *</FormLabel>
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
                  name="quantidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Quantidade *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.0001"
                          placeholder="0.0000"
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
                  name="stop"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Stop Loss</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.0001"
                          placeholder="0.0000"
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
                  name="alvo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Take Profit</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.0001"
                          placeholder="0.0000"
                          className="bg-slate-800 border-slate-600 text-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Linha 4 - Preços e Resultado */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="precoEntrada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Preço Entrada</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.0001"
                          placeholder="0.0000"
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
                  name="precoSaida"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Preço Saída</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.0001"
                          placeholder="0.0000"
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
                  name="risco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Risco (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="2.00"
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
                  name="resultado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Resultado</FormLabel>
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
    </div>
  );
}