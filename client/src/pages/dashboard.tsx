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
} from "recharts";
import { type Trade } from "@shared/schema";
import { TradingCalendar } from "@/components/ui/trading-calendar";
import { SmartReprocessButton } from "@/components/SmartReprocessButton";
import { useLanguage } from "@/contexts/LanguageContext";
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

  return (
    <div data-testid="performance-chart" className="w-full">
      {/* Filtros de Período */}
      <div className="flex justify-center gap-1 md:gap-2 mb-4 md:mb-6 flex-wrap">
        {[
          { key: "week", label: t('time.7_days') },
          { key: "month", label: t('chart.all_months') },
          { key: "year", label: t('time.1_year') },
          { key: "specific-month", label: t('chart.specific_month') },
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
      </div>

      {/* Seletor de Mês Específico e Range de Dias */}
      {selectedPeriod === "specific-month" && (
        <div className="space-y-4 mb-4 md:mb-6">
          {/* Seletor de Mês */}
          <div className="flex justify-center">
            <Select value={selectedMonth} onValueChange={(value) => {
              setSelectedMonth(value);
              // Reset day range when month changes
              const [year, month] = value.split('-');
              const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
              setSelectedStartDay(1);
              setSelectedEndDay(lastDay);
            }}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white w-36 md:w-48 text-sm">
                <SelectValue placeholder={t('placeholder.select_month')} />
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
                    const label = format(date, "MMMM yyyy", { locale: ptBR });
                    months.push({ value, label });
                  }

                  return months.map((month) => (
                    <SelectItem
                      key={month.value}
                      value={month.value}
                      className="text-white hover:bg-zinc-700 text-sm"
                    >
                      {month.label}
                    </SelectItem>
                  ));
                })()}
              </SelectContent>
            </Select>
          </div>
          
          {/* Seletor de Range de Dias */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-zinc-300">Do dia</span>
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
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white w-16 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 max-h-40">
                  {(() => {
                    const [year, month] = selectedMonth.split('-');
                    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                    const days = [];
                    for (let i = 1; i <= lastDay; i++) {
                      days.push(
                        <SelectItem key={i} value={i.toString()} className="text-white hover:bg-zinc-700 text-sm">
                          {i}
                        </SelectItem>
                      );
                    }
                    return days;
                  })()}
                </SelectContent>
              </Select>
              
              <span className="text-zinc-300">ao dia</span>
              
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
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white w-16 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 max-h-40">
                  {(() => {
                    const [year, month] = selectedMonth.split('-');
                    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                    const days = [];
                    for (let i = 1; i <= lastDay; i++) {
                      days.push(
                        <SelectItem key={i} value={i.toString()} className="text-white hover:bg-zinc-700 text-sm">
                          {i}
                        </SelectItem>
                      );
                    }
                    return days;
                  })()}
                </SelectContent>
              </Select>
              
              <div className="text-xs text-zinc-400 ml-2">
                {(() => {
                  const [year, month] = selectedMonth.split('-');
                  const startDate = new Date(parseInt(year), parseInt(month) - 1, selectedStartDay);
                  const endDate = new Date(parseInt(year), parseInt(month) - 1, selectedEndDay);
                  const dayCount = Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1;
                  return `(${dayCount} dia${dayCount !== 1 ? 's' : ''})`;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {chartData.length === 0 ? (
        <div className="h-[550px] md:h-[380px] flex items-center justify-center text-zinc-400">
          <div className="text-center">
            <BarChart3 className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">{t('empty.no_trades_period')}</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <ResponsiveContainer
            width="100%"
            height={300}
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

      {/* Resumo abaixo do gráfico */}
      {chartData.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="text-center p-3 md:p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 min-w-0">
            <div className="text-xs text-zinc-400 mb-1">{t('metrics.total_profits')}</div>
            <div className="text-sm md:text-xl font-bold text-green-400 truncate">
              R${" "}
              {window.innerWidth < 768
                ? chartData
                    .reduce((sum, d) => sum + d.positive, 0)
                    .toLocaleString("pt-BR", { maximumFractionDigits: 0 })
                : chartData
                    .reduce((sum, d) => sum + d.positive, 0)
                    .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              {chartData.reduce((sum, d) => sum + d.positiveCount, 0)} trades
            </div>
          </div>

          <div className="text-center p-3 md:p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 min-w-0">
            <div className="text-xs text-zinc-400 mb-1">{t('metrics.total_losses')}</div>
            <div className="text-sm md:text-xl font-bold text-red-400 truncate">
              -R${" "}
              {window.innerWidth < 768
                ? chartData
                    .reduce((sum, d) => sum + d.negative, 0)
                    .toLocaleString("pt-BR", { maximumFractionDigits: 0 })
                : chartData
                    .reduce((sum, d) => sum + d.negative, 0)
                    .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              {chartData.reduce((sum, d) => sum + d.negativeCount, 0)} trades
            </div>
          </div>

          <div className="text-center p-3 md:p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 min-w-0">
            <div className="text-xs text-zinc-400 mb-1">{t('metrics.period_result_short')}</div>
            <div
              className={`text-sm md:text-xl font-bold truncate ${chartData[chartData.length - 1]?.accumulated >= 0 ? "text-green-400" : "text-red-400"}`}
            >
              R${" "}
              {window.innerWidth < 768
                ? chartData[chartData.length - 1]?.accumulated.toLocaleString(
                    "pt-BR",
                    { maximumFractionDigits: 0 },
                  )
                : chartData[chartData.length - 1]?.accumulated.toLocaleString(
                    "pt-BR",
                    { minimumFractionDigits: 2 },
                  )}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              {(
                (chartData.reduce((sum, d) => sum + d.positiveCount, 0) /
                  chartData.reduce((sum, d) => sum + d.totalCount, 0)) *
                100
              ).toFixed(1)}
              % acerto
            </div>
          </div>

          <div className="text-center p-3 md:p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 min-w-0">
            <div className="text-xs text-zinc-400 mb-1">Média por Dia</div>
            <div
              className={`text-sm md:text-xl font-bold truncate ${chartData[chartData.length - 1]?.accumulated / chartData.length >= 0 ? "text-blue-400" : "text-orange-400"}`}
            >
              R${" "}
              {window.innerWidth < 768
                ? (
                    chartData[chartData.length - 1]?.accumulated /
                      chartData.length || 0
                  ).toLocaleString("pt-BR", { maximumFractionDigits: 0 })
                : (
                    chartData[chartData.length - 1]?.accumulated /
                      chartData.length || 0
                  ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              {chartData.length} períodos
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

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: any;
  color?: string;
  subtitle?: string;
}

function MetricCard({
  title,
  value,
  icon: Icon,
  color = "text-white",
  subtitle,
}: MetricCardProps) {
  return (
    <Card className="bg-zinc-900/90 border-zinc-800 hover:bg-zinc-900/95 transition-colors min-w-0">
      <CardHeader className="pb-3 md:pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm md:text-sm font-medium text-zinc-400 pr-2">
            {title}
          </CardTitle>
          <Icon
            className={`h-5 w-5 md:h-4 md:w-4 flex-shrink-0 ${color || "text-zinc-400"}`}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4 md:pb-4">
        <div
          className={`text-lg md:text-2xl font-bold ${color} break-words leading-tight`}
        >
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-zinc-500 mt-2 block">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
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

  // Componente de Filtros Avançados
  const AdvancedFilters = () => {
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

    const startRenaming = (csv: any) => {
      setEditingCsv({
        id: csv.id,
        currentName: csv.displayName || csv.fileName,
      });
      setNewCsvName(csv.displayName || csv.fileName);
    };

    const handleRename = () => {
      if (editingCsv && newCsvName.trim()) {
        renameCsvMutation.mutate({
          csvId: editingCsv.id,
          displayName: newCsvName.trim(),
        });
      }
    };

    return (
      <Card className="bg-transparent border-transparent mb-2">
        <CardContent className="p-2">
          <div className="max-w-xs">
            {/* Dropdown de Visualização */}
            <div className="space-y-1">
              <Select
                value={viewMode}
                onValueChange={(value: "all" | "broker" | "csv") => {
                  setViewMode(value);
                  if (value !== "broker") setSelectedBrokerFilter(null);
                  if (value !== "csv") setSelectedCsvIds([]);
                }}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm">
                  <SelectValue placeholder={t('placeholder.select_view_mode')} />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem
                    value="all"
                    className="text-white hover:bg-zinc-700"
                  >
                    {t('filter.consolidate_all_data')}
                  </SelectItem>
                  <SelectItem
                    value="broker"
                    className="text-white hover:bg-zinc-700"
                  >
                    {t('filter.filter_by_market')}
                  </SelectItem>
                  <SelectItem
                    value="csv"
                    className="text-white hover:bg-zinc-700"
                  >
                    {t('filter.filter_by_csv')}
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Dropdown de Corretoras */}
              {viewMode === "broker" && (
                <div className="space-y-1">
                  <Select
                    value={selectedBrokerFilter || ""}
                    onValueChange={setSelectedBrokerFilter}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm">
                      <SelectValue placeholder={t('placeholder.select_market')} />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem
                        value="b3"
                        className="text-white hover:bg-zinc-700"
                      >
                        B3 - Ações Brasileiras
                      </SelectItem>
                      <SelectItem
                        value="crypto"
                        className="text-white hover:bg-zinc-700"
                      >
                        Crypto - Criptomoedas
                      </SelectItem>
                      <SelectItem
                        value="forex"
                        className="text-white hover:bg-zinc-700"
                      >
                        Forex - Câmbio
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Seletor de CSVs */}
              {viewMode === "csv" && (
                <div className="space-y-1">
                  {(csvImports as any[]).length === 0 ? (
                    <div className="text-center py-2 text-zinc-500">
                      <p className="text-xs">Nenhum CSV importado ainda</p>
                    </div>
                  ) : (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between bg-zinc-800 border-zinc-700 text-white h-8 text-sm hover:bg-zinc-700"
                        >
                          <span className="text-xs">
                            {selectedCsvIds.length === 0
                              ? "Selecionar CSVs"
                              : selectedCsvIds.length === (csvImports as any[]).length
                              ? "Todos os CSVs"
                              : `${selectedCsvIds.length} CSV${selectedCsvIds.length > 1 ? "s" : ""} selecionado${selectedCsvIds.length > 1 ? "s" : ""}`}
                          </span>
                          <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0 bg-zinc-900 border-zinc-700">
                        <div className="p-2">
                          <div className="flex items-center justify-between p-2 border-b border-zinc-700">
                            <span className="text-sm font-medium text-white">
                              Selecionar CSVs
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleSelectAllCsvs}
                              className="text-zinc-400 hover:text-white text-xs h-6 px-2"
                            >
                              {selectedCsvIds.length === (csvImports as any[]).length
                                ? "Desmarcar Todos"
                                : "Selecionar Todos"}
                            </Button>
                          </div>
                          <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800">
                            {(csvImports as any[]).map((csv: any) => (
                              <div
                                key={csv.id}
                                className="flex items-center space-x-2 p-2 hover:bg-zinc-800/50 transition-colors cursor-pointer"
                                onClick={() => handleCsvToggle(csv.id)}
                              >
                                <Checkbox
                                  checked={selectedCsvIds.includes(csv.id)}
                                  onCheckedChange={() => handleCsvToggle(csv.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="border-zinc-600 h-3 w-3"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-medium text-xs truncate">
                                    {csv.displayName || csv.fileName}
                                  </p>
                                  <p className="text-zinc-400 text-xs">
                                    {csv.tradesImported} trades
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          {selectedCsvIds.length > 0 && (
                            <div className="mt-2 p-2 bg-green-900/20 border border-green-700/50 rounded text-center">
                              <p className="text-green-400 text-xs font-medium">
                                ✓ {selectedCsvIds.length} CSV
                                {selectedCsvIds.length > 1 ? "s" : ""} selecionado
                                {selectedCsvIds.length > 1 ? "s" : ""}
                              </p>
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
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

      {/* Componente de Filtros Avançados */}
      <AdvancedFilters />

      <Tabs defaultValue="overview" className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-zinc-900/90 border border-zinc-800 rounded-lg p-1 gap-1 h-auto">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:border data-[state=active]:border-zinc-700 text-zinc-400 data-[state=active]:text-white text-xs md:text-sm py-3 px-2 md:px-3 rounded-md transition-all duration-200 hover:text-white hover:bg-zinc-800/50"
          >
            <span className="hidden sm:inline">{t('dashboard.overview')}</span>
            <span className="sm:hidden">Geral</span>
          </TabsTrigger>
          <TabsTrigger
            value="imports"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:border data-[state=active]:border-zinc-700 text-zinc-400 data-[state=active]:text-white text-xs md:text-sm py-3 px-2 md:px-3 rounded-md transition-all duration-200 hover:text-white hover:bg-zinc-800/50"
          >
            <span className="hidden sm:inline">{t('tabs.imports')}</span>
            <span className="sm:hidden">Import</span>
          </TabsTrigger>
          <TabsTrigger
            value="consolidated"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:border data-[state=active]:border-zinc-700 text-zinc-400 data-[state=active]:text-white text-xs md:text-sm py-3 px-2 md:px-3 rounded-md transition-all duration-200 hover:text-white hover:bg-zinc-800/50"
          >
            <span className="hidden sm:inline">{t('tabs.consolidated')}</span>
            <span className="sm:hidden">Consol</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 md:space-y-6">
          {/* Main Metrics Overview */}
          <div data-testid="metrics-cards" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title={t('metrics.total_profitability')}
              value={`R$ ${metrics.rentabilidadeTotal.toFixed(2)}`}
              icon={DollarSign}
              color={
                metrics.rentabilidadeTotal >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }
              subtitle={t('metrics.general_result')}
            />

            <MetricCard
              title={t('dashboard.total_trades')}
              value={metrics.totalTrades}
              icon={BarChart3}
              color="text-zinc-300"
              subtitle={t('metrics.operations_performed')}
            />

            <MetricCard
              title={t('dashboard.win_rate')}
              value={`${metrics.taxaAcerto.toFixed(1)}%`}
              icon={Target}
              color="text-white"
              subtitle={t('metrics.operations_precision')}
            />

            <MetricCard
              title={t('dashboard.avg_rr')}
              value={`${metrics.riscoRetornoMedio.toFixed(2)}`}
              icon={TrendingUp}
              color="text-white"
              subtitle={t('metrics.risk_vs_return')}
            />
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

          {/* Performance por Período - Gráfico Visual */}
          <Card className="bg-zinc-900/90 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">
                {t('dashboard.performance_chart')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pl-0 pr-2 md:px-6">
              <PerformancePeriodChart trades={filteredTrades} t={t} />
            </CardContent>
          </Card>

          {/* Distribuição por Mercado */}
          <Card className="bg-zinc-900/90 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-400" />
                {t('dashboard.market_distribution')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(brokerInfo).map(([broker, info]) => {
                  const brokerTrades = filteredTrades.filter(
                    (t: Trade) => t.corretora === broker,
                  );
                  const brokerResult = brokerTrades.reduce(
                    (sum: number, t: Trade) =>
                      sum + parseFloat(t.resultado || "0"),
                    0,
                  );
                  const percentage =
                    filteredTrades.length > 0
                      ? (brokerTrades.length / filteredTrades.length) * 100
                      : 0;

                  return (
                    <div
                      key={broker}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${info.color}`}
                        ></div>
                        <span className="text-slate-300">{info.name}</span>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-semibold ${brokerResult >= 0 ? "text-green-400" : "text-red-400"}`}
                        >
                          R$ {brokerResult.toFixed(2)}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {brokerTrades.length} trades ({percentage.toFixed(1)}
                          %)
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Trading Calendar */}
          <div className="relative">
            <TradingCalendar trades={filteredTrades} />
            
            {/* Logo watermark grande no centro do calendário */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="opacity-[0.05] hover:opacity-[0.12] transition-opacity duration-300 flex items-center justify-center w-full h-full">
                <img 
                  src={metrikaLogo} 
                  alt="METRIKA" 
                  style={{
                    height: '800px',
                    width: 'auto',
                    objectFit: 'contain',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="block"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Main Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title={t('metrics.total_profitability')}
              value={`R$ ${metrics.rentabilidadeTotal.toFixed(2)}`}
              icon={DollarSign}
              color={
                metrics.rentabilidadeTotal >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }
            />

            <MetricCard
              title={t('dashboard.total_trades')}
              value={metrics.totalTrades}
              icon={BarChart3}
              color="text-zinc-300"
            />

            <MetricCard
              title={t('dashboard.win_rate')}
              value={`${metrics.taxaAcerto.toFixed(1)}%`}
              icon={Target}
              color={
                metrics.taxaAcerto >= 50 ? "text-green-400" : "text-red-400"
              }
            />

            <MetricCard
              title={t('dashboard.avg_rr')}
              value={`${metrics.riscoRetornoMedio.toFixed(2)}:1`}
              icon={TrendingUp}
              color={
                metrics.riscoRetornoMedio >= 2 ? "text-green-400" : "text-white"
              }
            />
          </div>

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

          {/* Análise Temporal Detalhada */}
          <Card className="bg-zinc-900/90 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-sm md:text-base">
                {t('dashboard.detailed_temporal_performance')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                <div className="text-center p-2 md:p-4 bg-zinc-800/50 rounded-lg">
                  <div className="text-lg md:text-2xl font-bold text-white mb-1">
                    {(() => {
                      const hoje = new Date();
                      const tradesHoje = filteredTrades.filter((t: Trade) => {
                        const tradeDate = new Date(t.dataHora);
                        return tradeDate.toDateString() === hoje.toDateString();
                      });
                      return tradesHoje.length;
                    })()}
                  </div>
                  <div className="text-xs text-zinc-400 mb-1 md:mb-2">
                    {t('time.trades_today')}
                  </div>
                  <div
                    className={`text-xs md:text-sm font-semibold ${(() => {
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

                <div className="text-center p-2 md:p-4 bg-zinc-800/50 rounded-lg">
                  <div className="text-lg md:text-2xl font-bold text-white mb-1">
                    {metrics.rentabilidadeSemana.toFixed(2)}
                  </div>
                  <div className="text-xs text-zinc-400 mb-1 md:mb-2">
                    Esta Semana
                  </div>
                  <div
                    className={`text-xs md:text-sm font-semibold ${metrics.rentabilidadeSemana >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    R$ {metrics.rentabilidadeSemana.toFixed(2)}
                  </div>
                </div>

                <div className="text-center p-2 md:p-4 bg-zinc-800/50 rounded-lg">
                  <div className="text-lg md:text-2xl font-bold text-white mb-1">
                    {metrics.rentabilidadeMes.toFixed(2)}
                  </div>
                  <div className="text-xs text-zinc-400 mb-1 md:mb-2">
                    Este Mês
                  </div>
                  <div
                    className={`text-xs md:text-sm font-semibold ${metrics.rentabilidadeMes >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    R$ {metrics.rentabilidadeMes.toFixed(2)}
                  </div>
                </div>

                <div className="text-center p-2 md:p-4 bg-zinc-800/50 rounded-lg">
                  <div className="text-lg md:text-2xl font-bold text-white mb-1">
                    {metrics.rentabilidadeAno.toFixed(2)}
                  </div>
                  <div className="text-xs text-zinc-400 mb-1 md:mb-2">
                    Este Ano
                  </div>
                  <div
                    className={`text-xs md:text-sm font-semibold ${metrics.rentabilidadeAno >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    R$ {metrics.rentabilidadeAno.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imports" className="space-y-4">
          <Card className="bg-zinc-900/90 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">
                {t('dashboard.imports_and_trades')}
              </CardTitle>
              <CardDescription>
                {t('imports.manage_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="csv-imports" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-zinc-900/90 border border-zinc-800 rounded-lg p-0.5 sm:p-1 gap-0.5 sm:gap-1">
                  <TabsTrigger 
                    value="csv-imports" 
                    className="data-[state=active]:bg-zinc-800 data-[state=active]:border data-[state=active]:border-zinc-700 text-zinc-400 data-[state=active]:text-white py-1.5 sm:py-2 md:py-3 px-1.5 sm:px-2 md:px-3 rounded-md transition-all duration-200 hover:text-white hover:bg-zinc-800/50 text-xs md:text-sm font-medium min-h-[36px] sm:min-h-[40px] md:min-h-[44px] flex items-center justify-center"
                  >
                    <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1 sm:mr-1.5 md:mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline truncate">{t('imports.csv_imported')}</span>
                    <span className="sm:hidden text-[11px] sm:text-xs font-semibold">CSV</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="manual-trades" 
                    className="data-[state=active]:bg-zinc-800 data-[state=active]:border data-[state=active]:border-zinc-700 text-zinc-400 data-[state=active]:text-white py-1.5 sm:py-2 md:py-3 px-1.5 sm:px-2 md:px-3 rounded-md transition-all duration-200 hover:text-white hover:bg-zinc-800/50 text-xs md:text-sm font-medium min-h-[36px] sm:min-h-[40px] md:min-h-[44px] flex items-center justify-center"
                  >
                    <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1 sm:mr-1.5 md:mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline truncate">{t('imports.manual_trades')}</span>
                    <span className="sm:hidden text-[11px] sm:text-xs font-semibold">Manual</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="csv-imports" className="space-y-4 mt-6">
                  {(csvImports as any[]).length === 0 ? (
                    <div className="text-center py-8 text-zinc-400">
                      {t('empty.no_csv_imports')}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(csvImports as any[]).map((importItem: any) => (
                        <div
                          key={importItem.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 md:p-4 bg-zinc-800/50 rounded-lg space-y-3 sm:space-y-0"
                        >
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div
                              className={`w-3 h-3 rounded-full flex-shrink-0 ${importItem.status === "completed" ? "bg-green-500" : "bg-yellow-500"}`}
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
                                  className="h-7 w-7 p-0 text-red-400 hover:text-red-300 border-red-400 hover:border-red-300 flex items-center justify-center"
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
                </TabsContent>

                <TabsContent value="manual-trades" className="space-y-4 mt-6">
                  {manualTrades.length === 0 ? (
                    <div className="text-center py-8 text-zinc-400">
                      {t('empty.no_manual_trades')}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {manualTrades.map((trade: any) => (
                        <div
                          key={trade.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 md:p-4 bg-zinc-800/50 rounded-lg space-y-3 sm:space-y-0"
                        >
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div
                              className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                parseFloat(trade.resultado || "0") >= 0 ? "bg-green-500" : "bg-red-500"
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
                                parseFloat(trade.resultado || "0") >= 0 ? "text-green-400" : "text-red-400"
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
                                className="h-7 w-7 p-0 text-red-400 hover:text-red-300 border-red-400 hover:border-red-300 flex items-center justify-center"
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
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consolidated" className="space-y-6">
          {/* {t('consolidated.summary')} */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title={t('dashboard.consolidated_total')}
              value={`R$ ${metrics.rentabilidadeTotal.toFixed(2)}`}
              icon={DollarSign}
              color={
                metrics.rentabilidadeTotal >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }
              subtitle={t('metrics.sum_all_brokers')}
            />

            <MetricCard
              title={t('dashboard.total_trades')}
              value={metrics.totalTrades}
              icon={BarChart3}
              color="text-zinc-300"
              subtitle="Crypto + Forex + B3"
            />

            <MetricCard
              title={t('dashboard.win_rate')}
              value={`${metrics.taxaAcerto.toFixed(1)}%`}
              icon={Target}
              color={
                metrics.taxaAcerto >= 50 ? "text-green-400" : "text-red-400"
              }
              subtitle={t('metrics.weighted_average')}
            />
          </div>

          {/* Distribuição por Mercado */}
          <Card className="bg-zinc-900/90 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-400" />
                {t('dashboard.market_distribution')}
              </CardTitle>
              <CardDescription>
                {t('consolidated.market_analysis')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["crypto", "forex", "b3"].map((mercado) => {
                  const tradesMercado = trades.filter(
                    (trade: Trade) => trade.mercado === mercado,
                  );
                  const totalMercado = tradesMercado.reduce(
                    (sum: number, trade: Trade) =>
                      sum + parseFloat(trade.resultado || "0"),
                    0,
                  );
                  const countMercado = tradesMercado.length;
                  const winRateMercado =
                    countMercado > 0
                      ? (tradesMercado.filter(
                          (trade: Trade) =>
                            parseFloat(trade.resultado || "0") > 0,
                        ).length /
                          countMercado) *
                        100
                      : 0;

                  const mercadoInfo = {
                    crypto: { name: "Crypto", color: "text-white" },
                    forex: { name: "Forex", color: "text-blue-400" },
                    b3: { name: "B3", color: "text-green-400" },
                  };

                  const info = mercadoInfo[mercado as keyof typeof mercadoInfo];

                  return (
                    <div
                      key={mercado}
                      className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-4 h-4 rounded-full ${info.color.replace("text-", "bg-")}`}
                        ></div>
                        <div>
                          <div className="text-white font-medium">
                            {info.name}
                          </div>
                          <div className="text-zinc-400 text-sm">
                            {countMercado} trades
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div
                            className={`text-lg font-bold ${totalMercado >= 0 ? "text-green-400" : "text-red-400"}`}
                          >
                            {totalMercado >= 0 ? "+" : ""}R${" "}
                            {totalMercado.toFixed(2)}
                          </div>
                          <div className="text-xs text-zinc-400">{t('metrics.result')}</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${info.color}`}>
                            {winRateMercado.toFixed(1)}%
                          </div>
                          <div className="text-xs text-zinc-400">{t('metrics.win_rate')}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Edição de Trade Manual */}
      <Dialog open={showEditTradeDialog} onOpenChange={setShowEditTradeDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
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
  );
}
