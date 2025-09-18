import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTour } from "@/contexts/TourContext";
import {
  TrendingUp,
  Target,
  Calendar,
  DollarSign,
  BarChart3,
  Building,
  Upload,
  Download,
  RefreshCw as Sync,
  FileText,
  Activity,
  Plus,
  LineChart,
  Trash2,
  Edit3,
  Edit2,
  Filter,
  CheckSquare,
  ChevronDown,
  X,
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  ReferenceLine,
  Cell,
} from "recharts";
import { type Trade } from "@shared/schema";
import { TradingCalendar } from "@/components/ui/trading-calendar";
import { SmartReprocessButton } from "@/components/SmartReprocessButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { TopBar } from "@/components/layout/top-bar";
import metrikaLogo from "@assets/bb593927-43a1-4153-a7cb-c63e789ec7c3_1757781377777.png";
import {
  format,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
} from "date-fns";
import { ptBR } from "date-fns/locale";

interface BrokerStats {
  totalTrades: number;
  totalProfit: number;
  winRate: number;
}

// Mover brokerInfo para dentro do componente para acessar t()

interface TradeMetrics {
  totalTrades: number;
  rentabilidadeTotal: number;
  rentabilidadeMes: number;
  rentabilidadeSemana: number;
  rentabilidadeAno: number;
  melhorTrade: number;
  piorTrade: number;
  taxaAcerto: number;
  riscoRetornoMedio: number;
  tempoMedioTrade: number;
  setupMaisLucrativo: { setup: string; total: number; percent: number };
  emocaoMaisRecorrente: { emocao: string; count: number };
  lucroPorDiaSemana: Array<{ dia: string; valor: number }>;
}

const simbolosEmocoes = {
  confiante: "●",
  ansioso: "▲",
  impulsivo: "♦",
  calmo: "◆",
  eufórico: "★",
  frustrado: "■",
  neutro: "○",
};

// Capital Curve Chart - Professional Trading Analytics
function CapitalCurveChart({ trades, t }: { trades: Trade[]; t: (key: string) => string }) {
  const [timeFilter, setTimeFilter] = useState<
    "dia" | "semana" | "mes" | "ano"
  >("mes");

  const chartData = useMemo(() => {
    if (!trades.length) return [];

    // Ordenar trades por data
    const sortedTrades = [...trades].sort(
      (a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime(),
    );

    // Função para agrupar dados baseado no filtro
    const groupDataByPeriod = () => {
      const groups = new Map();
      let cumulativeProfit = 0;

      sortedTrades.forEach((trade) => {
        const tradeDate = new Date(trade.dataHora);
        const profit = parseFloat(trade.resultado || "0");
        cumulativeProfit += profit;

        let periodKey: string;
        let periodLabel: string;

        switch (timeFilter) {
          case "dia":
            periodKey = format(startOfDay(tradeDate), "yyyy-MM-dd");
            periodLabel = format(tradeDate, "dd/MM", { locale: ptBR });
            break;
          case "semana":
            periodKey = format(
              startOfWeek(tradeDate, { weekStartsOn: 1 }),
              "yyyy-MM-dd",
            );
            periodLabel = format(
              startOfWeek(tradeDate, { weekStartsOn: 1 }),
              "dd/MM",
              { locale: ptBR },
            );
            break;
          case "mes":
            periodKey = format(startOfMonth(tradeDate), "yyyy-MM");
            periodLabel = format(tradeDate, "MMM/yy", { locale: ptBR });
            break;
          case "ano":
            periodKey = format(startOfYear(tradeDate), "yyyy");
            periodLabel = format(tradeDate, "yyyy", { locale: ptBR });
            break;
        }

        if (!groups.has(periodKey)) {
          groups.set(periodKey, {
            period: periodLabel,
            date: periodKey,
            profit: 0,
            cumulativeProfit: 0,
            trades: 0,
          });
        }

        const group = groups.get(periodKey);
        group.profit += profit;
        group.cumulativeProfit = cumulativeProfit;
        group.trades += 1;
      });

      return Array.from(groups.values()).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
    };

    return groupDataByPeriod();
  }, [trades, timeFilter]);

  const formatTooltipValue = (value: number, name: string) => {
    if (name === "cumulativeProfit") {
      return [`R$ ${value.toFixed(2)}`, t('chart.profitability_accumulated')];
    }
    return [`R$ ${value.toFixed(2)}`, t('chart.period_result')];
  };

  return (
    <div className="w-full">
      <CardContent className="p-6">
        {/* Filtros de Tempo */}
        <div className="flex justify-end gap-2 mb-4">
          {[
            { key: "dia", label: t('time.day') },
            { key: "semana", label: t('time.week') },
            { key: "mes", label: t('time.month') },
            { key: "ano", label: t('time.year') },
          ].map((filter) => (
            <Button
              key={filter.key}
              variant={timeFilter === filter.key ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeFilter(filter.key as any)}
              className={
                timeFilter === filter.key
                  ? "bg-neutral-primary hover:bg-neutral-secondary"
                  : "border-charcoal-600 text-charcoal-300 hover:bg-charcoal-800"
              }
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Gráfico */}
        <div className="h-80 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="period" stroke="#9CA3AF" fontSize={12} />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                    color: "#F1F5F9",
                  }}
                  formatter={formatTooltipValue}
                  labelStyle={{ color: "#CBD5E1" }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeProfit"
                  stroke="#22c55e"
                  strokeWidth={3}
                  dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#22c55e", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: "#10B981", strokeWidth: 2, r: 3 }}
                  strokeDasharray="5 5"
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-400">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum dado para exibir</p>
                <p className="text-sm">
                  {t('charts.register_trades_to_see')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Legenda */}
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-green-500"></div>
            <span className="text-slate-300">{t('metrics.accumulated_profitability')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-green-500 border-dashed"></div>
            <span className="text-slate-300">{t('metrics.period_result')}</span>
          </div>
        </div>
      </CardContent>
    </div>
  );
}

// Performance Period Chart Component
function PerformancePeriodChart({ trades, t }: { trades: Trade[]; t: (key: string) => string }) {
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "year" | "specific-month"
  >("month");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), "yyyy-MM"),
  );
  const [selectedStartDay, setSelectedStartDay] = useState<number>(1);
  const [selectedEndDay, setSelectedEndDay] = useState<number>(31);

  const getChartData = () => {
    // Usar diretamente os trades já filtrados que vêm do dashboard principal
    // Isso garante que respeitamos todos os filtros (broker, CSV, etc.)
    if (!trades.length) return [];

    let periodFilteredTrades = trades;
    let groupBy: "day" | "week" | "month" = "day";

    // Apenas aplica filtro de período se um período específico for selecionado
    // Isso evita conflito com os filtros globais do dashboard
    if (selectedPeriod !== "month") { // "month" é o padrão, mostra todos os trades filtrados
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (selectedPeriod) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          endDate = now;
          groupBy = "day";
          break;
        case "year":
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          endDate = now;
          groupBy = "month";
          break;
        case "specific-month":
          // Corrigir problema de timezone na conversão da data
          const [yearStr, monthStr] = selectedMonth.split("-");
          const yearNum = parseInt(yearStr, 10);
          const monthNum = parseInt(monthStr, 10);
          
          // Determinar último dia do mês selecionado
          const lastDayOfMonth = new Date(yearNum, monthNum, 0).getDate();
          const actualEndDay = Math.min(selectedEndDay, lastDayOfMonth);
          
          // Criar datas com range de dias específicos
          startDate = new Date(yearNum, monthNum - 1, selectedStartDay);
          endDate = new Date(yearNum, monthNum - 1, actualEndDay, 23, 59, 59);
          
          groupBy = "day";
          break;
        default:
          // Para "month" (30 dias) usa todos os trades já filtrados
          break;
      }

      // Aplicar filtro adicional de período apenas se definido
      if (startDate! && endDate!) {
        periodFilteredTrades = trades.filter((trade) => {
          const tradeDate = new Date(trade.dataHora);
          return tradeDate >= startDate && tradeDate <= endDate;
        });
      }
    }

    if (periodFilteredTrades.length === 0) return [];

    // Ordenar trades por data
    const sortedTrades = [...periodFilteredTrades].sort(
      (a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime(),
    );

    // Agrupar trades por período
    const groups = new Map<string, { trades: Trade[]; date: Date }>();

    sortedTrades.forEach((trade) => {
      const tradeDate = new Date(trade.dataHora);
      let key: string;

      if (groupBy === "day") {
        key = format(tradeDate, "dd/MM", { locale: ptBR });
      } else if (groupBy === "month") {
        key = format(tradeDate, "MMM/yy", { locale: ptBR });
      } else {
        key = format(tradeDate, "dd/MM", { locale: ptBR });
      }

      if (!groups.has(key)) {
        groups.set(key, { trades: [], date: tradeDate });
      }
      groups.get(key)!.trades.push(trade);
    });

    // Criar dados do gráfico com valores individuais e acumulados
    let accumulated = 0;
    const chartData: any[] = [];

    Array.from(groups.entries()).forEach(
      ([period, { trades: periodTrades }]) => {
        const positives = periodTrades.filter(
          (t) => parseFloat(t.resultado || "0") > 0,
        );
        const negatives = periodTrades.filter(
          (t) => parseFloat(t.resultado || "0") < 0,
        );

        const totalPositive = positives.reduce(
          (sum, t) => sum + parseFloat(t.resultado || "0"),
          0,
        );
        const totalNegative = negatives.reduce(
          (sum, t) => sum + parseFloat(t.resultado || "0"),
          0,
        );
        const periodTotal = totalPositive + totalNegative;

        accumulated += periodTotal;

        chartData.push({
          period,
          positive: totalPositive,
          negative: Math.abs(totalNegative),
          total: periodTotal,
          accumulated,
          accumulatedPositive: accumulated >= 0 ? accumulated : 0,
          accumulatedNegative: accumulated < 0 ? accumulated : 0,
          positiveCount: positives.length,
          negativeCount: negatives.length,
          totalCount: periodTrades.length,
        });
      },
    );

    return chartData;
  };

  const chartData = getChartData();
  const maxValue = Math.max(
    ...chartData.map((d) =>
      Math.max(d.positive, d.negative, Math.abs(d.accumulated)),
    ),
  );
  const yAxisDomain =
    maxValue > 0 ? [-maxValue * 1.1, maxValue * 1.1] : [-100, 100];
  
  // Cor da linha baseada no valor acumulado final
  const finalAccumulated = chartData.length > 0 ? chartData[chartData.length - 1].accumulated : 0;
  const isNegative = finalAccumulated < 0;
  const lineColor = isNegative ? "#ef4444" : "#22c55e"; // Vermelho se negativo, verde se positivo
  const fillGradient = isNegative ? "url(#negativeGradient)" : "url(#positiveGradient)";

  // Função para renderizar métricas no container
  const renderMetrics = () => {
    const container = document.getElementById('performance-metrics-container');
    if (!container || chartData.length === 0) return;

    const totalPositive = chartData.reduce((sum, d) => sum + d.positive, 0);
    const totalNegative = chartData.reduce((sum, d) => sum + d.negative, 0);
    const totalPositiveCount = chartData.reduce((sum, d) => sum + d.positiveCount, 0);
    const totalNegativeCount = chartData.reduce((sum, d) => sum + d.negativeCount, 0);
    const totalTrades = chartData.reduce((sum, d) => sum + d.totalCount, 0);
    const winRate = totalTrades > 0 ? (totalPositiveCount / totalTrades * 100) : 0;
    const avgPerPeriod = chartData.length > 0 ? finalAccumulated / chartData.length : 0;

    container.innerHTML = `
      <div class="flex gap-1">
        <!-- Total de Lucros -->
        <div class="bg-zinc-800/90 rounded-lg border border-zinc-700 p-1.5 w-20 h-16 flex flex-col justify-center items-center text-center">
          <div class="text-xs text-zinc-400 mb-0.5 leading-tight">Lucros</div>
          <div class="text-xs font-bold text-green-400 truncate">
            R$ ${totalPositive.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </div>
          <div class="text-xs text-zinc-500 leading-tight">
            ${totalPositiveCount}
          </div>
        </div>

        <!-- Total de Perdas -->
        <div class="bg-zinc-800/90 rounded-lg border border-zinc-700 p-1.5 w-20 h-16 flex flex-col justify-center items-center text-center">
          <div class="text-xs text-zinc-400 mb-0.5 leading-tight">Perdas</div>
          <div class="text-xs font-bold text-red-400 truncate">
            -R$ ${totalNegative.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </div>
          <div class="text-xs text-zinc-500 leading-tight">
            ${totalNegativeCount}
          </div>
        </div>

        <!-- Resultado do Período -->
        <div class="bg-zinc-800/90 rounded-lg border border-zinc-700 p-1.5 w-20 h-16 flex flex-col justify-center items-center text-center">
          <div class="text-xs text-zinc-400 mb-0.5 leading-tight">Resultado</div>
          <div class="text-xs font-bold truncate ${finalAccumulated >= 0 ? 'text-green-400' : 'text-red-400'}">
            R$ ${finalAccumulated.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </div>
          <div class="text-xs text-zinc-500 leading-tight">
            ${winRate.toFixed(0)}%
          </div>
        </div>

        <!-- Média por Período -->
        <div class="bg-zinc-800/90 rounded-lg border border-zinc-700 p-1.5 w-20 h-16 flex flex-col justify-center items-center text-center">
          <div class="text-xs text-zinc-400 mb-0.5 leading-tight">Média</div>
          <div class="text-xs font-bold truncate ${avgPerPeriod >= 0 ? 'text-blue-400' : 'text-orange-400'}">
            R$ ${avgPerPeriod.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </div>
          <div class="text-xs text-zinc-500 leading-tight">
            ${chartData.length}d
          </div>
        </div>
      </div>
    `;
  };

  // Renderizar métricas quando chartData muda
  useEffect(() => {
    renderMetrics();
  }, [chartData, selectedPeriod, selectedMonth, selectedStartDay, selectedEndDay]);

  return (
    <div data-testid="performance-chart" className="w-full">
      {/* Filtros de Período */}
      <div className="flex justify-center gap-1 md:gap-2 mb-4 md:mb-6 flex-wrap items-center">
        {[
          { key: "week", label: t('time.7_days') },
          { key: "month", label: t('chart.all_months') },
          { key: "year", label: t('time.1_year') },
        ].map((filter) => (
          <Button
            key={filter.key}
            variant={selectedPeriod === filter.key ? "default" : "outline"}
            size="sm"
            onClick={() =>
              setSelectedPeriod(
                filter.key as "week" | "month" | "year" | "specific-month",
              )
            }
            className={`text-xs md:text-sm ${
              selectedPeriod === filter.key
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            {filter.label}
          </Button>
        ))}

        {/* Seletor de Mês Específico */}
        <Select value={selectedMonth} onValueChange={(value) => {
          setSelectedMonth(value);
          setSelectedPeriod("specific-month");
          // Reset day range when month changes
          const [year, month] = value.split('-');
          const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
          setSelectedStartDay(1);
          setSelectedEndDay(lastDay);
        }}>
          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white w-32 md:w-40 text-xs md:text-sm">
            <SelectValue placeholder="Mês Específico" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            {(() => {
              const months = [];
              const now = new Date();

              // Criar lista dos últimos 24 meses
              for (let i = 0; i < 24; i++) {
                const date = new Date(
                  now.getFullYear(),
                  now.getMonth() - i,
                  1,
                );
                const value = format(date, "yyyy-MM");
                const label = format(date, "MMM/yy", { locale: ptBR });
                months.push({ value, label });
              }

              return months.map((month) => (
                <SelectItem
                  key={month.value}
                  value={month.value}
                  className="text-white hover:bg-zinc-700 text-xs md:text-sm"
                >
                  {month.label}
                </SelectItem>
              ));
            })()}
          </SelectContent>
        </Select>

        {/* Filtros de Dias - aparecem ao lado quando mês específico está selecionado */}
        {selectedPeriod === "specific-month" && (
          <>
            <span className="text-zinc-400 text-xs md:text-sm">Do dia</span>
            <Select 
              value={selectedStartDay.toString()} 
              onValueChange={(value) => {
                const day = parseInt(value);
                setSelectedStartDay(day);
                if (day > selectedEndDay) {
                  setSelectedEndDay(day);
                }
              }}
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white w-12 md:w-16 text-xs md:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 max-h-40">
                {(() => {
                  const [year, month] = selectedMonth.split('-');
                  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                  const days = [];
                  for (let i = 1; i <= lastDay; i++) {
                    days.push(
                      <SelectItem key={i} value={i.toString()} className="text-white hover:bg-zinc-700 text-xs md:text-sm">
                        {i}
                      </SelectItem>
                    );
                  }
                  return days;
                })()}
              </SelectContent>
            </Select>
            
            <span className="text-zinc-400 text-xs md:text-sm">ao dia</span>
            
            <Select 
              value={selectedEndDay.toString()} 
              onValueChange={(value) => {
                const day = parseInt(value);
                setSelectedEndDay(day);
                if (day < selectedStartDay) {
                  setSelectedStartDay(day);
                }
              }}
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white w-12 md:w-16 text-xs md:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 max-h-40">
                {(() => {
                  const [year, month] = selectedMonth.split('-');
                  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                  const days = [];
                  for (let i = 1; i <= lastDay; i++) {
                    days.push(
                      <SelectItem key={i} value={i.toString()} className="text-white hover:bg-zinc-700 text-xs md:text-sm">
                        {i}
                      </SelectItem>
                    );
                  }
                  return days;
                })()}
              </SelectContent>
            </Select>
            
            <div className="text-xs text-zinc-500">
              {(() => {
                const [year, month] = selectedMonth.split('-');
                const startDate = new Date(parseInt(year), parseInt(month) - 1, selectedStartDay);
                const endDate = new Date(parseInt(year), parseInt(month) - 1, selectedEndDay);
                const dayCount = Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1;
                return `(${dayCount}d)`;
              })()}
            </div>
          </>
        )}
      </div>

      {chartData.length === 0 ? (
        <div className="h-[550px] md:h-[380px] flex items-center justify-center text-zinc-400">
          <div className="text-center">
            <BarChart3 className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">{t('empty.no_trades_period')}</p>
          </div>
        </div>
      ) : (
        <div className="relative h-[350px]">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
          {(() => {
            // Calcular yMin e yMax dos dados reais
            const yMin = Math.min(...chartData.map(d => d.accumulated));
            const yMax = Math.max(...chartData.map(d => d.accumulated));
            
            // Calcular a posição do zero no gradiente
            let zeroPosition = 0;
            if (yMax !== yMin) {
              zeroPosition = ((yMax - 0) / (yMax - yMin)) * 100;
              zeroPosition = Math.max(0, Math.min(100, zeroPosition));
            }

            // Tooltip personalizado
            const CustomTooltip = ({ active, payload, label }: any) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div style={{
                    backgroundColor: "#000000",
                    border: "1px solid #444",
                    borderRadius: "8px",
                    padding: "8px",
                    color: "#fff"
                  }}>
                    <p style={{ margin: 0, fontWeight: "bold", marginBottom: "4px" }}>
                      {label}
                    </p>
                    <p style={{ margin: 0, color: data.accumulated >= 0 ? "#22c55e" : "#ef4444" }}>
                      💰 Acumulado: R$ {data.accumulated.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    {data.positive > 0 && (
                      <p style={{ margin: 0, color: "#22c55e" }}>
                        📈 Lucro: R$ {data.positive.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    )}
                    {data.negative < 0 && (
                      <p style={{ margin: 0, color: "#ef4444" }}>
                        📉 Perda: R$ {Math.abs(data.negative).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            };
            
            return (
              <ComposedChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                {/* Gradiente dinâmico baseado no domínio real do eixo Y */}
                <defs>
                  <linearGradient id="dynamicGradient" x1="0" y1="0" x2="0" y2="1">
                    {/* Verde acima de 0 */}
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset={`${zeroPosition}%`} stopColor="#22c55e" />
                    {/* Vermelho abaixo de 0 */}
                    <stop offset={`${zeroPosition}%`} stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>

                {/* Grid */}
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                
                {/* Eixos */}
                <XAxis 
                  dataKey="period" 
                  stroke="#aaa"
                  fontSize={window.innerWidth < 768 ? 8 : 11}
                  angle={-45}
                  textAnchor="end"
                  height={window.innerWidth < 768 ? 50 : 80}
                />
                
                <YAxis 
                  stroke="#aaa"
                  fontSize={window.innerWidth < 768 ? 9 : 12}
                  tickFormatter={(value) =>
                    window.innerWidth < 768
                      ? `${(value / 1000).toFixed(0)}k`
                      : `R$ ${(value / 1000).toFixed(1)}k`
                  }
                />
                
                <Tooltip content={<CustomTooltip />} />

                {/* Linha do eixo 0 */}
                <ReferenceLine y={0} stroke="gray" strokeWidth={1} />

                {/* Área preenchida */}
                <Area
                  type="monotone"
                  dataKey="accumulated"
                  stroke="none"
                  fill="url(#dynamicGradient)"
                  fillOpacity={0.3}
                  isAnimationActive={false}
                />

                {/* Linha principal */}
                <Line
                  type="monotone"
                  dataKey="accumulated"
                  stroke="url(#dynamicGradient)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            );
          })()}
        </ResponsiveContainer>
        
        {/* Logo watermark grande no centro do gráfico */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="opacity-[0.08] hover:opacity-[0.15] transition-opacity duration-300 flex items-center justify-center">
            <img 
              src={metrikaLogo} 
              alt="METRIKA" 
              className="block object-contain h-64 sm:h-80 md:h-96 lg:h-[400px] xl:h-[450px] w-auto max-w-full max-h-full"
            />
          </div>
        </div>
      </div>
      )}

      
    </div>
  );
}

function calculateMetrics(trades: Trade[], t: (key: string) => string): TradeMetrics {
  if (!trades.length) {
    return {
      totalTrades: 0,
      rentabilidadeTotal: 0,
      rentabilidadeMes: 0,
      rentabilidadeSemana: 0,
      rentabilidadeAno: 0,
      melhorTrade: 0,
      piorTrade: 0,
      taxaAcerto: 0,
      riscoRetornoMedio: 0,
      tempoMedioTrade: 0,
      setupMaisLucrativo: { setup: "", total: 0, percent: 0 },
      emocaoMaisRecorrente: { emocao: "", count: 0 },
      lucroPorDiaSemana: [],
    };
  }

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  // Rentabilidade total
  const rentabilidadeTotal = trades.reduce((acc, trade) => {
    const resultado = parseFloat(trade.resultado || "0");
    return acc + resultado;
  }, 0);

  // Rentabilidade por período
  const tradesRecentes = trades.filter(
    (trade) => new Date(trade.dataHora) >= oneWeekAgo,
  );
  const tradesMes = trades.filter(
    (trade) => new Date(trade.dataHora) >= oneMonthAgo,
  );
  const tradesAno = trades.filter(
    (trade) => new Date(trade.dataHora) >= oneYearAgo,
  );

  const rentabilidadeSemana = tradesRecentes.reduce(
    (acc, trade) => acc + parseFloat(trade.resultado || "0"),
    0,
  );
  const rentabilidadeMes = tradesMes.reduce(
    (acc, trade) => acc + parseFloat(trade.resultado || "0"),
    0,
  );
  const rentabilidadeAno = tradesAno.reduce(
    (acc, trade) => acc + parseFloat(trade.resultado || "0"),
    0,
  );

  // Melhor e pior trade
  const resultados = trades.map((trade) => parseFloat(trade.resultado || "0"));
  const melhorTrade = Math.max(...resultados);
  const piorTrade = Math.min(...resultados);

  // Taxa de acerto
  const tradesLucrativos = trades.filter(
    (trade) => parseFloat(trade.resultado || "0") > 0,
  );
  const taxaAcerto = (tradesLucrativos.length / trades.length) * 100;

  // R/R médio baseado nos valores de Take e Stop dos trades
  const tradesComTakeStop = trades.filter(
    (trade) =>
      trade.alvo &&
      trade.stop &&
      parseFloat(trade.alvo) > 0 &&
      parseFloat(trade.stop) > 0,
  );

  let riscoRetornoMedio = 0;

  if (tradesComTakeStop.length > 0) {
    const totalRRR = tradesComTakeStop.reduce((acc, trade) => {
      const takeValue = parseFloat(trade.alvo!);
      const stopValue = parseFloat(trade.stop!);
      const rrr = takeValue / stopValue;
      return acc + rrr;
    }, 0);

    riscoRetornoMedio = totalRRR / tradesComTakeStop.length;
  } else {
    // Fallback: calcular baseado em lucro/perda média se não houver dados de Take/Stop
    const lucros = trades.filter(
      (trade) => parseFloat(trade.resultado || "0") > 0,
    );
    const perdas = trades.filter(
      (trade) => parseFloat(trade.resultado || "0") < 0,
    );

    const lucroMedio =
      lucros.length > 0
        ? lucros.reduce(
            (acc, trade) => acc + parseFloat(trade.resultado || "0"),
            0,
          ) / lucros.length
        : 0;
    const perdaMedia =
      perdas.length > 0
        ? Math.abs(
            perdas.reduce(
              (acc, trade) => acc + parseFloat(trade.resultado || "0"),
              0,
            ) / perdas.length,
          )
        : 0;

    riscoRetornoMedio = perdaMedia > 0 ? lucroMedio / perdaMedia : 0;
  }

  // Setup mais lucrativo
  const setupLucros = trades.reduce(
    (acc, trade) => {
      const setup = trade.setup || "Não definido";
      const resultado = parseFloat(trade.resultado || "0");
      if (!acc[setup]) acc[setup] = 0;
      acc[setup] += resultado;
      return acc;
    },
    {} as Record<string, number>,
  );

  const setupMaisLucrativo = Object.entries(setupLucros).reduce(
    (best, [setup, total]) => {
      if (total > best.total) {
        return { setup, total, percent: (total / rentabilidadeTotal) * 100 };
      }
      return best;
    },
    { setup: "", total: 0, percent: 0 },
  );

  // Emoção mais recorrente
  const emocoesCount = trades.reduce(
    (acc, trade) => {
      const emocao = trade.emocao || "neutro";
      acc[emocao] = (acc[emocao] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const emocaoMaisRecorrente = Object.entries(emocoesCount).reduce(
    (most, [emocao, count]) => {
      if (count > most.count) {
        return { emocao, count };
      }
      return most;
    },
    { emocao: "", count: 0 },
  );

  // Lucro por dia da semana
  const diasSemana = [
    t('weekdays.sunday'),
    t('weekdays.monday'),
    t('weekdays.tuesday'),
    t('weekdays.wednesday'),
    t('weekdays.thursday'),
    t('weekdays.friday'),
    t('weekdays.saturday'),
  ];
  const lucroPorDia = trades.reduce((acc, trade) => {
    const dia = new Date(trade.dataHora).getDay();
    const resultado = parseFloat(trade.resultado || "0");
    acc[dia] += resultado;
    return acc;
  }, new Array(7).fill(0));

  const lucroPorDiaSemana = diasSemana.map((dia, index) => ({
    dia,
    valor: lucroPorDia[index],
  }));

  // Tempo médio de trade (placeholder)
  const tempoMedioTrade = 0;

  return {
    totalTrades: trades.length,
    rentabilidadeTotal,
    rentabilidadeMes,
    rentabilidadeSemana,
    rentabilidadeAno,
    melhorTrade,
    piorTrade,
    taxaAcerto,
    riscoRetornoMedio,
    tempoMedioTrade,
    setupMaisLucrativo,
    emocaoMaisRecorrente,
    lucroPorDiaSemana,
  };
}

function calculateBrokerStats(trades: Trade[]): BrokerStats {
  if (!trades.length) {
    return { totalTrades: 0, totalProfit: 0, winRate: 0 };
  }

  const totalTrades = trades.length;
  const totalProfit = trades.reduce(
    (sum, trade) => sum + parseFloat(trade.resultado || "0"),
    0,
  );
  const winningTrades = trades.filter(
    (trade) => parseFloat(trade.resultado || "0") > 0,
  ).length;
  const winRate = (winningTrades / totalTrades) * 100;

  return { totalTrades, totalProfit, winRate };
}

// Square Card Component for TradeZella-like layout
interface SquareCardProps {
  title: string;
  value: string | number;
  icon: any;
  color?: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

function SquareCard({
  title,
  value,
  icon: Icon,
  color = "text-white",
  subtitle,
  className = "",
  children,
}: SquareCardProps) {
  return (
    <Card className={`bg-zinc-900/90 border-zinc-800 hover:bg-zinc-900/95 transition-colors aspect-square ${className}`}>
      <CardContent className="p-4 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between mb-2">
          <div className="text-xs text-zinc-400 font-medium truncate pr-2">
            {title}
          </div>
          <Icon className={`h-4 w-4 flex-shrink-0 ${color || "text-zinc-400"}`} />
        </div>
        
        <div className="flex-1 flex flex-col justify-center">
          {children ? (
            children
          ) : (
            <>
              <div className={`text-xl md:text-2xl font-bold ${color} mb-1`}>
                {value}
              </div>
              {subtitle && (
                <div className="text-xs text-zinc-500">{subtitle}</div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Circular Progress Component
interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

function CircularProgress({ percentage, size = 60, strokeWidth = 4, color = "#22c55e" }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#374151"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      <div className="absolute text-sm font-bold text-white">
        {percentage.toFixed(0)}%
      </div>
    </div>
  );
}

// Net Daily PnL Bar Chart Component
function NetDailyPnLBarChart({ trades }: { trades: Trade[] }) {
  const dailyData = useMemo(() => {
    if (!trades.length) return [];

    // Group trades by date and calculate daily PnL
    const dailyMap = new Map<string, number>();
    
    trades.forEach(trade => {
      const date = format(new Date(trade.dataHora), 'dd/MM');
      const result = parseFloat(trade.resultado || '0');
      dailyMap.set(date, (dailyMap.get(date) || 0) + result);
    });

    return Array.from(dailyMap.entries())
      .map(([date, pnl]) => ({ date, pnl }))
      .slice(-15); // Last 15 days
  }, [trades]);

  if (!dailyData.length) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-400">
        <div className="text-center">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">Sem dados</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={dailyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <XAxis 
          dataKey="date" 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
        />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1E293B',
            border: '1px solid #475569',
            borderRadius: '8px',
            fontSize: '12px'
          }}
          formatter={(value: any) => [`R$ ${value.toFixed(2)}`, 'PnL']}
        />
        <Bar 
          dataKey="pnl" 
          radius={[2, 2, 0, 0]}
        >
          {dailyData.map((entry, index) => (
            <Bar key={index} fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} dataKey="pnl" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Recent Trades Component
function RecentTrades({ trades }: { trades: Trade[] }) {
  const recentTrades = useMemo(() => {
    return [...trades]
      .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
      .slice(0, 8); // Last 8 trades
  }, [trades]);

  if (!recentTrades.length) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-400">
        <div className="text-center">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">Sem trades</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden">
      <div className="grid grid-cols-4 gap-2 text-xs text-zinc-400 mb-2 px-1">
        <div>Data</div>
        <div>Ativo</div>
        <div>Qtd</div>
        <div>PnL</div>
      </div>
      <div className="space-y-1 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent">
        {recentTrades.map((trade, index) => {
          const result = parseFloat(trade.resultado || '0');
          return (
            <div 
              key={trade.id} 
              className="grid grid-cols-4 gap-2 text-xs px-1 py-1 hover:bg-zinc-800/50 rounded transition-colors"
              data-testid={`recent-trade-${index}`}
            >
              <div className="text-zinc-300 truncate">
                {format(new Date(trade.dataHora), 'dd/MM')}
              </div>
              <div className="text-white truncate font-medium">
                {trade.ativo}
              </div>
              <div className="text-zinc-300">
                {parseFloat(trade.quantidade || '0').toFixed(0)}
              </div>
              <div className={`font-medium ${result >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {result >= 0 ? '+' : ''}R${result.toFixed(0)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DashboardProps {
  onMenuClick: () => void;
}

export default function Dashboard({ onMenuClick }: DashboardProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { startTour } = useTour();

  // Check if this is the user's first time on dashboard and should start tour
  useEffect(() => {
    const shouldStartTour = localStorage.getItem('should-start-tour');
    if (shouldStartTour === 'true') {
      // Remove the flag to avoid starting tour again
      localStorage.removeItem('should-start-tour');
      // Start tour after a short delay to ensure the page is fully loaded
      setTimeout(() => {
        startTour();
      }, 1000);
    }
  }, [startTour]);

  // Broker info with translations
  const brokerInfo = {
    forex: {
      name: t('broker.forex.name'),
      type: t('broker.forex.type'),
      color: "bg-blue-500",
      icon: TrendingUp,
      description: t('broker.forex.description'),
    },
    b3: {
      name: t('broker.b3.name'),
      type: t('broker.b3.type'),
      color: "bg-green-500",
      icon: BarChart3,
      description: t('broker.b3.description'),
    },
    crypto: {
      name: t('broker.crypto.name'),
      type: t('broker.crypto.type'),
      color: "bg-green-500",
      icon: Activity,
      description: t('broker.crypto.description'),
    },
  };

  // Get current user ID for isolation info
  const currentUserId = localStorage.getItem("user-id") || "default-user";

  // Estados para o sistema de filtros avançados
  const [selectedBrokerFilter, setSelectedBrokerFilter] = useState<
    string | null
  >(null);
  const [selectedCsvIds, setSelectedCsvIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"all" | "broker" | "csv">("all");
  const [editingCsv, setEditingCsv] = useState<{
    id: string;
    currentName: string;
  } | null>(null);
  const [newCsvName, setNewCsvName] = useState("");
  const [editingTrade, setEditingTrade] = useState<any>(null);
  const [showEditTradeDialog, setShowEditTradeDialog] = useState(false);

  // Fetch trades data
  const { data: trades = [], isLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
  });

  // Fetch trades by broker for broker analysis
  const { data: tradesByBroker = {} } = useQuery({
    queryKey: ["/api/trades/by-broker"],
  });

  // Fetch CSV imports
  const { data: csvImports = [] } = useQuery({
    queryKey: ["/api/csv-imports"],
  });

  // Filter manual trades
  const manualTrades = useMemo(() => {
    return trades.filter((trade: Trade) => trade.origem === 'manual');
  }, [trades]);

  // Mutation para renomear CSV
  const renameCsvMutation = useMutation({
    mutationFn: async ({
      csvId,
      displayName,
    }: {
      csvId: string;
      displayName: string;
    }) => {
      return apiRequest("PATCH", `/api/csv-imports/${csvId}/rename`, {
        displayName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/csv-imports"] });
      setEditingCsv(null);
      setNewCsvName("");
      toast({
        title: "CSV renomeado com sucesso",
        description: "O nome do arquivo foi atualizado.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao renomear",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar CSV
  const deleteCsvMutation = useMutation({
    mutationFn: async (csvId: string) => {
      return apiRequest("DELETE", `/api/csv-imports/${csvId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/csv-imports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades/by-broker"] });
      toast({
        title: "CSV excluído com sucesso",
        description:
          "O arquivo CSV e todos os trades relacionados foram removidos.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir o CSV",
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar trade manual
  const deleteManualTradeMutation = useMutation({
    mutationFn: async (tradeId: string) => {
      return apiRequest("DELETE", `/api/trades/${tradeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades/by-broker"] });
      toast({
        title: "Trade excluído com sucesso",
        description: "O trade manual foi removido permanentemente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir trade",
        description: error.message || "Não foi possível excluir o trade",
        variant: "destructive",
      });
    },
  });

  // Mutation para editar trade manual
  const editTradeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/trades/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades/by-broker"] });
      setShowEditTradeDialog(false);
      setEditingTrade(null);
      toast({
        title: "Trade atualizado com sucesso",
        description: "As alterações foram salvas.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao editar trade",
        description: error.message || "Não foi possível salvar as alterações",
        variant: "destructive",
      });
    },
  });

  // Lógica de filtragem avançada
  const filteredTrades = useMemo(() => {
    let filtered = [...trades];

    if (viewMode === "broker" && selectedBrokerFilter) {
      filtered = filtered.filter(
        (trade) => trade.corretora === selectedBrokerFilter,
      );
    }

    if (viewMode === "csv" && selectedCsvIds.length > 0) {
      // Filtrar por trades que vieram dos CSVs selecionados usando csvImportId
      filtered = filtered.filter(
        (trade) =>
          trade.csvImportId && selectedCsvIds.includes(trade.csvImportId),
      );
    }

    return filtered;
  }, [trades, viewMode, selectedBrokerFilter, selectedCsvIds, csvImports]);

  // Reset dashboard mutation
  const resetDashboardMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/trades/reset-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades/by-broker"] });
      queryClient.invalidateQueries({ queryKey: ["/api/csv-imports"] });
      toast({
        title: "Dashboard Completamente Resetada",
        description:
          "Todos os dados foram deletados: trades, importações CSV e configurações de API. Você pode começar do zero agora.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao resetar",
        description: "Não foi possível resetar a dashboard: " + error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Carregando dados...</p>
        </div>
      </div>
    );
  }

  // Calcular métricas com base nos trades filtrados
  const metrics = calculateMetrics(filteredTrades, t);

  // Funções para manipular CSVs
  const handleCsvToggle = (csvId: string) => {
    setSelectedCsvIds((prev) =>
      prev.includes(csvId)
        ? prev.filter((id) => id !== csvId)
        : [...prev, csvId],
    );
  };

  const handleSelectAllCsvs = () => {
    if (selectedCsvIds.length === (csvImports as any[]).length) {
      setSelectedCsvIds([]);
    } else {
      setSelectedCsvIds((csvImports as any[]).map((csv: any) => csv.id));
    }
  };


  return (
    <>
      <TopBar 
        title={t("nav.dashboard")} 
        onMenuClick={onMenuClick}
        showDashboardFilter={true}
        viewMode={viewMode}
        onViewModeChange={(mode) => {
          setViewMode(mode);
          if (mode !== "broker") setSelectedBrokerFilter(null);
          if (mode !== "csv") setSelectedCsvIds([]);
        }}
        selectedBrokerFilter={selectedBrokerFilter}
        onSelectedBrokerFilterChange={setSelectedBrokerFilter}
        selectedCsvIds={selectedCsvIds}
        onSelectedCsvIdsChange={setSelectedCsvIds}
        csvImports={Array.isArray(csvImports) ? csvImports : []}
        onCsvToggle={handleCsvToggle}
        onSelectAllCsvs={handleSelectAllCsvs}
      />
      <div data-testid="dashboard-overview" className="space-y-3 md:space-y-4 lg:space-y-6 p-3 md:p-4 lg:p-6 pb-6 md:pb-8">
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="flex flex-wrap gap-2">
          {/* Smart Reprocess Button */}
          {trades.length > 0 && (
            <SmartReprocessButton
              userId={currentUserId}
              onSuccess={() => {
                toast({
                  title: "Dados Atualizados",
                  description:
                    "Todos os dados foram reprocessados com interpretação inteligente.",
                });
              }}
            />
          )}
        </div>
      </div>


      <div className="space-y-4 md:space-y-6">
          {/* TradeZella-Style Dashboard - Top Row (Rectangular Cards) */}
          <div data-testid="metrics-cards" className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-4 mb-4">
            {/* Net PnL */}
            <Card className="bg-zinc-900/90 border-zinc-800 hover:bg-zinc-900/95 transition-colors" data-testid="card-net-pnl">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-xs text-zinc-400 font-medium">{t('metrics.net_pnl')}</div>
                  <DollarSign className="h-4 w-4 text-zinc-400" />
                </div>
                <div className={`text-2xl font-bold ${metrics.rentabilidadeTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  R$ {metrics.rentabilidadeTotal.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            {/* Trade Win % */}
            <Card className="bg-zinc-900/90 border-zinc-800 hover:bg-zinc-900/95 transition-colors" data-testid="card-trade-win">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-xs text-zinc-400 font-medium">{t('dashboard.win_rate')}</div>
                  <Target className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="flex items-center justify-center">
                  <CircularProgress 
                    percentage={metrics.taxaAcerto} 
                    size={50}
                    color={metrics.taxaAcerto >= 60 ? "#22c55e" : metrics.taxaAcerto >= 40 ? "#f59e0b" : "#ef4444"}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Profit Factor */}
            <Card className="bg-zinc-900/90 border-zinc-800 hover:bg-zinc-900/95 transition-colors" data-testid="card-profit-factor">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-xs text-zinc-400 font-medium">{t('metrics.profit_factor')}</div>
                  <TrendingUp className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="flex items-center justify-center">
                  {(() => {
                    const winners = filteredTrades.filter(t => parseFloat(t.resultado || '0') > 0);
                    const losers = filteredTrades.filter(t => parseFloat(t.resultado || '0') < 0);
                    const totalProfit = winners.reduce((sum, t) => sum + parseFloat(t.resultado || '0'), 0);
                    const totalLoss = Math.abs(losers.reduce((sum, t) => sum + parseFloat(t.resultado || '0'), 0));
                    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;
                    return (
                      <CircularProgress 
                        percentage={Math.min(profitFactor * 20, 100)} 
                        size={50}
                        color={profitFactor >= 2 ? "#22c55e" : profitFactor >= 1 ? "#f59e0b" : "#ef4444"}
                      />
                    );
                  })()}
                </div>
                <div className="text-center mt-1">
                  <div className="text-xs text-zinc-400">
                    {(() => {
                      const winners = filteredTrades.filter(t => parseFloat(t.resultado || '0') > 0);
                      const losers = filteredTrades.filter(t => parseFloat(t.resultado || '0') < 0);
                      const totalProfit = winners.reduce((sum, t) => sum + parseFloat(t.resultado || '0'), 0);
                      const totalLoss = Math.abs(losers.reduce((sum, t) => sum + parseFloat(t.resultado || '0'), 0));
                      const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;
                      return profitFactor.toFixed(2);
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Day Win % */}
            <Card className="bg-zinc-900/90 border-zinc-800 hover:bg-zinc-900/95 transition-colors" data-testid="card-day-win">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-xs text-zinc-400 font-medium">{t('metrics.day_win_rate')}</div>
                  <Calendar className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="flex items-center justify-center">
                  {(() => {
                    // Calculate day win percentage
                    const dailyMap = new Map<string, number>();
                    filteredTrades.forEach(trade => {
                      const date = format(new Date(trade.dataHora), 'yyyy-MM-dd');
                      const result = parseFloat(trade.resultado || '0');
                      dailyMap.set(date, (dailyMap.get(date) || 0) + result);
                    });
                    const totalDays = dailyMap.size;
                    const winningDays = Array.from(dailyMap.values()).filter(pnl => pnl > 0).length;
                    const dayWinRate = totalDays > 0 ? (winningDays / totalDays) * 100 : 0;
                    return (
                      <CircularProgress 
                        percentage={dayWinRate} 
                        size={50}
                        color={dayWinRate >= 60 ? "#22c55e" : dayWinRate >= 40 ? "#f59e0b" : "#ef4444"}
                      />
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* RR Médio */}
            <Card className="bg-zinc-900/90 border-zinc-800 hover:bg-zinc-900/95 transition-colors" data-testid="card-avg-rr">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-xs text-zinc-400 font-medium">{t('dashboard.avg_rr')}</div>
                  <TrendingUp className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {metrics.riscoRetornoMedio.toFixed(2)}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {t('metrics.risk_reward')}
                </div>
              </CardContent>
            </Card>

            {/* Average Win/Loss */}
            <Card className="bg-zinc-900/90 border-zinc-800 hover:bg-zinc-900/95 transition-colors" data-testid="card-avg-win-loss">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-xs text-zinc-400 font-medium">{t('metrics.avg_win_loss')}</div>
                  <Activity className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="text-lg font-bold text-green-400">
                  R$ {(() => {
                    const avgWin = filteredTrades.filter(t => parseFloat(t.resultado || '0') > 0)
                      .reduce((sum, t, _, arr) => sum + parseFloat(t.resultado || '0') / arr.length, 0);
                    return avgWin.toFixed(0);
                  })()}
                </div>
                <div className="text-sm font-semibold text-red-400">
                  -R$ {(() => {
                    const avgLoss = Math.abs(filteredTrades.filter(t => parseFloat(t.resultado || '0') < 0)
                      .reduce((sum, t, _, arr) => sum + parseFloat(t.resultado || '0') / arr.length, 0));
                    return avgLoss.toFixed(0);
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row - Square Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
            {/* Progress Tracker - Expanded */}
            <SquareCard
              title={t('metrics.progress_tracker')}
              value=""
              icon={Calendar}
              color="text-blue-400"
              className="lg:col-span-2"
              data-testid="card-progress-tracker"
            >
              <div className="h-full flex flex-col">
                <div className="flex-1">
                  <TradingCalendar trades={filteredTrades} />
                </div>
                
                {/* Análise Temporal Detalhada - no espaço vazio abaixo do calendário */}
                <div className="mt-4 pt-4 border-t border-zinc-700">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    <div className="text-center p-2 bg-zinc-800/50 rounded-lg">
                      <div className="text-lg font-bold text-white mb-1">
                        {(() => {
                          const hoje = new Date();
                          const tradesHoje = filteredTrades.filter((t: Trade) => {
                            const tradeDate = new Date(t.dataHora);
                            return tradeDate.toDateString() === hoje.toDateString();
                          });
                          return tradesHoje.length;
                        })()}
                      </div>
                      <div className="text-xs text-zinc-400 mb-1">
                        {t('time.trades_today')}
                      </div>
                      <div
                        className={`text-xs font-semibold ${(() => {
                          const hoje = new Date();
                          const resultadoHoje = filteredTrades
                            .filter((t: Trade) => {
                              const tradeDate = new Date(t.dataHora);
                              return (
                                tradeDate.toDateString() === hoje.toDateString()
                              );
                            })
                            .reduce(
                              (sum: number, t: Trade) =>
                                sum + parseFloat(t.resultado || "0"),
                              0,
                            );
                          return resultadoHoje >= 0
                            ? "text-green-400"
                            : "text-red-400";
                        })()}`}
                      >
                        R${" "}
                        {(() => {
                          const hoje = new Date();
                          const resultadoHoje = filteredTrades
                            .filter((t: Trade) => {
                              const tradeDate = new Date(t.dataHora);
                              return (
                                tradeDate.toDateString() === hoje.toDateString()
                              );
                            })
                            .reduce(
                              (sum: number, t: Trade) =>
                                sum + parseFloat(t.resultado || "0"),
                              0,
                            );
                          return resultadoHoje.toFixed(2);
                        })()}
                      </div>
                    </div>

                    <div className="text-center p-2 bg-zinc-800/50 rounded-lg">
                      <div className="text-lg font-bold text-white mb-1">
                        {metrics.rentabilidadeSemana.toFixed(2)}
                      </div>
                      <div className="text-xs text-zinc-400 mb-1">
                        Esta Semana
                      </div>
                      <div
                        className={`text-xs font-semibold ${metrics.rentabilidadeSemana >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        R$ {metrics.rentabilidadeSemana.toFixed(2)}
                      </div>
                    </div>

                    <div className="text-center p-2 bg-zinc-800/50 rounded-lg">
                      <div className="text-lg font-bold text-white mb-1">
                        {metrics.rentabilidadeMes.toFixed(2)}
                      </div>
                      <div className="text-xs text-zinc-400 mb-1">
                        Este Mês
                      </div>
                      <div
                        className={`text-xs font-semibold ${metrics.rentabilidadeMes >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        R$ {metrics.rentabilidadeMes.toFixed(2)}
                      </div>
                    </div>

                    <div className="text-center p-2 bg-zinc-800/50 rounded-lg">
                      <div className="text-lg font-bold text-white mb-1">
                        {metrics.rentabilidadeAno.toFixed(2)}
                      </div>
                      <div className="text-xs text-zinc-400 mb-1">
                        Este Ano
                      </div>
                      <div
                        className={`text-xs font-semibold ${metrics.rentabilidadeAno >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        R$ {metrics.rentabilidadeAno.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SquareCard>

            {/* Right Column - Net Daily PnL Chart and Recent Trades */}
            <div className="grid grid-cols-1 gap-3 md:gap-4">
              {/* Net Daily PnL Chart */}
              <SquareCard
                title={t('metrics.daily_net_pnl')}
                value=""
                icon={BarChart3}
                color="text-green-400"
                data-testid="card-daily-pnl-chart"
              >
                <div className="h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(() => {
                        // Calculate daily net PnL data
                        const dailyMap = new Map<string, number>();
                        filteredTrades.forEach(trade => {
                          const date = format(new Date(trade.dataHora), 'MM/dd');
                          const result = parseFloat(trade.resultado || '0');
                          dailyMap.set(date, (dailyMap.get(date) || 0) + result);
                        });
                        return Array.from(dailyMap.entries())
                          .sort(([a], [b]) => new Date(`2024/${a}`).getTime() - new Date(`2024/${b}`).getTime())
                          .slice(-14) // Last 14 days
                          .map(([date, pnl]) => ({ date, pnl }));
                      })()}
                      margin={{ top: 8, right: 8, left: 8, bottom: 20 }}
                    >
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={40}
                      />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#27272a',
                          border: '1px solid #3f3f46',
                          borderRadius: '6px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'PnL']}
                        labelStyle={{ color: '#d4d4d8' }}
                      />
                      <Bar 
                        dataKey="pnl" 
                        radius={[2, 2, 0, 0]}
                      >
                        {(() => {
                          const dailyMap = new Map<string, number>();
                          filteredTrades.forEach(trade => {
                            const date = format(new Date(trade.dataHora), 'MM/dd');
                            const result = parseFloat(trade.resultado || '0');
                            dailyMap.set(date, (dailyMap.get(date) || 0) + result);
                          });
                          return Array.from(dailyMap.entries())
                            .sort(([a], [b]) => new Date(`2024/${a}`).getTime() - new Date(`2024/${b}`).getTime())
                            .slice(-14)
                            .map(([date, pnl], index) => (
                              <Cell key={index} fill={pnl >= 0 ? '#22c55e' : '#ef4444'} />
                            ));
                        })()}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SquareCard>

              {/* Recent Trades - Below Net Daily PnL */}
              <SquareCard
                title={t('dashboard.recent_trades')}
                value=""
                icon={FileText}
                color="text-zinc-400"
                data-testid="card-recent-trades"
              >
                <div className="h-full">
                  <RecentTrades trades={filteredTrades} />
                </div>
              </SquareCard>
            </div>
          </div>

          {/* Performance Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
            <Card className="bg-zinc-900/90 border-zinc-800 hover:bg-zinc-900/95 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm">{t('dashboard.best_trade')}</p>
                    <p className="text-2xl font-bold text-green-400">
                      R$ {metrics.melhorTrade.toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>


            <Card className="bg-zinc-900/90 border-zinc-800 hover:bg-zinc-900/95 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm">{t('dashboard.frequent_emotion')}</p>
                    <p className="text-lg font-bold text-white">
                      {(metrics.emocaoMaisRecorrente.emocao || t('emotion.neutral')).charAt(0).toUpperCase() + (metrics.emocaoMaisRecorrente.emocao || t('emotion.neutral')).slice(1)}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {metrics.emocaoMaisRecorrente.count} {t('time.times')}
                    </p>
                  </div>
                  <div className="h-8 w-8"></div>
                </div>
              </CardContent>
            </Card>
            
            
          </div>

          {/* Performance por Período - Gráfico com Métricas Laterais */}
          <Card className="bg-zinc-900/90 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">
                {t('dashboard.performance_chart')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {/* Métricas Resumidas - Estas serão atualizadas dinamicamente pelo componente do gráfico */}
              <div className="mb-4 flex justify-end" id="performance-metrics-container">
                {/* Placeholder - será preenchido pelo PerformancePeriodChart */}
              </div>

              {/* Gráfico - Área Principal */}
              <div className="w-full">
                <PerformancePeriodChart trades={filteredTrades} t={t} />
              </div>
            </CardContent>
          </Card>



          {/* Gráfico de Rentabilidade e Análise de Volume */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* {t('metrics.profitability_chart')} */}
            <Card className="bg-zinc-900/90 border-zinc-800 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-zinc-400" />
                  {t('dashboard.capital_curve')}
                </CardTitle>
              </CardHeader>
              <CapitalCurveChart trades={filteredTrades} t={t} />
            </Card>
          </div>
      </div>

      {/* Dialog de Edição de Trade Manual */}
      <Dialog open={showEditTradeDialog} onOpenChange={setShowEditTradeDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader className="relative">
            <button
              onClick={() => {
                setShowEditTradeDialog(false);
                setEditingTrade(null);
              }}
              className="absolute right-0 top-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 h-6 w-6 flex items-center justify-center"
              data-testid="button-close-dialog"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
            <DialogTitle>{t('trades.edit_manual_trade')}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {t('trades.edit_trade_description')}
            </DialogDescription>
          </DialogHeader>
          {editingTrade && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-ativo">{t('trades.asset')}</Label>
                <Input
                  id="edit-ativo"
                  value={editingTrade.ativo || ''}
                  onChange={(e) => setEditingTrade({...editingTrade, ativo: e.target.value})}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-tipo">{t('trades.type')}</Label>
                <Select 
                  value={editingTrade.tipo || ''} 
                  onValueChange={(value) => setEditingTrade({...editingTrade, tipo: value})}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="compra" className="text-white">Compra</SelectItem>
                    <SelectItem value="venda" className="text-white">Venda</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-resultado">{t('metrics.result')} (R$)</Label>
                <Input
                  id="edit-resultado"
                  type="number"
                  step="0.01"
                  value={editingTrade.resultado || ''}
                  onChange={(e) => setEditingTrade({...editingTrade, resultado: e.target.value})}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-quantidade">{t('trades.quantity')}</Label>
                <Input
                  id="edit-quantidade"
                  type="number"
                  step="0.01"
                  value={editingTrade.quantidade || ''}
                  onChange={(e) => setEditingTrade({...editingTrade, quantidade: e.target.value})}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditTradeDialog(false);
                setEditingTrade(null);
              }}
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => {
                if (editingTrade) {
                  editTradeMutation.mutate({
                    id: editingTrade.id,
                    data: {
                      ativo: editingTrade.ativo,
                      tipo: editingTrade.tipo,
                      resultado: parseFloat(editingTrade.resultado || '0'),
                      quantidade: parseFloat(editingTrade.quantidade || '0'),
                    }
                  });
                }
              }}
              disabled={editTradeMutation.isPending}
              className="bg-white text-black hover:bg-gray-200"
            >
              {editTradeMutation.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}
