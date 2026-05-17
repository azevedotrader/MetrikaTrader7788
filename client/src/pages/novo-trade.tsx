import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { type InsertTrade, type Trade } from "@shared/schema";
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
  TrendingUp,
  TrendingDown,
  Wallet,
  Zap,
  ClipboardList,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Check,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import type { Wallet as WalletType } from "@shared/schema";

// ── tipos internos ───────────────────────────────────────────────────────────
interface ParsedTrade {
  ativo: string;
  mercado: string;
  tipo: 'compra' | 'venda';
  resultado: 'take' | 'loss' | 'be' | '';
  valor: number | null;   // valor financeiro do resultado
  multiplier: number | null; // 3x / 3R = múltiplo do risco
  alvo: string;
  stop: string;
  hora: string;
  raw: string;
  missing: string[];
}

// ── inferir mercado pelo nome do ativo ───────────────────────────────────────
function inferMercado(ativo: string): string {
  const a = ativo.toUpperCase();
  const cryptos = ['BTC','ETH','SOL','BNB','XRP','ADA','DOGE','AVAX','DOT','LINK','LTC','MATIC','UNI'];
  if (cryptos.some(c => a.includes(c))) return 'crypto';
  const fxBase = ['EUR','GBP','AUD','NZD','CAD','CHF','JPY','USD','NOK','SEK'];
  const isFx = fxBase.some(c => a.startsWith(c)) && a.length === 6;
  if (isFx || ['XAUUSD','XAGUSD','DE40','US30','UK100','USTEC','NAS','SPX'].some(s => a.includes(s))) return 'forex';
  return 'b3';
}

// ── parser de linha ───────────────────────────────────────────────────────────
function parseQuickLine(line: string): ParsedTrade | null {
  const raw = line.trim();
  if (!raw) return null;
  const l = raw.toUpperCase();
  const missing: string[] = [];

  // ativo
  const ativoMatch = l.match(/\b([A-Z]{3,8}(?:USD|BTC|EUR|GBP|JPY|BRL|USDT|NZD|CAD|CHF|AUD)?)\b/);
  const ativo = ativoMatch ? ativoMatch[1] : '';
  if (!ativo) missing.push('ativo');

  // tipo: long/compra ou short/venda
  const tipo: 'compra'|'venda' = /\bSHORT\b|\bVENDA\b|\bSELL\b/.test(l) ? 'venda' : 'compra';

  // resultado: take / loss / stop / be
  const res = /\bTAKE\b|\bTP\b/.test(l) ? 'take'
    : /\bLOSS\b|\bSTOP\b/.test(l) ? 'loss'
    : /\bBE\b/.test(l) ? 'be'
    : '';
  if (!res) missing.push('resultado (take, loss, be)');

  // múltiplo do risco: 3x, 2.5x, 3R, 2R  (3x == 3R == ganhou/perdeu 3× o risco)
  // Deve vir ANTES do match de valor financeiro para não confundir "3R" com "R$3"
  const multMatch = l.match(/\b(\d+(?:[.,]\d+)?)\s*[Xx]\b|\b(\d+(?:[.,]\d+)?)\s*R\b(?!\$)/);
  const multiplier = multMatch
    ? parseFloat((multMatch[1] || multMatch[2]).replace(',','.'))
    : null;

  // valor financeiro explícito: R$150, R$ 500  (cifrão após R)
  const valMatch = l.match(/R\$\s*(\d+(?:[.,]\d+)?)/);
  const valor = valMatch ? parseFloat(valMatch[1].replace(',','.')) : null;

  // alvo / stop como valores separados "alvo 500 stop 200"
  const alvoMatch = l.match(/(?:ALVO|TAKE|TP)\s+(\d+(?:[.,]\d+)?)/);
  const stopMatch = l.match(/(?:STOP|SL|LOSS)\s+(\d+(?:[.,]\d+)?)/);
  const alvo = alvoMatch ? alvoMatch[1].replace(',','.') : '';
  const stop = stopMatch ? stopMatch[1].replace(',','.') : '';

  // hora
  const horaMatch = l.match(/(\d{1,2})[Hh:](\d{2})/);
  const hora = horaMatch ? `${horaMatch[1].padStart(2,'0')}:${horaMatch[2]}` : '';

  // valor financeiro final (hierarquia):
  // 1. valor explícito (R$500)
  // 2. multiplier × stop  (3x com stop 200 → R$600)
  // 3. alvo/stop direto
  // 4. be → 0
  let resultadoFinal: number | null = null;
  if (valor !== null) {
    resultadoFinal = res === 'loss' ? -Math.abs(valor) : Math.abs(valor);
  } else if (multiplier !== null && stop) {
    const stopVal = parseFloat(stop);
    resultadoFinal = res === 'loss' ? -(multiplier * stopVal) : multiplier * stopVal;
  } else if (res === 'take' && alvo) {
    resultadoFinal = parseFloat(alvo);
  } else if (res === 'loss' && stop) {
    resultadoFinal = -parseFloat(stop);
  } else if (res === 'be') {
    resultadoFinal = 0;
  }
  // multiplier sem stop: valor fica null mas o múltiplo é mostrado na UI

  return { ativo, mercado: inferMercado(ativo), tipo, resultado: res as any, valor: resultadoFinal, multiplier, alvo, stop, hora, raw, missing };
}

export default function NovoTrade() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const { data: wallets = [] } = useQuery<WalletType[]>({ queryKey: ['/api/wallets'] });

  // ── Entrada Rápida ──────────────────────────────────────────
  const [quickText, setQuickText]     = useState('');
  const [parsed, setParsed]           = useState<ParsedTrade[]>([]);
  const [savedIds, setSavedIds]       = useState<Set<number>>(new Set());
  const [quickWallet, setQuickWallet] = useState<string | null>(null);

  function handleParse() {
    const lines = quickText.split('\n').filter(l => l.trim());
    const result = lines.map(parseQuickLine).filter(Boolean) as ParsedTrade[];
    setParsed(result);
    setSavedIds(new Set());
  }

  function buildInsertTrade(p: ParsedTrade, walletId: string | null): InsertTrade {
    const today = new Date().toISOString().slice(0, 10);
    const dataHora = p.hora ? `${today}T${p.hora}` : new Date().toISOString().slice(0, 16);
    return {
      dataHora,
      ativo: p.ativo,
      mercado: p.mercado,
      tipo: p.tipo,
      resultado: p.valor !== null ? String(p.valor) : '0',
      alvo: p.alvo || '',
      stop: p.stop || '',
      // multiplier salvo em risco: 3x → risco = "3.00" (vezes o risco base)
      risco: p.multiplier !== null ? String(p.multiplier) : undefined,
      setup: '',
      emocao: undefined,
      comentario: '',
      corretora: p.mercado,
      walletId: walletId || undefined,
    } as any;
  }

  async function saveSingle(idx: number) {
    const p = parsed[idx];
    if (!p || p.missing.length > 0) return;
    await createTradeMutation.mutateAsync(buildInsertTrade(p, quickWallet));
    setSavedIds(prev => new Set([...prev, idx]));
  }

  async function saveAll() {
    const toSave = parsed.filter((p, i) => p.missing.length === 0 && !savedIds.has(i));
    for (const [i, p] of toSave.map((p, ri) => [parsed.indexOf(p), p] as [number, ParsedTrade])) {
      await createTradeMutation.mutateAsync(buildInsertTrade(p, quickWallet));
      setSavedIds(prev => new Set([...prev, i]));
    }
    if (toSave.length > 0) {
      setQuickText('');
      setParsed([]);
      setSavedIds(new Set());
    }
  }

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
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades/by-broker"] });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao salvar trade", description: error.message, variant: "destructive" });
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
    updateTradeMutation.mutate({ id: editingTrade.id, data: { ...editForm, resultado: String(resultado) } });
  };

  const validCount = parsed.filter((p, i) => p.missing.length === 0 && !savedIds.has(i)).length;

  return (
    <div className="space-y-4 lg:space-y-6 p-4 lg:p-6 pb-8">

      {/* ── Registrar Trade por Texto ── */}
      <Card className="bg-[#0d0d18] border-[#6EE000]/25" data-testid="quick-entry-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <Zap className="h-5 w-5 text-[#6EE000]" />
            Registrar Trade
          </CardTitle>
          <CardDescription className="text-zinc-500 text-xs space-y-1">
            <span className="block">Digite um trade por linha — o app reconhece e registra direto.</span>
            <span className="block">
              <span className="text-zinc-400">Exemplos: </span>
              <span className="text-[#6EE000] font-mono">EURUSD take R$500 9h15</span>
              <span className="text-zinc-600"> · </span>
              <span className="text-zinc-400 font-mono">BTCUSD loss 7h48</span>
              <span className="text-zinc-600"> · </span>
              <span className="text-zinc-400 font-mono">PETR4 take alvo 300 stop 100 14h30</span>
            </span>
            <span className="block text-amber-500/80">
              💡 <strong className="font-semibold">3x = 3R</strong> — ambos significam 3× o risco.
              Se usar apenas o múltiplo (ex: <span className="font-mono">EURUSD take 3x 9h15</span>),
              adicione também o valor do stop (ex: <span className="font-mono">stop 200</span>) para calcular o resultado em R$.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Carteira (opcional) */}
          {wallets.length > 0 && (
            <div className="flex items-center gap-2">
              <Wallet className="w-3.5 h-3.5 text-[var(--b)] shrink-0" />
              <Select value={quickWallet ?? '__none'} onValueChange={v => setQuickWallet(v === '__none' ? null : v)}>
                <SelectTrigger className="h-8 text-xs bg-[#13131a] border-[#28283a] text-white w-48">
                  <SelectValue placeholder="Sem carteira" />
                </SelectTrigger>
                <SelectContent className="bg-[#13131a] border-[#28283a]">
                  <SelectItem value="__none"><span className="text-zinc-500">— Sem carteira —</span></SelectItem>
                  {wallets.map(w => (
                    <SelectItem key={w.id} value={w.id}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: w.color || '#6EE000' }} />
                        {w.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <textarea
            value={quickText}
            onChange={e => { setQuickText(e.target.value); setParsed([]); setSavedIds(new Set()); }}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleParse(); }}
            placeholder={"EURUSD take R$500 9h15\nBTCUSD loss 7h48\nPETR4 take alvo 300 stop 100 14h30"}
            rows={3}
            className="w-full bg-[#080810] border border-[#1e1e2e] rounded-xl p-3 text-sm text-white placeholder:text-zinc-700 font-mono resize-y focus:outline-none focus:border-[#6EE000]/60 transition-colors"
          />

          <div className="flex items-center gap-3">
            <Button type="button" onClick={handleParse}
              className="bg-[#6EE000] hover:bg-[#5bc800] text-black font-bold text-sm px-5 h-9">
              <Zap className="w-4 h-4 mr-1.5" /> Reconhecer
            </Button>
            {parsed.length > 0 && validCount > 0 && (
              <Button type="button" onClick={saveAll} disabled={createTradeMutation.isPending}
                className="bg-white/10 hover:bg-white/15 text-white border border-white/20 text-sm h-9 px-4">
                <Check className="w-4 h-4 mr-1.5" />
                Registrar {validCount > 1 ? `todos (${validCount})` : 'trade'}
              </Button>
            )}
            <span className="text-[10px] text-zinc-600 ml-auto">Ctrl+Enter para reconhecer</span>
          </div>

          {/* Trades reconhecidos */}
          {parsed.length > 0 && (
            <div className="space-y-2 pt-1">
              {parsed.map((p, i) => {
                const isSaved = savedIds.has(i);
                const hasError = p.missing.length > 0;
                return (
                  <div key={i} className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 transition-all ${
                    isSaved ? 'bg-[#6EE000]/5 border-[#6EE000]/30 opacity-60'
                    : hasError ? 'bg-[#FF1F3D]/5 border-[#FF1F3D]/20'
                    : 'bg-[#0d0d18] border-[#1e1e2e]'
                  }`}>
                    {/* ativo + mercado */}
                    <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                      <span className="font-bold text-white text-sm">{p.ativo || '?'}</span>
                      <span className="text-[10px] text-zinc-600 uppercase">{p.mercado}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${p.tipo==='compra'?'text-[#6EE000] bg-[#6EE000]/10':'text-[#FF1F3D] bg-[#FF1F3D]/10'}`}>
                        {p.tipo === 'compra' ? '▲ Long' : '▼ Short'}
                      </span>
                      {p.resultado && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          p.resultado==='take'?'bg-[#6EE000]/15 text-[#6EE000]'
                          :p.resultado==='be'?'bg-amber-500/15 text-amber-400'
                          :'bg-[#FF1F3D]/15 text-[#FF1F3D]'}`}>
                          {p.resultado.toUpperCase()}
                        </span>
                      )}
                      {/* múltiplo do risco */}
                      {p.multiplier !== null && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-bold">
                          {p.multiplier}R
                        </span>
                      )}
                      {/* valor financeiro */}
                      {p.valor !== null ? (
                        <span className={`text-sm font-bold tabular-nums ${p.valor>=0?'text-[#6EE000]':'text-[#FF1F3D]'}`}>
                          {p.valor>=0?'+':''}R${Math.abs(p.valor).toLocaleString('pt-BR',{maximumFractionDigits:2})}
                        </span>
                      ) : p.multiplier !== null && p.resultado !== 'be' && (
                        <span className="text-[10px] text-amber-400/80 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> adicione o stop para calcular R$
                        </span>
                      )}
                      {p.hora && <span className="text-[10px] text-zinc-500">{p.hora}</span>}
                      {hasError && (
                        <span className="text-[10px] text-[#FF1F3D] flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> falta: {p.missing.join(', ')}
                        </span>
                      )}
                    </div>
                    {/* ação */}
                    {isSaved ? (
                      <span className="text-[#6EE000] text-xs flex items-center gap-1 shrink-0"><CheckCircle2 className="w-4 h-4" /> Salvo</span>
                    ) : !hasError ? (
                      <Button type="button" size="sm" onClick={() => saveSingle(i)}
                        disabled={createTradeMutation.isPending}
                        className="bg-[#6EE000]/15 hover:bg-[#6EE000] text-[#6EE000] hover:text-black border border-[#6EE000]/30 text-xs h-7 px-3 shrink-0 transition-all">
                        Salvar
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
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