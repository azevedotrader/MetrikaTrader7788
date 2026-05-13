import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { insertTradeSchema, type InsertTrade, type Trade } from "@shared/schema";
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
  Crown,
  Lock,
  Wallet,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserPlan } from "@/hooks/useUserPlan";
import { VipUpgradeModal } from "@/components/modals/vip-upgrade-modal";
import { useState, useEffect } from "react";
import type { Wallet as WalletType } from "@shared/schema";

export default function NovoTrade() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { planType, isLoading: planLoading } = useUserPlan();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const isFreePlan = planType === 'free';
  
  const { data: existingTrades } = useQuery<Trade[]>({
    queryKey: ['/api/trades'],
    enabled: isFreePlan,
  });

  // Fetch user's custom wallets
  const { data: wallets = [] } = useQuery<WalletType[]>({
    queryKey: ['/api/wallets'],
  });

  // State para carteira selecionada
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);

  // ── Entrada Rápida ──────────────────────────────────────────
  const [quickText, setQuickText] = useState('');
  const [quickParsed, setQuickParsed] = useState<Array<{ativo:string,resultado:string,risco:string,hora:string,raw:string}>>([]);

  function parseQuickTrade(line: string) {
    const l = line.trim().toUpperCase();
    if (!l) return null;

    // ativo: primeira palavra não numérica
    const ativoMatch = l.match(/^([A-Z]{3,8}(?:USD|BTC|EUR|GBP|JPY|BRL|USDT)?)/);
    const ativo = ativoMatch ? ativoMatch[1] : '';

    // resultado: take ou loss
    const resultado = /\bTAKE\b/.test(l) ? 'take' : /\bLOSS\b|\bSTOP\b/.test(l) ? 'loss' : '';

    // risco: número seguido de X ou R (ex: 3x, 2.5R, 1.5x)
    const riscoMatch = l.match(/(\d+(?:[.,]\d+)?)\s*[XR]\b/);
    const risco = riscoMatch ? riscoMatch[1].replace(',','.') : '';

    // hora: padrão HH:MM ou HHhMM ou HHhMM
    const horaMatch = l.match(/(\d{1,2})[Hh:](\d{2})/);
    const hora = horaMatch ? `${horaMatch[1].padStart(2,'0')}:${horaMatch[2]}` : '';

    return { ativo, resultado, risco, hora, raw: line.trim() };
  }

  function handleQuickParse() {
    const lines = quickText.split('\n').filter(l => l.trim());
    const parsed = lines.map(parseQuickTrade).filter(Boolean) as Array<{ativo:string,resultado:string,risco:string,hora:string,raw:string}>;
    setQuickParsed(parsed);
  }

  function applyQuickTrade(p: {ativo:string,resultado:string,risco:string,hora:string}) {
    if (p.ativo) form.setValue('ativo', p.ativo);
    if (p.hora) {
      const today = new Date().toISOString().slice(0,10);
      form.setValue('dataHora', `${today}T${p.hora}`);
    }
    if (p.resultado === 'take') { setTradeResult('take'); }
    if (p.resultado === 'loss') { setTradeResult('loss'); }
    if (p.risco) form.setValue('alvo', p.risco);
    setQuickText('');
    setQuickParsed([]);
  }
  
  const hasReachedFreeLimit = isFreePlan && (existingTrades?.length || 0) >= 1;

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
    { value: "eufórico", label: t('emotions.excited') },
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
      emocao: undefined,
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
      setSelectedWalletId(null);
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
    if (hasReachedFreeLimit) {
      setShowUpgradeModal(true);
      return;
    }
    
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
    
    // Include walletId if a custom wallet is selected
    const tradeData = {
      ...data,
      walletId: selectedWalletId || undefined,
    };

    createTradeMutation.mutate(tradeData);
  };

  if (hasReachedFreeLimit) {
    return (
      <div className="space-y-4 lg:space-y-6 p-4 lg:p-6 pb-8">
        <Card className="bg-graphite/50 border-charcoal-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center p-6 max-w-md">
              <div className="w-16 h-16 bg-gradient-to-br from-[#6EE000] to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Limite Atingido</h3>
              <p className="text-zinc-400 mb-4">
                Você já registrou 1 trade no plano Free. 
                Faça upgrade para VIP e registre trades ilimitados!
              </p>
              <Button 
                onClick={() => setShowUpgradeModal(true)}
                className="bg-gradient-to-r from-[#6EE000] to-yellow-500 hover:from-[#6EE000] hover:to-yellow-600 text-white font-bold"
                data-testid="button-upgrade-trades"
              >
                <Crown className="w-4 h-4 mr-2" />
                Desbloquear Trades Ilimitados
              </Button>
            </div>
          </div>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-neutral-400" />
              {t('form.trade_data')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 opacity-30 pointer-events-none">
            <div className="h-48 flex items-center justify-center text-zinc-500">
              Você atingiu o limite do plano Free
            </div>
          </CardContent>
        </Card>
        
        <VipUpgradeModal 
          open={showUpgradeModal} 
          onOpenChange={setShowUpgradeModal}
          feature="trades"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6 p-4 lg:p-6 pb-8">

      {/* ── Entrada Rápida ── */}
      <Card className="bg-graphite/50 border-charcoal-700 border-[#6EE000]/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <Zap className="h-5 w-5 text-[#6EE000]" />
            Entrada Rápida
            <span className="ml-auto text-xs font-normal text-zinc-500">opcional</span>
          </CardTitle>
          <CardDescription className="text-zinc-400 text-xs">
            Digite como quiser — o app reconhece e preenche o formulário. Ex: <span className="text-[#6EE000] font-mono">BTCUSD take 3x 7h48</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={quickText}
            onChange={e => { setQuickText(e.target.value); setQuickParsed([]); }}
            placeholder={"BTCUSD take 3x 7h48\nEURUSD loss 9h15\nGOLD take 2.5x 14h30"}
            className="w-full min-h-[90px] bg-[#0a0a0f] border border-zinc-700 rounded-lg p-3 text-sm text-white placeholder:text-zinc-600 font-mono resize-y focus:outline-none focus:border-[#6EE000] transition-colors"
          />
          <Button
            type="button"
            onClick={handleQuickParse}
            className="bg-[#6EE000] hover:bg-[#6EE000] text-black font-bold text-sm px-4 py-2 h-auto"
          >
            <Zap className="w-4 h-4 mr-2" />
            Reconhecer trades
          </Button>

          {quickParsed.length > 0 && (
            <div className="space-y-2 pt-1">
              {quickParsed.map((p, i) => (
                <div key={i} className="flex items-center justify-between bg-[#0a0a0f] border border-zinc-700 rounded-lg px-3 py-2 gap-3">
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <span className="font-bold text-white">{p.ativo || '?'}</span>
                    {p.resultado && <span className={`px-2 py-0.5 rounded text-xs font-bold ${p.resultado==='take'?'bg-[#6EE000]/20 text-[#6EE000]':'bg-[#FF1F3D]/20 text-[#FF1F3D]'}`}>{p.resultado==='take'?'Take':'Loss'}</span>}
                    {p.risco && <span className="text-zinc-400 text-xs">{p.risco}x risco</span>}
                    {p.hora && <span className="text-zinc-500 text-xs">{p.hora}</span>}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => applyQuickTrade(p)}
                    className="bg-[#6EE000]/20 hover:bg-[#6EE000] text-[#6EE000] hover:text-black border border-[#6EE000]/40 text-xs h-7 px-3 transition-all"
                  >
                    Aplicar
                  </Button>
                </div>
              ))}
              {quickParsed.length > 1 && (
                <p className="text-xs text-zinc-500 pt-1">💡 Clique em "Aplicar" em cada trade para preencher o formulário um a um.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
                          // Verificar se é uma carteira customizada
                          if (value.startsWith("wallet:")) {
                            const walletId = value.replace("wallet:", "");
                            const wallet = wallets.find(w => w.id === walletId);
                            if (wallet) {
                              setSelectedWalletId(walletId);
                              field.onChange(wallet.name);
                              form.setValue("corretora", wallet.name);
                            }
                          } else {
                            // Mercado padrão
                            setSelectedWalletId(null);
                            field.onChange(value);
                            form.setValue("corretora", value as "crypto" | "forex" | "b3" | "auto");
                          }
                        }}
                        value={selectedWalletId ? `wallet:${selectedWalletId}` : field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-charcoal-800 border-charcoal-600 text-white">
                            <SelectValue placeholder={t('form.select_market')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-charcoal-800 border-charcoal-600 max-h-72">
                          <SelectItem value="crypto">{t('form.crypto')}</SelectItem>
                          <SelectItem value="forex">{t('form.forex')}</SelectItem>
                          <SelectItem value="b3">{t('form.b3')}</SelectItem>
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
                              <TrendingUp className="h-4 w-4 text-[#6EE000]" />
                              {t('form.buy')}
                            </span>
                          </SelectItem>
                          <SelectItem value="venda">
                            <span className="flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-[#FF1F3D]" />
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
                    <p className="text-xs text-[#FF1F3D] mb-2">
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
                          ? "bg-[#6EE000] hover:bg-[#6EE000] text-white"
                          : "border-charcoal-600 text-charcoal-300 hover:bg-[#6EE000]/20"
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
                          ? "bg-[#FF1F3D] hover:bg-[#FF1F3D] text-white"
                          : "border-charcoal-600 text-charcoal-300 hover:bg-[#FF1F3D]/20"
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
                                ? "text-[#6EE000]"
                                : "text-[#FF1F3D]"
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
                              ? "text-[#6EE000]"
                              : riskRewardRatio >= 2
                                ? "text-yellow-500"
                                : "text-[#FF1F3D]"
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