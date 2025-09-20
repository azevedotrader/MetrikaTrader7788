import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertTradeSchema, type InsertTrade } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarIcon,
  DollarSign,
  Target,
  TrendingUp,
  TrendingDown,
  Calculator,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";

export default function NovoTrade() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  // Setup options with translations
  const setupOptions = [
    t('setup.breakout'),
    t('setup.pullback'),
    t('setup.reversao'),
    t('setup.tendencia'),
    t('setup.support_resistance'),
    t('setup.fibonacci'),
    t('setup.candlestick'),
    t('setup.divergencia'),
    t('setup.scalping'),
    t('setup.swing'),
    t('setup.outros'),
  ];

  // Emoção options with translations
  const emocaoOptions = [
    { value: "confiante", label: t('emotions.confident') },
    { value: "ansioso", label: t('emotions.anxious') },
    { value: "medo", label: t('emotions.fear') },
    { value: "ganancioso", label: t('emotions.greedy') },
    { value: "calmo", label: t('emotions.calm') },
    { value: "empolgado", label: t('emotions.excited') },
    { value: "frustrado", label: t('emotions.frustrated') },
    { value: "neutro", label: t('emotions.neutral') },
  ];

  // State para resultado do trade e cálculos
  const [tradeResult, setTradeResult] = useState<"take" | "loss" | null>(null);
  const [riskRewardRatio, setRiskRewardRatio] = useState<number | null>(null);
  const [finalResult, setFinalResult] = useState<number | null>(null);

  const form = useForm<InsertTrade>({
    resolver: zodResolver(insertTradeSchema),
    defaultValues: {
      dataHora: new Date().toISOString().slice(0, 16),
      ativo: "",
      tipo: "compra",
      resultado: "",
      alvo: "",
      stop: "",
      setup: setupOptions[0] || "",
      emocao: "",
      comentario: "",
      mercado: "crypto",
      corretora: "crypto",
    },
  });

  // Watch values for calculations
  const alvoValue = form.watch("alvo");
  const stopValue = form.watch("stop");

  // Calcular Risk/Reward e resultado final
  useEffect(() => {
    const alvo = parseFloat(alvoValue || "0");
    const stop = parseFloat(stopValue || "0");

    if (alvo > 0 && stop > 0) {
      const ratio = alvo / stop;
      setRiskRewardRatio(ratio);

      // Calcular resultado baseado na seleção
      if (tradeResult === "take") {
        setFinalResult(alvo);
        form.setValue("resultado", alvo.toString());
      } else if (tradeResult === "loss") {
        setFinalResult(-stop);
        form.setValue("resultado", (-stop).toString());
      }
    } else {
      setRiskRewardRatio(null);
      setFinalResult(null);
    }
  }, [alvoValue, stopValue, tradeResult, form]);

  const createTradeMutation = useMutation({
    mutationFn: (data: InsertTrade) => apiRequest("POST", "/api/trades", data),
    onSuccess: () => {
      toast({
        title: t('form.trade_saved'),
        description: t('form.trade_saved_desc'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades/by-broker"] });
      form.reset();
      setTradeResult(null);
      setRiskRewardRatio(null);
      setFinalResult(null);
    },
    onError: (error: any) => {
      toast({
        title: t('form.error_saving'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertTrade) => {
    if (!tradeResult) {
      toast({
        title: t('form.select_result'),
        description: t('form.select_result_desc'),
        variant: "destructive",
      });
      return;
    }

    // Ensure resultado is set correctly
    data.resultado = finalResult?.toString() || "0";

    createTradeMutation.mutate(data);
  };

  return (
    <div className="space-y-4 lg:space-y-6 p-4 lg:p-6 pb-8">
      <Card className="bg-graphite/50 border-charcoal-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-neutral-400" />
            {t('form.trade_data')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              data-testid="trade-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {/* Linha 1 - Data/Hora, Ativo, Mercado */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
                <FormField
                  control={form.control}
                  name="dataHora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-charcoal-300">
                        {t('form.date_time')} *
                      </FormLabel>
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
                      <FormLabel className="text-charcoal-300">
                        {t('form.asset')} *
                      </FormLabel>
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
                      <FormLabel className="text-charcoal-300">
                        {t('form.market')} *
                      </FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Atualizar corretora automaticamente quando o mercado mudar
                          form.setValue("corretora", value as "crypto" | "forex" | "b3" | "auto");
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-charcoal-800 border-charcoal-600 text-white">
                            <SelectValue placeholder={t('form.select_market')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-charcoal-800 border-charcoal-600">
                          <SelectItem value="crypto">{t('form.crypto')}</SelectItem>
                          <SelectItem value="forex">{t('form.forex')}</SelectItem>
                          <SelectItem value="b3">{t('form.b3')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Linha 2 - Tipo e Emoção */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-charcoal-300">
                        {t('form.type')} *
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-charcoal-800 border-charcoal-600 text-white">
                            <SelectValue placeholder={t('form.buy_or_sell')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-charcoal-800 border-charcoal-600">
                          <SelectItem value="compra">
                            <span className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              {t('form.buy')}
                            </span>
                          </SelectItem>
                          <SelectItem value="venda">
                            <span className="flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-red-400" />
                              {t('form.sell')}
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
                  name="emocao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-charcoal-300">
                        {t('form.emotion')}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-charcoal-800 border-charcoal-600 text-white">
                            <SelectValue placeholder={t('form.how_felt')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-charcoal-800 border-charcoal-600">
                          {emocaoOptions.map((emocao) => (
                            <SelectItem
                              key={emocao.value}
                              value={emocao.value}
                            >
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

              {/* Linha 3 - Take/Stop com Resultado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="alvo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-charcoal-300">
                        {t('form.take_profit')} *
                      </FormLabel>
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
                      <FormLabel className="text-charcoal-300">
                        {t('form.stop_loss')} *
                      </FormLabel>
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
                  <label className="block text-sm font-medium mb-3 text-charcoal-300">
                    {t('form.trade_result')} *
                  </label>
                  {!tradeResult && (
                    <p className="text-xs text-red-400 mb-2">
                      {t('form.select_result_warning')}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={
                        tradeResult === "take" ? "default" : "outline"
                      }
                      onClick={() => setTradeResult("take")}
                      className={`${
                        tradeResult === "take"
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "border-charcoal-600 text-charcoal-300 hover:bg-green-600/20"
                      }`}
                    >
                      {t('form.take')}
                    </Button>
                    <Button
                      type="button"
                      variant={
                        tradeResult === "loss" ? "default" : "outline"
                      }
                      onClick={() => setTradeResult("loss")}
                      className={`${
                        tradeResult === "loss"
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "border-charcoal-600 text-charcoal-300 hover:bg-red-600/20"
                      }`}
                    >
                      {t('form.loss')}
                    </Button>
                  </div>
                </div>

                {/* Calculations Display */}
                {(riskRewardRatio || finalResult !== null) && (
                  <div className="bg-charcoal-800/50 p-4 rounded-lg border border-charcoal-600">
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-neutral-400" />
                      {t('form.auto_calculations')}
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-charcoal-300 text-sm mb-1">
                          {t('form.risk_reward_ratio')}
                        </div>
                        <div className="text-neutral-400 font-semibold text-lg">
                          {riskRewardRatio
                            ? `1:${riskRewardRatio.toFixed(2)}`
                            : "--"}
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-charcoal-300 text-sm mb-1">
                          {t('form.financial_result')}
                        </div>
                        <div
                          className={`font-semibold text-lg ${
                            finalResult === null
                              ? "text-charcoal-400"
                              : finalResult >= 0
                                ? "text-green-600"
                                : "text-red-400"
                          }`}
                        >
                          {finalResult === null
                            ? "--"
                            : finalResult >= 0
                              ? `+R$ ${finalResult.toFixed(2)}`
                              : `R$ ${finalResult.toFixed(2)}`}
                        </div>
                      </div>
                    </div>

                    {riskRewardRatio && (
                      <div className="mt-3 p-2 bg-charcoal-700/50 rounded text-center">
                        <div
                          className={`text-sm font-medium ${
                            riskRewardRatio >= 3
                              ? "text-green-600"
                              : riskRewardRatio >= 2
                                ? "text-yellow-400"
                                : "text-red-400"
                          }`}
                        >
                          {riskRewardRatio >= 3
                            ? t('form.excellent_ratio')
                            : riskRewardRatio >= 2
                              ? t('form.good_ratio')
                              : t('form.risky_ratio')}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Comentário */}
              <FormField
                control={form.control}
                name="comentario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-charcoal-300">
                      {t('form.trade_comment')}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('form.comment_placeholder')}
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
                  {createTradeMutation.isPending
                    ? t('form.saving')
                    : t('form.save_trade')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  className="border-charcoal-600 text-charcoal-300 hover:bg-charcoal-800"
                >
                  {t('form.clear')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}