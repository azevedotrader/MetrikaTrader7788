import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
  ReferenceArea,
} from "recharts";
import { format, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Trade } from "@shared/schema";

interface ChartDataPoint {
  date: Date;
  period: string;
  value: number;
  accumulated: number;
  total: number;
  positive: number;
  negative: number;
  tradeIndex: number;
  isPeak?: boolean;
  isValley?: boolean;
  isConsolidation?: boolean;
}

interface Peak {
  index: number;
  value: number;
  type: "peak" | "valley";
  date: Date;
  label: string;
}

interface ConsolidationZone {
  startIndex: number;
  endIndex: number;
  startLabel: string;
  endLabel: string;
  avgValue: number;
}

interface LineSegment {
  id: string;
  data: ChartDataPoint[];
  type: "monotone" | "stepAfter";
  isGap: boolean; // true se for um gap de mais de 7 dias
}

interface TradingPerformanceChartProps {
  trades: Trade[];
  t: (key: string) => string;
  formatCurrency: (value: number) => string;
  onPeriodFilterChange?: (filteredTrades: Trade[]) => void;
}

// Função para detectar picos e fundos usando mudanças relativas
function detectPeaks(data: ChartDataPoint[], windowSize: number = 2): Peak[] {
  if (data.length < 3) return [];
  
  const peaks: Peak[] = [];
  const range = Math.max(...data.map(d => d.accumulated)) - Math.min(...data.map(d => d.accumulated));
  
  // Calcular limiar baseado no range total (5% do range)
  const threshold = Math.max(range * 0.05, 50); // Mínimo de 50 para evitar ruído
  
  // Usar janela deslizante para detectar picos/fundos locais significativos
  for (let i = windowSize; i < data.length - windowSize; i++) {
    const curr = data[i].accumulated;
    
    // Verificar se é máximo local na janela
    let isLocalMax = true;
    let isLocalMin = true;
    let maxDiffFromNeighbors = 0;
    
    for (let j = i - windowSize; j <= i + windowSize; j++) {
      if (j !== i) {
        const neighbor = data[j].accumulated;
        maxDiffFromNeighbors = Math.max(maxDiffFromNeighbors, Math.abs(curr - neighbor));
        
        if (neighbor >= curr) isLocalMax = false;
        if (neighbor <= curr) isLocalMin = false;
      }
    }
    
    // Só adicionar se a diferença for significativa
    if (isLocalMax && maxDiffFromNeighbors > threshold) {
      peaks.push({
        index: i,
        value: curr,
        type: "peak",
        date: data[i].date,
        label: data[i].period,
      });
    }
    
    if (isLocalMin && maxDiffFromNeighbors > threshold) {
      peaks.push({
        index: i,
        value: curr,
        type: "valley",
        date: data[i].date,
        label: data[i].period,
      });
    }
  }
  
  // Sempre incluir extremos globais
  const maxValue = Math.max(...data.map(d => d.accumulated));
  const minValue = Math.min(...data.map(d => d.accumulated));
  
  const globalPeakIndex = data.findIndex(d => d.accumulated === maxValue);
  const globalValleyIndex = data.findIndex(d => d.accumulated === minValue);
  
  // Adicionar pico global se não existir e for significativo
  if (globalPeakIndex > 0 && !peaks.find(p => p.index === globalPeakIndex) && maxValue > threshold) {
    peaks.push({
      index: globalPeakIndex,
      value: maxValue,
      type: "peak",
      date: data[globalPeakIndex].date,
      label: data[globalPeakIndex].period,
    });
  }
  
  // Adicionar fundo global se não existir e for significativo
  if (globalValleyIndex > 0 && !peaks.find(p => p.index === globalValleyIndex) && minValue < -threshold) {
    peaks.push({
      index: globalValleyIndex,
      value: minValue,
      type: "valley",
      date: data[globalValleyIndex].date,
      label: data[globalValleyIndex].period,
    });
  }
  
  // Remover duplicatas e ordenar
  const uniquePeaks = peaks.filter((peak, index, self) => 
    index === self.findIndex(p => p.index === peak.index)
  );
  
  return uniquePeaks.sort((a, b) => a.index - b.index);
}

// Função para detectar zonas de consolidação
function detectConsolidationZones(data: ChartDataPoint[], minLength: number = 3, threshold: number = 0.03): ConsolidationZone[] {
  if (data.length < minLength) return [];
  
  const zones: ConsolidationZone[] = [];
  const range = Math.max(...data.map(d => d.accumulated)) - Math.min(...data.map(d => d.accumulated));
  const toleranceValue = range * threshold;
  
  let zoneStart = 0;
  let zoneEnd = 0;
  
  for (let i = 1; i < data.length; i++) {
    const diff = Math.abs(data[i].accumulated - data[zoneStart].accumulated);
    
    if (diff <= toleranceValue) {
      zoneEnd = i;
    } else {
      // Verificar se a zona tem tamanho mínimo
      if (zoneEnd - zoneStart + 1 >= minLength) {
        const zoneData = data.slice(zoneStart, zoneEnd + 1);
        const avgValue = zoneData.reduce((sum, d) => sum + d.accumulated, 0) / zoneData.length;
        
        zones.push({
          startIndex: zoneStart,
          endIndex: zoneEnd,
          startLabel: data[zoneStart].period,
          endLabel: data[zoneEnd].period,
          avgValue,
        });
      }
      zoneStart = i;
      zoneEnd = i;
    }
  }
  
  // Verificar última zona
  if (zoneEnd - zoneStart + 1 >= minLength) {
    const zoneData = data.slice(zoneStart, zoneEnd + 1);
    const avgValue = zoneData.reduce((sum, d) => sum + d.accumulated, 0) / zoneData.length;
    
    zones.push({
      startIndex: zoneStart,
      endIndex: zoneEnd,
      startLabel: data[zoneStart].period,
      endLabel: data[zoneEnd].period,
      avgValue,
    });
  }
  
  return zones;
}

// Formatar data baseado no período
function formatDate(date: Date, period: "week" | "month" | "year" | "specific-month"): string {
  if (period === "year") {
    return format(date, "dd/MM/yy", { locale: ptBR });
  }
  return format(date, "dd/MM", { locale: ptBR });
}

// Função para criar segmentos de linha baseados na diferença de dias
// Menos de 7 dias = linha volátil (monotone)
// 7+ dias = linha reta (stepAfter) para indicar período sem atividade
function createLineSegments(data: ChartDataPoint[], gapThreshold: number = 7): LineSegment[] {
  if (data.length < 2) {
    return [{
      id: "segment-0",
      data: data,
      type: "monotone",
      isGap: false,
    }];
  }
  
  const segments: LineSegment[] = [];
  let currentSegment: ChartDataPoint[] = [data[0]];
  let currentType: "monotone" | "stepAfter" = "monotone";
  let segmentIndex = 0;
  
  for (let i = 1; i < data.length; i++) {
    const prevDate = data[i - 1].date;
    const currDate = data[i].date;
    const daysDiff = differenceInCalendarDays(currDate, prevDate);
    
    // Determinar o tipo de linha baseado na diferença de dias
    const needsGapLine = daysDiff >= gapThreshold;
    
    if (needsGapLine !== (currentType === "stepAfter")) {
      // Mudou o tipo de linha - finalizar segmento atual
      if (currentSegment.length > 0) {
        // Adicionar o ponto atual ao segmento anterior para continuidade
        segments.push({
          id: `segment-${segmentIndex}`,
          data: [...currentSegment],
          type: currentType,
          isGap: currentType === "stepAfter",
        });
        segmentIndex++;
      }
      
      // Iniciar novo segmento com o ponto anterior (para continuidade visual)
      currentSegment = [data[i - 1], data[i]];
      currentType = needsGapLine ? "stepAfter" : "monotone";
    } else {
      // Mesmo tipo - adicionar ao segmento atual
      currentSegment.push(data[i]);
    }
  }
  
  // Finalizar último segmento
  if (currentSegment.length > 0) {
    segments.push({
      id: `segment-${segmentIndex}`,
      data: currentSegment,
      type: currentType,
      isGap: currentType === "stepAfter",
    });
  }
  
  return segments;
}

export function TradingPerformanceChart({ 
  trades, 
  t, 
  formatCurrency, 
  onPeriodFilterChange 
}: TradingPerformanceChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "year" | "specific-month">("month");
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [selectedStartDay, setSelectedStartDay] = useState<number>(1);
  const [selectedEndDay, setSelectedEndDay] = useState<number>(31);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Gerar dados do gráfico
  const { chartData, peaks, consolidationZones, periodFilteredTrades, lineSegments } = useMemo(() => {
    if (!trades.length) return { chartData: [], peaks: [], consolidationZones: [], periodFilteredTrades: [] as Trade[], lineSegments: [] as LineSegment[] };

    let periodFilteredTrades = trades;
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    // Determinar período
    switch (selectedPeriod) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case "year":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case "specific-month":
        const [yearStr, monthStr] = selectedMonth.split("-");
        const yearNum = parseInt(yearStr, 10);
        const monthNum = parseInt(monthStr, 10);
        const lastDayOfMonth = new Date(yearNum, monthNum, 0).getDate();
        const actualEndDay = Math.min(selectedEndDay, lastDayOfMonth);
        startDate = new Date(yearNum, monthNum - 1, selectedStartDay);
        endDate = new Date(yearNum, monthNum - 1, actualEndDay, 23, 59, 59);
        break;
      case "month":
      default:
        const tradeDates = trades.map(t => new Date(t.dataHora).getTime());
        startDate = new Date(Math.min(...tradeDates));
        endDate = new Date(Math.max(...tradeDates));
        break;
    }

    // Filtrar trades pelo período
    if (startDate && endDate) {
      periodFilteredTrades = trades.filter((trade) => {
        const tradeDate = new Date(trade.dataHora);
        return tradeDate >= startDate! && tradeDate <= endDate!;
      });
    }

    if (periodFilteredTrades.length === 0) return { chartData: [], peaks: [], consolidationZones: [], periodFilteredTrades: [] as Trade[], lineSegments: [] as LineSegment[] };

    // Ordenar trades por data
    const sortedTrades = [...periodFilteredTrades].sort(
      (a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime(),
    );

    // Criar dados trade por trade
    let accumulated = 0;
    const data: ChartDataPoint[] = sortedTrades.map((trade, index) => {
      const tradeDate = new Date(trade.dataHora);
      const resultado = parseFloat(trade.resultado || "0");
      accumulated += resultado;
      
      return {
        date: tradeDate,
        period: formatDate(tradeDate, selectedPeriod),
        value: resultado,
        accumulated,
        total: resultado,
        positive: resultado > 0 ? resultado : 0,
        negative: resultado < 0 ? Math.abs(resultado) : 0,
        tradeIndex: index + 1,
      };
    });

    // Detectar picos e fundos
    const detectedPeaks = detectPeaks(data);
    
    // Detectar zonas de consolidação
    const detectedZones = detectConsolidationZones(data);

    // Marcar pontos como picos/fundos/consolidação
    detectedPeaks.forEach(peak => {
      if (data[peak.index]) {
        if (peak.type === "peak") {
          data[peak.index].isPeak = true;
        } else {
          data[peak.index].isValley = true;
        }
      }
    });

    detectedZones.forEach(zone => {
      for (let i = zone.startIndex; i <= zone.endIndex; i++) {
        if (data[i]) {
          data[i].isConsolidation = true;
        }
      }
    });

    // Criar segmentos de linha baseados na diferença de dias entre trades
    const lineSegments = createLineSegments(data);

    return { 
      chartData: data, 
      peaks: detectedPeaks,
      consolidationZones: detectedZones,
      periodFilteredTrades,
      lineSegments,
    };
  }, [trades, selectedPeriod, selectedMonth, selectedStartDay, selectedEndDay]);

  // Usar useEffect para chamar o callback de forma segura (fora do render)
  const prevFilteredTradesRef = useRef<string>("");
  useEffect(() => {
    if (onPeriodFilterChange && periodFilteredTrades) {
      // Comparar usando um hash do array (length + primeiro/último IDs + período)
      const newHash = `${periodFilteredTrades.length}-${periodFilteredTrades[0]?.id || ''}-${periodFilteredTrades[periodFilteredTrades.length - 1]?.id || ''}-${selectedPeriod}-${selectedMonth}`;
      
      if (prevFilteredTradesRef.current !== newHash) {
        prevFilteredTradesRef.current = newHash;
        onPeriodFilterChange(periodFilteredTrades);
      }
    }
  }, [periodFilteredTrades, onPeriodFilterChange, selectedPeriod, selectedMonth]);

  // Calcular domínio do Y e posição do zero para gradiente
  const { yMin, yMax, zeroPosition } = useMemo(() => {
    if (chartData.length === 0) return { yMin: 0, yMax: 0, zeroPosition: 50 };
    
    const min = Math.min(...chartData.map(d => d.accumulated));
    const max = Math.max(...chartData.map(d => d.accumulated));
    
    let zeroPos = 50;
    if (max !== min) {
      zeroPos = ((max - 0) / (max - min)) * 100;
      zeroPos = Math.max(0, Math.min(100, zeroPos));
    }
    
    return { yMin: min, yMax: max, zeroPosition: zeroPos };
  }, [chartData]);

  // Tooltip personalizado - sem framer-motion para evitar problemas de hooks
  const renderCustomTooltip = useCallback(({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as ChartDataPoint;
      
      let specialLabel = "";
      let specialColor = "";
      
      if (dataPoint.isPeak) {
        specialLabel = "🔺 Topo do ciclo";
        specialColor = "#FFD700";
      } else if (dataPoint.isValley) {
        specialLabel = "🔻 Fundo do ciclo";
        specialColor = "#FF6B6B";
      } else if (dataPoint.isConsolidation) {
        specialLabel = "📊 Zona de consolidação";
        specialColor = "#888";
      }
      
      return (
        <div 
          style={{
            backgroundColor: "#000000",
            border: "1px solid #444",
            borderRadius: "8px",
            padding: "12px",
            color: "#fff",
            minWidth: "160px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            animation: "fadeIn 0.2s ease-out"
          }}
        >
          <p style={{ margin: 0, fontWeight: "bold", marginBottom: "8px", fontSize: "13px" }}>
            📅 {label} • Trade #{dataPoint.tradeIndex}
          </p>
          
          {specialLabel && (
            <p style={{ margin: 0, marginBottom: "6px", color: specialColor, fontSize: "12px", fontWeight: "bold" }}>
              {specialLabel}
            </p>
          )}
          
          <p style={{ margin: 0, marginBottom: "4px", color: dataPoint.total >= 0 ? "#2FA87A" : "#F06363", fontSize: "14px" }}>
            {dataPoint.total >= 0 ? "📈" : "📉"} {dataPoint.total >= 0 ? "+" : ""}{formatCurrency(dataPoint.total)}
          </p>
          
          <p style={{ margin: 0, color: dataPoint.accumulated >= 0 ? "#2FA87A" : "#F06363", fontSize: "12px", opacity: 0.8 }}>
            💰 Total: {formatCurrency(dataPoint.accumulated)}
          </p>
        </div>
      );
    }
    return null;
  }, [formatCurrency]);

  // Gerar lista de meses para seleção
  const monthOptions = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        value: format(date, "yyyy-MM"),
        label: format(date, "MMM/yy", { locale: ptBR }),
      });
    }
    return months;
  }, []);

  if (chartData.length === 0) {
    return (
      <div className="w-full" data-testid="trading-performance-chart-empty">
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
              onClick={() => setSelectedPeriod(filter.key as any)}
              className={`text-xs md:text-sm ${
                selectedPeriod === filter.key
                  ? "bg-[#2FA87A] hover:bg-[#279169] text-white"
                  : "border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {filter.label}
            </Button>
          ))}
        </div>
        <div className="h-[500px] md:h-[550px] flex items-center justify-center text-zinc-400">
          <div className="text-center">
            <BarChart3 className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">{t('empty.no_trades_period')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="trading-performance-chart" className="w-full">
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
            onClick={() => setSelectedPeriod(filter.key as any)}
            className={`text-xs md:text-sm ${
              selectedPeriod === filter.key
                ? "bg-[#2FA87A] hover:bg-[#279169] text-white"
                : "border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            }`}
            data-testid={`btn-period-${filter.key}`}
          >
            {filter.label}
          </Button>
        ))}

        {/* Seletor de Mês */}
        <Select value={selectedMonth} onValueChange={(value) => {
          setSelectedMonth(value);
          setSelectedPeriod("specific-month");
          const [year, month] = value.split('-');
          const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
          setSelectedStartDay(1);
          setSelectedEndDay(lastDay);
        }}>
          <SelectTrigger 
            className="bg-zinc-800 border-zinc-700 text-white w-32 md:w-40 text-xs md:text-sm"
            data-testid="select-month"
          >
            <SelectValue placeholder="Mês Específico" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            {monthOptions.map((month) => (
              <SelectItem
                key={month.value}
                value={month.value}
                className="text-white hover:bg-zinc-700 text-xs md:text-sm"
              >
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtros de dias quando mês específico selecionado */}
        {selectedPeriod === "specific-month" && (
          <>
            <span className="text-zinc-400 text-xs md:text-sm">Do dia</span>
            <Select 
              value={selectedStartDay.toString()} 
              onValueChange={(value) => {
                const day = parseInt(value);
                setSelectedStartDay(day);
                if (day > selectedEndDay) setSelectedEndDay(day);
              }}
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white w-12 md:w-16 text-xs md:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 max-h-40">
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <SelectItem key={day} value={day.toString()} className="text-white hover:bg-zinc-700">
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <span className="text-zinc-400 text-xs md:text-sm">ao dia</span>
            
            <Select 
              value={selectedEndDay.toString()} 
              onValueChange={(value) => {
                const day = parseInt(value);
                setSelectedEndDay(day);
                if (day < selectedStartDay) setSelectedStartDay(day);
              }}
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white w-12 md:w-16 text-xs md:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 max-h-40">
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <SelectItem key={day} value={day.toString()} className="text-white hover:bg-zinc-700">
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {/* Indicadores de Picos e Fundos */}
      {peaks.length > 0 && (
        <div className="flex justify-center gap-4 mb-4 text-xs">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-[#FFD700]" />
            <span className="text-zinc-400">Topos: {peaks.filter(p => p.type === "peak").length}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-[#FF6B6B]" />
            <span className="text-zinc-400">Fundos: {peaks.filter(p => p.type === "valley").length}</span>
          </div>
          {consolidationZones.length > 0 && (
            <div className="flex items-center gap-1">
              <Minus className="w-3 h-3 text-zinc-500" />
              <span className="text-zinc-400">Consolidações: {consolidationZones.length}</span>
            </div>
          )}
        </div>
      )}

      {/* Gráfico */}
      <div className="relative h-[500px] md:h-[550px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            onMouseMove={(e: any) => {
              if (e && e.activeTooltipIndex !== undefined) {
                setHoveredPoint(e.activeTooltipIndex);
              }
            }}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            {/* Gradiente dinâmico */}
            <defs>
              <linearGradient id="tradingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2FA87A" />
                <stop offset={`${zeroPosition}%`} stopColor="#2FA87A" />
                <stop offset={`${zeroPosition}%`} stopColor="#F06363" />
                <stop offset="100%" stopColor="#F06363" />
              </linearGradient>
              <linearGradient id="areaGradientPositive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2FA87A" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#2FA87A" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="areaGradientNegative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F06363" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#F06363" stopOpacity={0.4} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            
            <XAxis 
              dataKey="period" 
              stroke="#666"
              fontSize={window.innerWidth < 768 ? 8 : 10}
              angle={-45}
              textAnchor="end"
              height={window.innerWidth < 768 ? 50 : 70}
              tick={{ fill: '#888' }}
            />
            
            <YAxis 
              stroke="#666"
              fontSize={window.innerWidth < 768 ? 9 : 11}
              tickFormatter={(value) => formatCurrency(value)}
              tick={{ fill: '#888' }}
            />
            
            <RechartsTooltip content={renderCustomTooltip} />

            {/* Linha do zero */}
            <ReferenceLine y={0} stroke="#555" strokeWidth={1} strokeDasharray="5 5" />

            {/* Zonas de consolidação */}
            {consolidationZones.map((zone, index) => (
              <ReferenceArea
                key={`zone-${index}`}
                x1={chartData[zone.startIndex]?.period}
                x2={chartData[zone.endIndex]?.period}
                fill="#666"
                fillOpacity={0.1}
                stroke="#888"
                strokeDasharray="3 3"
              />
            ))}

            {/* Área preenchida - usa monotone para suavidade */}
            <Area
              type="monotone"
              dataKey="accumulated"
              stroke="none"
              fill="url(#tradingGradient)"
              fillOpacity={0.15}
              isAnimationActive={false}
            />

            {/* Linhas por segmento - tipo diferente baseado na diferença de dias */}
            {lineSegments.map((segment) => (
              <Line
                key={segment.id}
                data={segment.data}
                type={segment.type}
                dataKey="accumulated"
                stroke="url(#tradingGradient)"
                strokeWidth={hoveredPoint !== null ? 3 : 2}
                strokeOpacity={segment.isGap ? 0.6 : 1}
                strokeDasharray={segment.isGap ? "5 3" : "0"}
                dot={false}
                activeDot={{
                  r: 6,
                  fill: "#fff",
                  stroke: segment.isGap ? "#888" : "#2FA87A",
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
                connectNulls
              />
            ))}

            {/* Marcar picos com pontos especiais */}
            {peaks.filter(p => p.type === "peak").map((peak, index) => (
              <ReferenceDot
                key={`peak-${index}`}
                x={chartData[peak.index]?.period}
                y={peak.value}
                r={6}
                fill="#FFD700"
                stroke="#fff"
                strokeWidth={2}
              />
            ))}

            {/* Marcar fundos com pontos especiais */}
            {peaks.filter(p => p.type === "valley").map((valley, index) => (
              <ReferenceDot
                key={`valley-${index}`}
                x={chartData[valley.index]?.period}
                y={valley.value}
                r={6}
                fill="#FF6B6B"
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="opacity-[0.05] text-6xl font-bold text-zinc-500">
            MÉTRIKA
          </div>
        </div>
      </div>
    </div>
  );
}

export { detectPeaks, detectConsolidationZones, formatDate };
export type { ChartDataPoint, Peak, ConsolidationZone, TradingPerformanceChartProps };
