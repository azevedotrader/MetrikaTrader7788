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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calculator,
  Wallet,
  Zap,
  ClipboardList,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import type { Wallet as WalletType } from "@shared/schema";

export default function NovoTrade() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
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
    { value: "calmo", label: t('emotions.calm') },
    { value: "neutro", label: t('emotions.neutral') },
    { value: "ansioso", label: t('emotions.anxious') },
    { value: "medo", label: t('emotions.fear') },
    { value: "impulsivo", label: "Impulsivo" },
    { value: "eufórico", label: t('emotions.excited') },
    { value: "frustrado", label: t('emotions.frustrated') },
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

  // ── Estado para o log de trades ──────────────────────────────────────────
  const { data: allTrades = [] } = useQuery<Trade[]>({
    queryKey: ['/api/trades'],
  });

  // ── Estado para edição de trade ──────────────────────────────────────────
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [editForm, setEditForm] = useState<Partial<Trade>>({});
  const [editTradeResult, setEditTradeResult] = useState<'take' | 'loss' | null>(null);

  const openEditDialog = (trade: Trade) => {
    setEditingTrade(trade);
    setEditForm({ ...trade });
    const r = parseFloat(String(trade.resultado));
    setEditTradeResult(r > 0 ? 'take' : r < 0 ? 'loss' : null);
  };

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

  const updateTradeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Trade> }) => {
      const res = await apiRequest("PUT", `/api/trades/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Trade atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades/by-broker"] });
      setEditingTrade(null);
      setEditForm({});
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });

  const deleteTradeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/trades/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Trade removido." });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades/by-broker"] });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    },
  });

  const handleSaveEdit = () => {
    if (!editingTrade) return;
    const alvo = parseFloat(String(editForm.alvo || 0));
    const stop = parseFloat(String(editForm.stop || 0));
    let resultado = parseFloat(String(editForm.resultado || 0));
    if (editTradeResult === 'take' && alvo > 0) resultado = alvo;
    if (editTradeResult === 'loss' && stop > 0) resultado = -stop;
    updateTradeMutation.mutate({
      id: editingTrade.id,
      data: { ...editForm, resultado: String(resultado) },
    });
  };

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
    
    // Include walletId if a custom wallet is selected
    const tradeData = {
      ...data,
      walletId: selectedWalletId || undefined,
    };

    createTradeMutation.mutate(tradeData);
  };

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
                        onValueChange={(v) => {
                          field.onChange(v);
                          form.setValue("corretora", v as any);
                        }}
                        value={field.value}
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

              {/* Linha 2b - Carteira */}
              {wallets.length > 0 && (
                <div>
                  <Label className="text-charcoal-300 text-sm font-medium flex items-center gap-1.5 mb-2">
                    <Wallet className="h-3.5 w-3.5 text-[var(--b)]" />
                    Carteira <span className="text-charcoal-400 font-normal">(opcional)</span>
                  </Label>
                  <Select
                    value={selectedWalletId ?? "__default"}
                    onValueChange={(v) => setSelectedWalletId(v === "__default" ? null : v)}
                  >
                    <SelectTrigger className="bg-charcoal-800 border-charcoal-600 text-white">
                      <SelectValue placeholder="Carteira padrão do mercado" />
                    </SelectTrigger>
                    <SelectContent className="bg-charcoal-800 border-charcoal-600">
                      <SelectItem value="__default">
                        <span className="text-charcoal-400">— Sem carteira específica —</span>
                      </SelectItem>
                      {wallets.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          <span className="flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: w.color || '#6EE000' }} />
                            {w.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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

      {/* ── Log de Trades ──────────────────────────────────────────────────── */}
      <Card className="bg-graphite/50 border-charcoal-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-[var(--text)] flex items-center gap-2 text-base">
            <ClipboardList className="h-5 w-5 text-[var(--b)]" />
            Log de Trades
            <Badge variant="outline" className="ml-auto text-xs border-[var(--brd)] text-[var(--dim)]">
              {allTrades.length} registros
            </Badge>
          </CardTitle>
          <CardDescription className="text-[var(--dim)] text-xs">
            Todos os seus trades registrados. Clique em Editar para corrigir dados ou mover para outra carteira.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {allTrades.length === 0 ? (
            <div className="text-center py-10 text-[var(--dim)] text-sm">
              Nenhum trade registrado ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--brd)] bg-[var(--surf)]/40">
                    <th className="text-left px-4 py-2.5 text-[var(--dim)] font-medium text-xs">DATA</th>
                    <th className="text-left px-4 py-2.5 text-[var(--dim)] font-medium text-xs">ATIVO</th>
                    <th className="text-left px-4 py-2.5 text-[var(--dim)] font-medium text-xs">TIPO</th>
                    <th className="text-right px-4 py-2.5 text-[var(--dim)] font-medium text-xs">RESULTADO</th>
                    <th className="text-left px-4 py-2.5 text-[var(--dim)] font-medium text-xs">MERCADO</th>
                    <th className="text-left px-4 py-2.5 text-[var(--dim)] font-medium text-xs hidden sm:table-cell">SETUP</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {[...allTrades].sort((a, b) => new Date(b.dataHora || b.createdAt || 0).getTime() - new Date(a.dataHora || a.createdAt || 0).getTime()).map((trade) => {
                    const pnl = parseFloat(String(trade.resultado || 0));
                    const isProfit = pnl > 0;
                    const isLoss = pnl < 0;
                    const walletName = wallets.find(w => w.id === trade.walletId)?.name;
                    const dateStr = trade.dataHora
                      ? new Date(trade.dataHora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
                      : '–';
                    return (
                      <tr key={trade.id} className="border-b border-[var(--brd)]/50 hover:bg-[var(--surf)]/40 transition-colors">
                        <td className="px-4 py-2.5 text-[var(--dim)] text-xs whitespace-nowrap">{dateStr}</td>
                        <td className="px-4 py-2.5 font-semibold text-[var(--text)] whitespace-nowrap">
                          {trade.ativo}
                          {walletName && (
                            <span className="ml-1.5 text-[10px] text-[var(--b)] font-normal">[{walletName}]</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            trade.tipo === 'compra' ? 'bg-[#6EE000]/15 text-[#6EE000]' : 'bg-[#FF1F3D]/15 text-[#FF1F3D]'
                          }`}>
                            {trade.tipo === 'compra' ? '▲ Long' : '▼ Short'}
                          </span>
                        </td>
                        <td className={`px-4 py-2.5 text-right font-bold tabular-nums whitespace-nowrap ${
                          isProfit ? 'text-[var(--gold)]' : isLoss ? 'text-[var(--r)]' : 'text-[var(--dim)]'
                        }`}>
                          {isProfit ? '+' : ''}{pnl === 0 ? '–' : `R$ ${pnl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </td>
                        <td className="px-4 py-2.5 text-[var(--dim)] text-xs capitalize">{trade.mercado || '–'}</td>
                        <td className="px-4 py-2.5 text-[var(--dim)] text-xs hidden sm:table-cell">{trade.setup || '–'}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditDialog(trade)}
                              className="h-7 w-7 p-0 text-[var(--dim)] hover:text-[var(--text)] hover:bg-[var(--surf)]"
                              title="Editar trade"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Remover trade ${trade.ativo}?`)) {
                                  deleteTradeMutation.mutate(trade.id);
                                }
                              }}
                              className="h-7 w-7 p-0 text-[var(--dim)] hover:text-[var(--r)] hover:bg-[var(--r)]/10"
                              title="Remover trade"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Modal de Edição de Trade ─────────────────────────────────────── */}
      <Dialog open={!!editingTrade} onOpenChange={(open) => { if (!open) { setEditingTrade(null); setEditForm({}); } }}>
        <DialogContent className="bg-[var(--card)] border-[var(--brd)] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[var(--text)] flex items-center gap-2">
              <Pencil className="w-4 h-4 text-[var(--b)]" />
              Editar Trade — <span className="text-[var(--gold)]">{editForm.ativo}</span>
            </DialogTitle>
          </DialogHeader>

          {editForm && (
            <div className="space-y-4 py-2">
              {/* Data / Ativo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[var(--dim)] text-xs mb-1.5 block">Data/Hora</Label>
                  <Input
                    type="datetime-local"
                    className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)]"
                    value={editForm.dataHora ? String(editForm.dataHora).slice(0, 16) : ''}
                    onChange={e => setEditForm(f => ({ ...f, dataHora: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-[var(--dim)] text-xs mb-1.5 block">Ativo</Label>
                  <Input
                    className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)]"
                    value={editForm.ativo || ''}
                    onChange={e => setEditForm(f => ({ ...f, ativo: e.target.value }))}
                  />
                </div>
              </div>

              {/* Tipo / Mercado */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[var(--dim)] text-xs mb-1.5 block">Tipo</Label>
                  <Select value={editForm.tipo || 'compra'} onValueChange={v => setEditForm(f => ({ ...f, tipo: v as any }))}>
                    <SelectTrigger className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--card)] border-[var(--brd)]">
                      <SelectItem value="compra">▲ Compra (Long)</SelectItem>
                      <SelectItem value="venda">▼ Venda (Short)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[var(--dim)] text-xs mb-1.5 block">Mercado</Label>
                  <Select value={editForm.mercado || 'crypto'} onValueChange={v => setEditForm(f => ({ ...f, mercado: v as any }))}>
                    <SelectTrigger className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--card)] border-[var(--brd)]">
                      <SelectItem value="crypto">Crypto</SelectItem>
                      <SelectItem value="forex">Forex</SelectItem>
                      <SelectItem value="b3">B3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Carteira */}
              <div>
                <Label className="text-[var(--dim)] text-xs mb-1.5 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-[var(--b)]" /> Carteira
                </Label>
                <Select
                  value={editForm.walletId ?? "__none"}
                  onValueChange={v => setEditForm(f => ({ ...f, walletId: v === "__none" ? null : v }))}
                >
                  <SelectTrigger className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)]">
                    <SelectValue placeholder="— Sem carteira —" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--card)] border-[var(--brd)]">
                    <SelectItem value="__none">
                      <span className="text-[var(--dim)]">— Sem carteira específica —</span>
                    </SelectItem>
                    {wallets.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        <span className="flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: w.color || '#6EE000' }} />
                          {w.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Take / Stop */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[var(--dim)] text-xs mb-1.5 block">Alvo (Take Profit R$)</Label>
                  <Input
                    type="number" step="0.01"
                    className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)]"
                    value={editForm.alvo || ''}
                    onChange={e => setEditForm(f => ({ ...f, alvo: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-[var(--dim)] text-xs mb-1.5 block">Stop Loss R$</Label>
                  <Input
                    type="number" step="0.01"
                    className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)]"
                    value={editForm.stop || ''}
                    onChange={e => setEditForm(f => ({ ...f, stop: e.target.value }))}
                  />
                </div>
              </div>

              {/* Resultado */}
              <div>
                <Label className="text-[var(--dim)] text-xs mb-2 block">Resultado</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditTradeResult('take')}
                    className={`flex items-center justify-center gap-2 h-10 rounded-lg border text-sm font-semibold transition-all ${
                      editTradeResult === 'take'
                        ? 'bg-[#6EE000]/20 border-[#6EE000] text-[#6EE000]'
                        : 'border-[var(--brd)] text-[var(--dim)] hover:border-[#6EE000]/50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Take Profit
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTradeResult('loss')}
                    className={`flex items-center justify-center gap-2 h-10 rounded-lg border text-sm font-semibold transition-all ${
                      editTradeResult === 'loss'
                        ? 'bg-[#FF1F3D]/20 border-[#FF1F3D] text-[#FF1F3D]'
                        : 'border-[var(--brd)] text-[var(--dim)] hover:border-[#FF1F3D]/50'
                    }`}
                  >
                    <XCircle className="w-4 h-4" /> Stop Loss
                  </button>
                </div>
              </div>

              {/* Setup / Emoção */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[var(--dim)] text-xs mb-1.5 block">Setup</Label>
                  <Input
                    className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)]"
                    value={editForm.setup || ''}
                    onChange={e => setEditForm(f => ({ ...f, setup: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-[var(--dim)] text-xs mb-1.5 block">Emoção</Label>
                  <Input
                    className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)]"
                    value={editForm.emocao || ''}
                    onChange={e => setEditForm(f => ({ ...f, emocao: e.target.value as any }))}
                  />
                </div>
              </div>

              {/* Comentário */}
              <div>
                <Label className="text-[var(--dim)] text-xs mb-1.5 block">Comentário</Label>
                <Textarea
                  className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)] min-h-[80px]"
                  value={editForm.comentario || ''}
                  onChange={e => setEditForm(f => ({ ...f, comentario: e.target.value }))}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => { setEditingTrade(null); setEditForm({}); }}
              className="border-[var(--brd)] text-[var(--dim)]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateTradeMutation.isPending}
              className="bg-[#6EE000] hover:bg-[#5bc800] text-black font-bold"
            >
              {updateTradeMutation.isPending ? 'Salvando…' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}