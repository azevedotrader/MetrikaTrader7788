import { useState, useMemo, useEffect } from "react";
import { TradingPerformanceChart } from "@/components/ui/trading-performance-chart";
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
import { 
  Tooltip as InfoTooltip, 
  TooltipContent as InfoTooltipContent, 
  TooltipProvider as InfoTooltipProvider, 
  TooltipTrigger as InfoTooltipTrigger 
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTour } from "@/contexts/TourContext";
import {
  TrendingUp,
  TrendingDown,
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
  Eye,
  EyeOff,
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  ReferenceLine,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
} from "recharts";
import { type Trade } from "@shared/schema";
import { TradingCalendar } from "@/components/ui/trading-calendar";
import { SmartReprocessButton } from "@/components/SmartReprocessButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/hooks/useCurrency";
import { TopBar } from "@/components/layout/top-bar";
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

interface AdvancedMetricsData {
  iqt: number;
  eficienciaRisco: number;
  scoreConsistencia: number;
  retornoAjustadoPrecisao: number;
  ipi: number;
  expectancy: number;
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

// Função para calcular métricas avançadas
// NOTA: Todas as métricas são NORMALIZADAS para escalas coerentes (não usam R$ diretamente)
function calculateAdvancedMetrics(trades: Trade[]): AdvancedMetricsData {
  if (!trades.length) {
    return {
      iqt: 0,
      eficienciaRisco: 0,
      scoreConsistencia: 0,
      retornoAjustadoPrecisao: 0,
      ipi: 0,
      expectancy: 0,
    };
  }

  // Cálculos base
  const rentabilidadeTotalR$ = trades.reduce((acc, trade) => {
    return acc + parseFloat(trade.resultado || "0");
  }, 0);

  const tradesLucrativos = trades.filter(trade => parseFloat(trade.resultado || "0") > 0);
  const tradesNegativo = trades.filter(trade => parseFloat(trade.resultado || "0") < 0);
  
  // Assertividade (Taxa de Acerto) - valor entre 0 e 1
  const assertividade = trades.length > 0 ? (tradesLucrativos.length / trades.length) : 0;
  
  // Fator de Lucro (Profit Factor)
  const totalLucros = tradesLucrativos.reduce((acc, trade) => acc + parseFloat(trade.resultado || "0"), 0);
  const totalPerdas = Math.abs(tradesNegativo.reduce((acc, trade) => acc + parseFloat(trade.resultado || "0"), 0));
  
  let fatorDeLucro = 1;
  if (totalPerdas > 0) {
    fatorDeLucro = totalLucros / totalPerdas;
  } else if (totalLucros > 0) {
    fatorDeLucro = 5; // Máximo quando não há perdas
  }
  
  // RR Médio - Relação Risco/Retorno média
  const tradesComTakeStop = trades.filter(trade => 
    trade.alvo && trade.stop && 
    parseFloat(trade.alvo) > 0 && parseFloat(trade.stop) > 0
  );
  
  let rrMedio = 1;
  if (tradesComTakeStop.length > 0) {
    const totalRRR = tradesComTakeStop.reduce((acc, trade) => {
      const takeValue = parseFloat(trade.alvo!);
      const stopValue = parseFloat(trade.stop!);
      const precoEntrada = parseFloat(trade.precoEntrada || "0");
      
      if (precoEntrada > 0) {
        const potencialGanho = Math.abs(takeValue - precoEntrada);
        const potencialPerda = Math.abs(precoEntrada - stopValue);
        return acc + (potencialPerda > 0 ? potencialGanho / potencialPerda : 0);
      }
      return acc;
    }, 0);
    rrMedio = totalRRR / tradesComTakeStop.length;
  } else if (tradesLucrativos.length > 0 && tradesNegativo.length > 0) {
    const mediaGanhos = totalLucros / tradesLucrativos.length;
    const mediaPerdas = totalPerdas / tradesNegativo.length;
    rrMedio = mediaPerdas > 0 ? mediaGanhos / mediaPerdas : 1;
  }

  // Estabilidade: % de dias lucrativos no período
  const tradesPorDia = trades.reduce((acc, trade) => {
    const data = trade.dataHora ? new Date(trade.dataHora).toDateString() : 'unknown';
    if (!acc[data]) acc[data] = 0;
    acc[data] += parseFloat(trade.resultado || "0");
    return acc;
  }, {} as Record<string, number>);

  const diasLucrativos = Object.values(tradesPorDia).filter(valor => valor > 0).length;
  const totalDias = Object.keys(tradesPorDia).length;
  const estabilidade = totalDias > 0 ? diasLucrativos / totalDias : 0;

  // Drawdown: maior queda percentual do capital
  let capitalAcumulado = 0;
  let pico = 0;
  let maiorDrawdown = 0;

  trades.forEach(trade => {
    capitalAcumulado += parseFloat(trade.resultado || "0");
    if (capitalAcumulado > pico) pico = capitalAcumulado;
    if (pico > 0) {
      const drawdownAtual = (pico - capitalAcumulado) / pico;
      if (drawdownAtual > maiorDrawdown) maiorDrawdown = drawdownAtual;
    }
  });

  // ====== MÉTRICAS AVANÇADAS NORMALIZADAS ======
  
  // 1. IQT (Índice de Qualidade de Trading) - Escala 0-200+
  // Fórmula: (Assertividade × Fator de Lucro × RR Médio) × 100 / (1 + Drawdown)
  // Combina taxa de acerto, lucratividade e risco em um único índice
  const iqt = ((assertividade * fatorDeLucro * Math.min(rrMedio, 5)) * 100) / (1 + maiorDrawdown);
  
  // 2. Eficiência de Risco - Escala 0-50+
  // Fórmula: (Fator de Lucro × Assertividade × 10) / (1 + Volatilidade do RR)
  // Mostra quão bem você gerencia risco em relação aos ganhos
  const volatilidade = Math.abs(1 - rrMedio) * 0.5; // Penaliza RR muito variável
  const eficienciaRisco = (fatorDeLucro * assertividade * 10) / (1 + volatilidade);
  
  // 3. Score de Consistência - Escala 0-3+
  // Fórmula: √(Assertividade × Fator de Lucro × Estabilidade × 2)
  // Mede o quão consistente é sua estratégia
  const scoreConsistencia = Math.sqrt(assertividade * fatorDeLucro * (estabilidade + 0.5));
  
  // 4. RAP (Retorno Ajustado à Precisão) - Escala 0-500+
  // Fórmula: (Fator de Lucro × Assertividade × 100) × Estabilidade
  // Mostra qualidade do retorno considerando a precisão
  const retornoAjustadoPrecisao = (fatorDeLucro * assertividade * 100) * (estabilidade + 0.5);

  // 5. IPI (Índice de Performance Integrado) - Escala 0-10+
  // Fórmula: ((Fator de Lucro × Assertividade) × (1 + Estabilidade)) ÷ (1 + Drawdown)
  // Índice completo que considera todos os fatores de performance
  const ipi = ((fatorDeLucro * assertividade) * (1 + estabilidade)) / (1 + maiorDrawdown);

  // 6. Expectancy (Van Tharp) - Valor em R$ por trade
  // Fórmula: (Taxa de Acerto × Ganho Médio) − ((1 − Taxa de Acerto) × Perda Média)
  // Lucro esperado por operação
  const ganhoMedio = tradesLucrativos.length > 0 ? totalLucros / tradesLucrativos.length : 0;
  const perdaMedia = tradesNegativo.length > 0 ? Math.abs(totalPerdas / tradesNegativo.length) : 0;
  const expectancy = (assertividade * ganhoMedio) - ((1 - assertividade) * perdaMedia);

  return {
    iqt: Math.max(0, iqt),
    eficienciaRisco: Math.max(0, eficienciaRisco),
    scoreConsistencia: Math.max(0, scoreConsistencia),
    retornoAjustadoPrecisao: Math.max(0, retornoAjustadoPrecisao),
    ipi: Math.max(0, ipi),
    expectancy,
  };
}

// Componente AdvancedMetrics
function AdvancedMetrics({ trades, t, formatCurrency, getCurrencySymbol }: { trades: Trade[]; t: (key: string) => string; formatCurrency: (value: number) => string; getCurrencySymbol: () => string }) {
  const metrics = calculateAdvancedMetrics(trades);

  const getScoreColor = (value: number, type: 'iqt' | 'eficiencia' | 'consistencia' | 'rap' | 'ipi' | 'expectancy') => {
    // Sistema de cores:
    // 🟢 Verde = Bom/Excelente (acima de 70% do objetivo)
    // 🟡 Amarelo = Mediano (entre 30-70% do objetivo)
    // 🔴 Vermelho = Precisa melhorar (abaixo de 30%)
    switch (type) {
      case 'iqt':
        // IQT - Objetivo: 100 | Verde ≥70 | Amarelo 30-70 | Vermelho <30
        if (value >= 70) return 'text-[#6EE000]'; // Verde - Bom
        if (value >= 30) return 'text-yellow-500'; // Amarelo - Mediano
        return 'text-[#FF1F3D]'; // Vermelho - Precisa melhorar
      case 'eficiencia':
        // Eficiência - Objetivo: 5 | Verde ≥3.5 | Amarelo 1.5-3.5 | Vermelho <1.5
        if (value >= 3.5) return 'text-[#6EE000]';
        if (value >= 1.5) return 'text-yellow-500';
        return 'text-[#FF1F3D]';
      case 'consistencia':
        // Consistência - Objetivo: 1.2 | Verde ≥0.9 | Amarelo 0.5-0.9 | Vermelho <0.5
        if (value >= 0.9) return 'text-[#6EE000]';
        if (value >= 0.5) return 'text-yellow-500';
        return 'text-[#FF1F3D]';
      case 'rap':
        // RAP - Objetivo: 100 | Verde ≥70 | Amarelo 30-70 | Vermelho <30
        if (value >= 70) return 'text-[#6EE000]';
        if (value >= 30) return 'text-yellow-500';
        return 'text-[#FF1F3D]';
      case 'ipi':
        // IPI - Objetivo: 2.0 | Verde ≥1.4 | Amarelo 0.6-1.4 | Vermelho <0.6
        if (value >= 1.4) return 'text-[#6EE000]';
        if (value >= 0.6) return 'text-yellow-500';
        return 'text-[#FF1F3D]';
      case 'expectancy':
        // Expectancy - Objetivo: 50 | Verde ≥20 | Amarelo 0-20 | Vermelho <0
        if (value >= 20) return 'text-[#6EE000]';
        if (value >= 0) return 'text-yellow-500';
        return 'text-[#FF1F3D]';
    }
  };

  return (
    <InfoTooltipProvider>
      <div className="flex flex-col gap-3 h-full">
        {/* Primeira linha: 3 métricas */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* IQT */}
          <div className="tr-premium-card p-2 sm:p-3 flex flex-col">
            <div className="text-xs text-zinc-400 mb-1 sm:mb-2 flex items-center gap-1">
              IQT
              <InfoTooltip>
                <InfoTooltipTrigger asChild>
                  <button className="text-zinc-500 hover:text-zinc-300 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </button>
                </InfoTooltipTrigger>
                <InfoTooltipContent className="bg-[var(--card)] border-[var(--brd)] text-[var(--text)] max-w-xs">
                  <p className="font-semibold mb-1">Índice de Qualidade de Trading</p>
                  <p className="text-sm text-zinc-300">Mede a qualidade geral da sua estratégia combinando taxa de acerto, fator de lucro e risco/retorno. Quanto maior, melhor sua estratégia.</p>
                  <p className="text-xs text-zinc-400 mt-2">✅ Bom: ≥ 70 | ⚠️ Mediano: 30-70 | ❌ Precisa melhorar: &lt; 30</p>
                </InfoTooltipContent>
              </InfoTooltip>
            </div>
            <div 
              className={`text-sm sm:text-lg font-bold mb-1 ${getScoreColor(metrics.iqt, 'iqt')}`}
              data-testid="text-iqt"
            >
              {metrics.iqt.toFixed(1)}
            </div>
            <div className="text-xs text-zinc-500">{t('metrics.quality_index')}</div>
          </div>

          {/* Eficiência de Risco */}
          <div className="tr-premium-card p-2 sm:p-3 flex flex-col">
            <div className="text-xs text-zinc-400 mb-1 sm:mb-2 flex items-center gap-1">
              Eficiência
              <InfoTooltip>
                <InfoTooltipTrigger asChild>
                  <button className="text-zinc-500 hover:text-zinc-300 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </button>
                </InfoTooltipTrigger>
                <InfoTooltipContent className="bg-[var(--card)] border-[var(--brd)] text-[var(--text)] max-w-xs">
                  <p className="font-semibold mb-1">Eficiência de Risco</p>
                  <p className="text-sm text-zinc-300">Mostra quanto você ganha em relação ao risco assumido. Quanto maior, mais eficiente está sendo sua gestão de risco.</p>
                  <p className="text-xs text-zinc-400 mt-2">✅ Bom: ≥ 3.5 | ⚠️ Mediano: 1.5-3.5 | ❌ Precisa melhorar: &lt; 1.5</p>
                </InfoTooltipContent>
              </InfoTooltip>
            </div>
            <div 
              className={`text-sm sm:text-lg font-bold mb-1 ${getScoreColor(metrics.eficienciaRisco, 'eficiencia')}`}
              data-testid="text-eficiencia"
            >
              {metrics.eficienciaRisco.toFixed(2)}
            </div>
            <div className="text-xs text-zinc-500">{t('metrics.risk_percentage')}</div>
          </div>

          {/* Score de Consistência */}
          <div className="tr-premium-card p-2 sm:p-3 flex flex-col">
            <div className="text-xs text-zinc-400 mb-1 sm:mb-2 flex items-center gap-1">
              Consistência
              <InfoTooltip>
                <InfoTooltipTrigger asChild>
                  <button className="text-zinc-500 hover:text-zinc-300 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </button>
                </InfoTooltipTrigger>
                <InfoTooltipContent className="bg-[var(--card)] border-[var(--brd)] text-[var(--text)] max-w-xs">
                  <p className="font-semibold mb-1">Score de Consistência</p>
                  <p className="text-sm text-zinc-300">Avalia a estabilidade dos seus resultados ao longo do tempo. Alta consistência indica disciplina e controle emocional.</p>
                  <p className="text-xs text-zinc-400 mt-2">✅ Bom: ≥ 0.9 | ⚠️ Mediano: 0.5-0.9 | ❌ Precisa melhorar: &lt; 0.5</p>
                </InfoTooltipContent>
              </InfoTooltip>
            </div>
            <div 
              className={`text-sm sm:text-lg font-bold mb-1 ${getScoreColor(metrics.scoreConsistencia, 'consistencia')}`}
              data-testid="text-consistencia"
            >
              {metrics.scoreConsistencia.toFixed(2)}
            </div>
            <div className="text-xs text-zinc-500">{t('metrics.score')}</div>
          </div>
        </div>

        {/* Segunda linha: 3 métricas */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* RAP */}
          <div className="tr-premium-card p-2 sm:p-3 flex flex-col">
            <div className="text-xs text-zinc-400 mb-1 sm:mb-2 flex items-center gap-1">
              RAP
              <InfoTooltip>
                <InfoTooltipTrigger asChild>
                  <button className="text-zinc-500 hover:text-zinc-300 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </button>
                </InfoTooltipTrigger>
                <InfoTooltipContent className="bg-[var(--card)] border-[var(--brd)] text-[var(--text)] max-w-xs">
                  <p className="font-semibold mb-1">Retorno Ajustado por Precisão</p>
                  <p className="text-sm text-zinc-300">Mostra quanto você lucra em relação à sua taxa de acerto. Útil para avaliar se você está maximizando seus ganhos mesmo com assertividade moderada.</p>
                  <p className="text-xs text-zinc-400 mt-2">✅ Bom: ≥ 70 | ⚠️ Mediano: 30-70 | ❌ Precisa melhorar: &lt; 30</p>
                </InfoTooltipContent>
              </InfoTooltip>
            </div>
            <div 
              className={`text-sm sm:text-lg font-bold mb-1 ${getScoreColor(metrics.retornoAjustadoPrecisao, 'rap')}`}
              data-testid="text-rap"
            >
              {metrics.retornoAjustadoPrecisao.toFixed(2)}
            </div>
            <div className="text-xs text-zinc-500">{t('metrics.precision')}</div>
          </div>

          {/* IPI */}
          <div className="tr-premium-card p-2 sm:p-3 flex flex-col">
            <div className="text-xs text-zinc-400 mb-1 sm:mb-2 flex items-center gap-1">
              IPI
              <InfoTooltip>
                <InfoTooltipTrigger asChild>
                  <button className="text-zinc-500 hover:text-zinc-300 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </button>
                </InfoTooltipTrigger>
                <InfoTooltipContent className="bg-[var(--card)] border-[var(--brd)] text-[var(--text)] max-w-xs">
                  <p className="font-semibold mb-1">Índice de Performance Integrado</p>
                  <p className="text-sm text-zinc-300">Métrica avançada que combina rentabilidade, lucro, estabilidade e drawdown. Resume a performance completa da sua estratégia.</p>
                  <p className="text-xs text-zinc-400 mt-2">✅ Bom: ≥ 1.4 | ⚠️ Mediano: 0.6-1.4 | ❌ Precisa melhorar: &lt; 0.6</p>
                </InfoTooltipContent>
              </InfoTooltip>
            </div>
            <div 
              className={`text-sm sm:text-lg font-bold mb-1 ${getScoreColor(metrics.ipi, 'ipi')}`}
              data-testid="text-ipi"
            >
              {metrics.ipi.toFixed(3)}
            </div>
            <div className="text-xs text-zinc-500">{t('metrics.performance')}</div>
          </div>

          {/* Expectancy - Van Tharp */}
          <div className="tr-premium-card p-2 sm:p-3 flex flex-col">
            <div className="text-xs text-zinc-400 mb-1 sm:mb-2 flex items-center gap-1">
              Expectancy
              <InfoTooltip>
                <InfoTooltipTrigger asChild>
                  <button className="text-zinc-500 hover:text-zinc-300 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </button>
                </InfoTooltipTrigger>
                <InfoTooltipContent className="bg-[var(--card)] border-[var(--brd)] text-[var(--text)] max-w-xs">
                  <p className="font-semibold mb-1">Expectancy (Van Tharp)</p>
                  <p className="text-sm text-zinc-300">Mostra quanto você espera ganhar (ou perder) em média por trade. Métrica fundamental para saber se sua estratégia é lucrativa a longo prazo.</p>
                  <p className="text-xs text-zinc-400 mt-2">✅ Bom: ≥ {getCurrencySymbol()}20 | ⚠️ Mediano: {getCurrencySymbol()}0-20 | ❌ Negativo: &lt; {getCurrencySymbol()}0</p>
                </InfoTooltipContent>
              </InfoTooltip>
            </div>
            <div 
              className={`text-sm sm:text-lg font-bold mb-1 ${getScoreColor(metrics.expectancy, 'expectancy')}`}
              data-testid="text-expectancy"
            >
              {formatCurrency(metrics.expectancy)}
            </div>
            <div className="text-xs text-zinc-500">{t('metrics.van_tharp')}</div>
          </div>
        </div>
      </div>
    </InfoTooltipProvider>
  );
}

// Capital Curve Chart - Professional Trading Analytics
function CapitalCurveChart({ trades, t, formatCurrency }: { trades: Trade[]; t: (key: string) => string; formatCurrency: (value: number) => string }) {
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

  // Calcular valores mínimo e máximo para o domain do YAxis
  const yAxisDomain = useMemo(() => {
    if (!chartData.length) return [0, 100];
    
    const allValues = chartData.flatMap(d => [d.cumulativeProfit, d.profit]);
    const minValue = Math.min(...allValues, 0); // Garantir que inclui zero
    const maxValue = Math.max(...allValues, 0); // Garantir que inclui zero
    
    // Debug: mostrar valores calculados
    console.log('📊 Capital Curve - Dados do gráfico:', {
      chartDataLength: chartData.length,
      firstPoint: chartData[0],
      lastPoint: chartData[chartData.length - 1],
      minValue,
      maxValue,
      allValues: allValues.slice(0, 5) // Primeiros 5 valores
    });
    
    // Adicionar margem de 10% para melhor visualização
    const margin = Math.max(Math.abs(minValue), Math.abs(maxValue)) * 0.1;
    
    const domain = [
      Math.floor(minValue - margin),
      Math.ceil(maxValue + margin)
    ];
    
    console.log('📊 Capital Curve - Domain calculado:', domain);
    
    return domain;
  }, [chartData]);

  const formatTooltipValue = (value: number, name: string) => {
    if (name === "cumulativeProfit") {
      return [formatCurrency(value), t('chart.profitability_accumulated')];
    }
    return [formatCurrency(value), t('chart.period_result')];
  };

  return (
    <div className="w-full">
      <CardContent className="p-3 sm:p-4 md:p-6">
        {/* Filtros de Tempo */}
        <div className="flex flex-wrap justify-center sm:justify-end gap-1.5 sm:gap-2 mb-4">
          {[
            { key: "dia", label: t('time.day') },
            { key: "semana", label: t('time.week') },
            { key: "mes", label: t('time.month') },
            { key: "ano", label: t('time.year') },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setTimeFilter(filter.key as any)}
              className={`text-xs font-bold px-3 py-1.5 rounded-md border transition-all duration-150 ${
                timeFilter === filter.key
                  ? "bg-[#6EE000]/15 border-[#6EE000]/60 text-[#6EE000]"
                  : "bg-transparent border-[var(--brd2)] text-[var(--dim)] hover:border-[#6EE000]/40 hover:text-[#6EE000]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Gráfico */}
        <div className="h-60 sm:h-72 md:h-80 w-full tr-chart-bg rounded-lg">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                <defs>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6EE000" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6EE000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="period"
                  stroke="#6e7191"
                  tick={{ fill: '#6e7191', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  tickLine={false}
                  height={36}
                  angle={-30}
                  textAnchor="end"
                  interval={Math.max(Math.floor(chartData.length / 6), 1)}
                />
                <YAxis
                  stroke="#6e7191"
                  tick={{ fill: '#6e7191', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                  tickFormatter={(value) => formatCurrency(value)}
                  domain={yAxisDomain}
                  allowDataOverflow={false}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#0f0f1a",
                    border: "1.5px solid #1e1e2e",
                    borderRadius: "12px",
                    color: "#e0e0e0",
                    padding: "10px 14px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                    fontSize: "13px",
                    fontFamily: "'Nunito', system-ui, sans-serif",
                    fontWeight: 600,
                  }}
                  formatter={formatTooltipValue}
                  labelStyle={{ color: '#6e7191', fontSize: '11px', letterSpacing: '0.5px', marginBottom: '4px' }}
                  cursor={{ stroke: 'rgba(110,224,0,0.3)', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                {/* Linha de referência em zero */}
                <ReferenceLine
                  y={0}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={1}
                  strokeDasharray="6 4"
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeProfit"
                  stroke="none"
                  fill="url(#profitGradient)"
                  fillOpacity={1}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeProfit"
                  stroke="#6EE000"
                  strokeWidth={2.5}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const isNegative = payload.cumulativeProfit < 0;
                    return (
                      <circle
                        key={`dot-${cx}-${cy}`}
                        cx={cx}
                        cy={cy}
                        r={3}
                        fill={isNegative ? "#FF1F3D" : "#6EE000"}
                        stroke={isNegative ? "#FF1F3D" : "#6EE000"}
                        strokeWidth={1.5}
                      />
                    );
                  }}
                  activeDot={{ r: 5, fill: '#6EE000', stroke: '#6EE000', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="rgba(110,224,0,0.35)"
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="4 4"
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
        <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-[#6EE000]"></div>
            <span className="text-slate-300">{t('metrics.accumulated_profitability')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-[#6EE000] border-dashed"></div>
            <span className="text-slate-300">{t('metrics.period_result')}</span>
          </div>
        </div>
      </CardContent>
    </div>
  );
}

// Drawdown Chart - Shows the drawdown values in R$ over time (daily view)
function DrawdownChart({ trades, t, formatCurrency }: { trades: Trade[]; t: (key: string) => string; formatCurrency: (value: number) => string }) {
  const timeFilter = "dia"; // Fixo em dia para melhor expressividade

  const chartData = useMemo(() => {
    if (!trades.length) return [];

    // Ordenar trades por data
    const sortedTrades = [...trades].sort(
      (a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime(),
    );

    // Função para agrupar dados baseado no filtro
    const groupDataByPeriod = () => {
      // Primeiro, calcular todos os pontos de equity
      const equityPoints: Array<{date: Date, equity: number, profit: number}> = [];
      let cumulativeProfit = 0;
      
      sortedTrades.forEach((trade) => {
        const profit = parseFloat(trade.resultado || "0");
        cumulativeProfit += profit;
        equityPoints.push({
          date: new Date(trade.dataHora),
          equity: cumulativeProfit,
          profit: profit
        });
      });

      // Agrupar pontos por período primeiro
      const periodGroups = new Map<string, Array<{date: Date, equity: number, profit: number}>>();
      
      equityPoints.forEach((point) => {
        let periodKey: string;
        
        // Sempre agrupado por dia
        periodKey = format(startOfDay(point.date), "yyyy-MM-dd");

        if (!periodGroups.has(periodKey)) {
          periodGroups.set(periodKey, []);
        }
        periodGroups.get(periodKey)!.push(point);
      });

      // Agora calcular métricas para cada período
      const results = [];
      
      for (const [periodKey, points] of Array.from(periodGroups.entries())) {
        if (points.length === 0) continue;
        
        // Ordenar pontos do período por data
        points.sort((a: {date: Date, equity: number, profit: number}, b: {date: Date, equity: number, profit: number}) => a.date.getTime() - b.date.getTime());
        
        // Calcular pico e drawdown específico para este período
        let periodPeak = points[0].equity; // Começar com o primeiro valor
        let maxDrawdown = 0; // Começa em 0 (sem drawdown)
        let maxDrawdownValue = 0;
        let finalEquity = points[points.length - 1].equity;
        
        // Percorrer todos os pontos para encontrar o maior drawdown
        points.forEach((point: {date: Date, equity: number, profit: number}) => {
          // Atualizar pico se necessário
          if (point.equity > periodPeak) {
            periodPeak = point.equity;
          }
          
          // Calcular drawdown atual em R$
          if (periodPeak > 0) {
            const equityDiff = periodPeak - point.equity;
            if (equityDiff > 0) {
              // Há drawdown (equity abaixo do pico) - valor negativo em R$
              const currentDrawdownValue = -equityDiff;
              
              // Manter o pior drawdown (mais negativo)
              if (currentDrawdownValue < maxDrawdown) {
                maxDrawdown = currentDrawdownValue;
                maxDrawdownValue = equityDiff; // Valor absoluto para exibição
              }
            }
            // Se equityDiff <= 0, estamos no pico ou acima, então drawdown permanece 0
          }
        });

        // Gerar label do período (sempre formato de dia)
        const firstDate = points[0].date;
        const periodLabel = format(firstDate, "dd/MM", { locale: ptBR });

        results.push({
          period: periodLabel,
          date: periodKey,
          drawdown: maxDrawdown, // Valor negativo em R$
          drawdownValue: maxDrawdownValue, // Valor absoluto
          equity: finalEquity,
          peak: periodPeak,
        });
      }

      return results.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ).slice(-20); // Últimos 20 períodos
    };

    return groupDataByPeriod();
  }, [trades, timeFilter]);

  const maxDrawdownValue = useMemo(() => {
    if (!chartData.length) return 0;
    return Math.max(...chartData.map(d => d.drawdownValue || 0));
  }, [chartData]);

  const maxDrawdown = useMemo(() => {
    if (!chartData.length) return 0;
    return Math.min(...chartData.map(d => d.drawdown));
  }, [chartData]);

  const currentDrawdown = useMemo(() => {
    if (!chartData.length) return { value: 0, absoluteValue: 0 };
    const lastPoint = chartData[chartData.length - 1];
    return {
      value: lastPoint?.drawdown || 0, // Valor negativo em R$
      absoluteValue: lastPoint?.drawdownValue || 0 // Valor absoluto
    };
  }, [chartData]);


  const formatTooltipValue = (value: number, name: string, props: any) => {
    if (name === 'drawdown') {
      return [formatCurrency(value), 'Drawdown'];
    }
    return [formatCurrency(value), 'Drawdown'];
  };

  return (
    <div className="w-full">
      <CardContent className="p-3 sm:p-4 md:p-6">

        {/* Métrica de Drawdown */}
        <div className="flex justify-center mb-4 text-xs sm:text-sm">
          <div className="text-slate-400 text-center">
            <div>Max Drawdown:</div>
            <div className="text-[#FF1F3D] font-semibold text-base sm:text-lg">
              {formatCurrency(maxDrawdown)}
            </div>
          </div>
        </div>

        {/* Gráfico */}
        <div className="h-60 sm:h-72 md:h-80 w-full tr-chart-bg rounded-lg">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                <defs>
                  <linearGradient id="ddGradient" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="5%" stopColor="#FF1F3D" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#FF1F3D" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="period"
                  stroke="#6e7191"
                  tick={{ fill: '#6e7191', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  tickLine={false}
                  height={36}
                  angle={-30}
                  textAnchor="end"
                  interval={Math.max(Math.floor(chartData.length / 6), 1)}
                />
                <YAxis
                  stroke="#6e7191"
                  tick={{ fill: '#6e7191', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => formatCurrency(value)}
                  domain={['dataMin', 0]}
                  width={65}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#0f0f1a",
                    border: "1.5px solid #1e1e2e",
                    borderRadius: "12px",
                    color: "#e0e0e0",
                    padding: "10px 14px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                    fontSize: "13px",
                    fontFamily: "'Nunito', system-ui, sans-serif",
                    fontWeight: 600,
                  }}
                  formatter={formatTooltipValue}
                  labelStyle={{ color: '#6e7191', fontSize: '11px' }}
                  cursor={{ stroke: 'rgba(255,31,61,0.3)', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
                <Line
                  type="monotone"
                  dataKey="drawdown"
                  stroke="#FF1F3D"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#FF1F3D', stroke: '#FF1F3D', strokeWidth: 2 }}
                  connectNulls={false}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--dim)]">
              Sem dados para exibir
            </div>
          )}
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-[#FF1F3D]"></div>
            <span className="text-[var(--dim)]">Drawdown máximo (R$)</span>
          </div>
        </div>
      </CardContent>
    </div>
  );
}

// Trade Time Performance - Scatter plot showing performance by time of day
function TradeTimePerformance({ trades, t, formatCurrency }: { trades: Trade[]; t: (key: string) => string; formatCurrency: (value: number) => string }) {
  const timeData = useMemo(() => {
    if (!trades.length) return [];

    // Agrupar trades por horário (hora e minuto)
    const timeGroups: Record<string, number[]> = {};
    
    trades.forEach(trade => {
      const tradeDate = new Date(trade.dataHora);
      const timeKey = `${tradeDate.getHours().toString().padStart(2, '0')}:${tradeDate.getMinutes().toString().padStart(2, '0')}`;
      const resultado = parseFloat(trade.resultado || "0");
      
      if (!timeGroups[timeKey]) {
        timeGroups[timeKey] = [];
      }
      timeGroups[timeKey].push(resultado);
    });

    // Converter para formato do gráfico
    const data = Object.entries(timeGroups).map(([time, results]) => {
      const total = results.reduce((sum, r) => sum + r, 0);
      const avg = total / results.length;
      
      return {
        time,
        value: total,
        average: avg,
        count: results.length,
        color: total >= 0 ? '#6EE000' : '#FF1F3D'
      };
    }).sort((a, b) => a.time.localeCompare(b.time));

    return data;
  }, [trades]);

  if (!trades.length) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-48 text-slate-400">
          <div className="text-center">
            <div className="text-4xl mb-4">⏰</div>
            <p>{t('dashboard.register_trades_for_time_analysis')}</p>
          </div>
        </div>
      </div>
    );
  }

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={Math.max(3, Math.min(payload.count * 1.5, 8))}
        fill={payload.color}
        fillOpacity={0.8}
        stroke={payload.color}
        strokeWidth={1}
      />
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ backgroundColor: '#0f0f1a', border: '1.5px solid #1e1e2e', borderRadius: '12px', padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', fontFamily: "'Nunito', sans-serif" }}>
          <p className="font-medium mb-1 text-white">⏰ {label}</p>
          <p className={`${data.value >= 0 ? 'text-[#6EE000]' : 'text-[#FF1F3D]'}`}>
            💰 Total: {formatCurrency(data.value)}
          </p>
          <p className={`${data.average >= 0 ? 'text-[#6EE000]' : 'text-[#FF1F3D]'}`}>
            📊 Média: {formatCurrency(data.average)}
          </p>
          <p className="text-zinc-300">📈 Trades: {data.count}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 md:p-5 lg:p-6">
      <div className="h-80 sm:h-96 md:h-[420px] lg:h-[480px] xl:h-[520px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={timeData} margin={{ 
            top: 15, 
            right: window.innerWidth < 640 ? 15 : window.innerWidth < 1024 ? 20 : 30, 
            bottom: 25, 
            left: window.innerWidth < 640 ? 15 : window.innerWidth < 1024 ? 20 : 30 
          }}>
            <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#6e7191"
              tick={false}
              height={20}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickLine={false}
            />
            <YAxis
              stroke="#6e7191"
              fontSize={window.innerWidth < 640 ? 9 : window.innerWidth < 1024 ? 10 : 11}
              tickFormatter={(value) => formatCurrency(value)}
              width={window.innerWidth < 640 ? 40 : window.innerWidth < 1024 ? 50 : 60}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6e7191' }}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="gray" strokeWidth={1} strokeDasharray="2 2" />
            
            {/* Linha conectando os pontos */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={window.innerWidth < 640 ? 1.5 : 2}
              dot={false}
              connectNulls={false}
              strokeDasharray="2 4"
            />
            
            {/* Pontos do scatter */}
            <Scatter dataKey="value" shape={<CustomDot />} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {timeData.length > 0 && (
        <div className="mt-4 md:mt-5 lg:mt-6 pt-4 md:pt-5 lg:pt-6 border-t border-[var(--brd)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 lg:gap-6">
            <div className="text-center">
              <div className="text-zinc-400 mb-2 text-xs md:text-sm">Melhor Horário</div>
              <div className="text-[#6EE000] font-medium text-sm md:text-base lg:text-lg">
                {(() => {
                  const best = timeData.reduce((prev, current) => 
                    prev.value > current.value ? prev : current
                  );
                  return `${best.time} (${formatCurrency(best.value)})`;
                })()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-zinc-400 mb-2 text-xs md:text-sm">Pior Horário</div>
              <div className="text-[#FF1F3D] font-medium text-sm md:text-base lg:text-lg">
                {(() => {
                  const worst = timeData.reduce((prev, current) => 
                    prev.value < current.value ? prev : current
                  );
                  return `${worst.time} (${formatCurrency(worst.value)})`;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Métrika Score - Hexagonal radar chart similar to Zella Score
function MetrikaScore({ trades, t, formatCurrency }: { trades: Trade[]; t: (key: string) => string; formatCurrency: (value: number) => string }) {
  const metricsData = useMemo(() => {
    if (!trades.length) return [];

    const winningTrades = trades.filter(t => parseFloat(t.resultado || "0") > 0);
    const losingTrades = trades.filter(t => parseFloat(t.resultado || "0") < 0);
    
    const totalWins = winningTrades.length;
    const totalLosses = losingTrades.length;
    const totalTrades = trades.length;
    
    // 1. Win % (0-100)
    const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
    
    // 2. Profit Factor (0-10, normalizado para 0-100)
    const totalProfits = winningTrades.reduce((sum, t) => sum + parseFloat(t.resultado || "0"), 0);
    const totalLosses_amount = Math.abs(losingTrades.reduce((sum, t) => sum + parseFloat(t.resultado || "0"), 0));
    const profitFactor = totalLosses_amount > 0 ? totalProfits / totalLosses_amount : totalProfits > 0 ? 10 : 0;
    const profitFactorScore = Math.min((profitFactor / 3) * 100, 100); // Normalizar para 0-100
    
    // 3. Avg Win/Loss Ratio (0-10, normalizado para 0-100)
    const avgWin = totalWins > 0 ? totalProfits / totalWins : 0;
    const avgLoss = totalLosses > 0 ? totalLosses_amount / totalLosses : 0;
    const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 10 : 0;
    const winLossScore = Math.min((winLossRatio / 3) * 100, 100);
    
    // 4. Max Drawdown em R$ (invertido - quanto menor melhor, 0-100)
    const totalEquity = trades.reduce((sum, t) => sum + parseFloat(t.resultado || "0"), 0);
    let peak = 0;
    let maxDrawdownValue = 0; // Máximo drawdown em R$
    let currentEquity = 0;
    
    const sortedTrades = [...trades].sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());
    sortedTrades.forEach(trade => {
      currentEquity += parseFloat(trade.resultado || "0");
      if (currentEquity > peak) peak = currentEquity;
      const drawdownValue = peak - currentEquity; // Drawdown em R$
      if (drawdownValue > maxDrawdownValue) maxDrawdownValue = drawdownValue;
    });
    
    // Normalizar drawdown em R$ para score 0-100 (assumindo max R$ 10000 como referência)
    const drawdownScore = Math.max(100 - (maxDrawdownValue / 100), 0);
    
    // 5. Recovery Factor (0-100) = Net Profit / |Max Drawdown em R$|
    let recoveryFactor = 0;
    if (maxDrawdownValue > 0) {
      recoveryFactor = Math.abs(totalEquity) / maxDrawdownValue;
    } else if (totalEquity > 0) {
      recoveryFactor = 10; // Score alto se há lucro sem drawdown
    }
    // Normalizar e cappar para 0-100
    const recoveryScore = Math.min(Math.max((recoveryFactor / 3) * 100, 0), 100);
    
    // 6. Consistency (baseado na variabilidade dos resultados, 0-100)
    const results = trades.map(t => parseFloat(t.resultado || "0"));
    const absResults = results.map(r => Math.abs(r)).filter(r => r > 0);
    let consistencyScore = 0;
    
    if (absResults.length > 1) {
      const avgAbsResult = absResults.reduce((sum, r) => sum + r, 0) / absResults.length;
      const variance = absResults.reduce((sum, r) => sum + Math.pow(r - avgAbsResult, 2), 0) / absResults.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = avgAbsResult > 0 ? stdDev / avgAbsResult : 1;
      consistencyScore = Math.max(100 - (coefficientOfVariation * 100), 0);
    } else if (results.length === 1) {
      consistencyScore = 100; // Um trade é "consistente"
    }
    
    return [
      { metric: t('metrics.win_rate'), value: Math.round(winRate), fullMark: 100 },
      { metric: t('metrics.profit_factor'), value: Math.round(profitFactorScore), fullMark: 100 },
      { metric: t('metrics.avg_win_loss'), value: Math.round(winLossScore), fullMark: 100 },
      { metric: t('metrics.max_drawdown'), value: Math.round(drawdownScore), fullMark: 100 },
      { metric: t('metrics.recovery_factor'), value: Math.round(recoveryScore), fullMark: 100 },
      { metric: t('metrics.consistency'), value: Math.round(consistencyScore), fullMark: 100 },
    ];
  }, [trades]);

  const overallScore = useMemo(() => {
    if (!metricsData.length) return 0;
    const average = metricsData.reduce((sum, m) => sum + m.value, 0) / metricsData.length;
    return Math.round(average);
  }, [metricsData]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#6EE000"; // Verde
    if (score >= 60) return "#eab308"; // Amarelo
    if (score >= 40) return "#f97316"; // Laranja
    return "#FF1F3D"; // Vermelho
  };

  const getGradientId = (score: number) => {
    if (score >= 80) return "greenGradient";
    if (score >= 60) return "yellowGradient";
    if (score >= 40) return "orangeGradient";
    return "redGradient";
  };

  return (
    <div className="w-full">
      <CardContent className="p-4 bg-[var(--card)]">
        {/* Pontuação */}
        <div className="text-center mb-4">
          
          {metricsData.length > 0 ? (
            <>
              {/* Pontuação Principal */}
              <div className="mb-3">
                <div className="text-2xl font-bold text-slate-100 mb-1" data-testid="metrika-score">
                  {overallScore}/100
                </div>
                <div className="text-xs text-slate-400">{t('dashboard.your_metrika_score')}</div>
              </div>
              
              {/* Barra de Progresso Colorida */}
              <div className="relative w-full h-1.5 bg-[var(--brd)] rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full transition-all duration-1000 ease-out"
                  data-testid="metrika-progress-bar"
                  style={{
                    width: `${overallScore}%`,
                    background: `linear-gradient(90deg, 
                      #FF1F3D 0%, 
                      #f97316 25%, 
                      #eab308 50%, 
                      #6EE000 75%, 
                      #6EE000 100%
                    )`,
                    backgroundSize: '400% 100%',
                    backgroundPosition: `${100 - (overallScore / 100) * 100}% 0`
                  }}
                />
              </div>
            </>
          ) : (
            <div className="text-slate-400 text-xs mb-4">
              {t('dashboard.insufficient_data_for_score')}
            </div>
          )}
        </div>

        {/* Radar Chart */}
        <div className="h-52 w-full flex justify-center">
          {metricsData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={metricsData}>
                <defs>
                  <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6EE000" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6EE000" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <PolarGrid 
                  stroke="#374151" 
                  strokeWidth={1}
                />
                <PolarAngleAxis 
                  dataKey="metric" 
                  tick={{ 
                    fontSize: 12, 
                    fill: "#9CA3AF",
                    textAnchor: "middle"
                  }}
                  className="text-xs"
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tick={{ 
                    fontSize: 10, 
                    fill: "#6B7280" 
                  }}
                  tickCount={6}
                />
                <Radar
                  dataKey="value"
                  stroke="#6EE000"
                  fill="url(#radarGradient)"
                  strokeWidth={2}
                  dot={{ 
                    fill: "#6EE000", 
                    strokeWidth: 2, 
                    r: 4 
                  }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                    color: "#F1F5F9",
                  }}
                  formatter={(value: number, name: string) => [
                    `${value}/100`,
                    name
                  ]}
                  labelStyle={{ color: "#CBD5E1" }}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <div className="text-4xl mb-4">📊</div>
                <p>{t('dashboard.register_trades_for_score')}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Distribuição por Mercado */}
        {metricsData.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--brd)]">
            <h4 className="text-sm font-medium text-slate-300 mb-3 text-center">
              {t('dashboard.market_distribution')}
            </h4>
            <div className="space-y-2">
              {(() => {
                // Calcular distribuição por mercado a partir dos trades
                const marketData = {
                  'forex': { total: 0, count: 0, displayName: 'Forex' },
                  'b3': { total: 0, count: 0, displayName: 'B3' },
                  'crypto': { total: 0, count: 0, displayName: 'Crypto' }
                };
                
                trades.forEach(trade => {
                  const result = parseFloat(trade.resultado || "0");
                  const market = trade.mercado || 'forex'; // Padrão para forex se não especificado
                  
                  if (market in marketData) {
                    marketData[market as keyof typeof marketData].total += result;
                    marketData[market as keyof typeof marketData].count += 1;
                  }
                });
                
                const totalTrades = trades.length;
                
                return Object.entries(marketData).map(([market, data]) => {
                  const percentage = totalTrades > 0 ? (data.count / totalTrades * 100) : 0;
                  return (
                    <div key={market} className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-medium">{data.displayName}</span>
                      <div className="text-right">
                        <div className={`font-bold ${
                          data.total >= 0 ? 'text-[#6EE000]' : 'text-[#FF1F3D]'
                        }`}>
                          {formatCurrency(data.total)}
                        </div>
                        <div className="text-slate-500">
                          {data.count} trades ({percentage.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </CardContent>
    </div>
  );
}

// Performance Period Chart Component  
function PerformancePeriodChart({ trades, t, onPeriodFilterChange, formatCurrency }: { 
  trades: Trade[]; 
  t: (key: string) => string;
  onPeriodFilterChange?: (filteredTrades: Trade[]) => void;
  formatCurrency: (value: number) => string;
}) {
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
    if (!trades.length) return [];

    let periodFilteredTrades = trades;
    let groupBy: "day" | "week" | "month" = "day";
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    // Determinar período e granularidade
    switch (selectedPeriod) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        groupBy = "day";
        break;
      case "year":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        endDate = now;
        groupBy = "day"; // Usar granularidade diária para mais detalhes
        break;
      case "specific-month":
        const [yearStr, monthStr] = selectedMonth.split("-");
        const yearNum = parseInt(yearStr, 10);
        const monthNum = parseInt(monthStr, 10);
        const lastDayOfMonth = new Date(yearNum, monthNum, 0).getDate();
        const actualEndDay = Math.min(selectedEndDay, lastDayOfMonth);
        startDate = new Date(yearNum, monthNum - 1, selectedStartDay);
        endDate = new Date(yearNum, monthNum - 1, actualEndDay, 23, 59, 59);
        groupBy = "day";
        break;
      case "month":
      default:
        // Usar range dos trades disponíveis
        const tradeDates = trades.map(t => new Date(t.dataHora).getTime());
        startDate = new Date(Math.min(...tradeDates));
        endDate = new Date(Math.max(...tradeDates));
        groupBy = "day";
        break;
    }

    // Filtrar trades pelo período
    if (startDate && endDate) {
      periodFilteredTrades = trades.filter((trade) => {
        const tradeDate = new Date(trade.dataHora);
        return tradeDate >= startDate! && tradeDate <= endDate!;
      });
    }
    
    console.log('📊 Performance Chart - Trades após filtro:', periodFilteredTrades.length, 'Start:', startDate, 'End:', endDate);

    if (periodFilteredTrades.length === 0) return [];

    // Ordenar trades por data
    const sortedTrades = [...periodFilteredTrades].sort(
      (a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime(),
    );

    // Criar dados do gráfico trade por trade para máximo detalhe
    // O stepAfter cria automaticamente linhas horizontais entre pontos
    let accumulated = 0;
    const chartData: any[] = [];

    sortedTrades.forEach((trade, index) => {
      const tradeDate = new Date(trade.dataHora);
      const resultado = parseFloat(trade.resultado || "0");
      
      accumulated += resultado;
      
      // Formato de label baseado no período selecionado
      const label = selectedPeriod === "year" 
        ? format(tradeDate, "dd/MM/yy", { locale: ptBR })
        : format(tradeDate, "dd/MM", { locale: ptBR });
      
      chartData.push({
        period: label,
        date: tradeDate,
        positive: resultado > 0 ? resultado : 0,
        negative: resultado < 0 ? Math.abs(resultado) : 0,
        total: resultado,
        accumulated,
        accumulatedPositive: accumulated >= 0 ? accumulated : 0,
        accumulatedNegative: accumulated < 0 ? accumulated : 0,
        positiveCount: resultado > 0 ? 1 : 0,
        negativeCount: resultado < 0 ? 1 : 0,
        totalCount: 1,
        hasData: true,
        tradeIndex: index + 1,
      });
    });

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
  const lineColor = isNegative ? "#FF1F3D" : "#6EE000"; // Vermelho se negativo, verde se positivo
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
        <div class="tr-premium-card tr-accent-green p-1.5 w-20 h-16 flex flex-col justify-center items-center text-center">
          <div class="text-xs text-zinc-400 mb-0.5 leading-tight">Lucros</div>
          <div class="text-xs font-bold text-[#6EE000] truncate">
            ${formatCurrency(totalPositive)}
          </div>
          <div class="text-xs text-zinc-500 leading-tight">
            ${totalPositiveCount}
          </div>
        </div>

        <!-- Total de Perdas -->
        <div class="tr-premium-card tr-accent-red p-1.5 w-20 h-16 flex flex-col justify-center items-center text-center">
          <div class="text-xs text-zinc-400 mb-0.5 leading-tight">Perdas</div>
          <div class="text-xs font-bold text-[#FF1F3D] truncate">
            ${formatCurrency(totalNegative)}
          </div>
          <div class="text-xs text-zinc-500 leading-tight">
            ${totalNegativeCount}
          </div>
        </div>

        <!-- Resultado do Período -->
        <div class="tr-premium-card p-1.5 w-20 h-16 flex flex-col justify-center items-center text-center">
          <div class="text-xs text-zinc-400 mb-0.5 leading-tight">Resultado</div>
          <div class="text-xs font-bold truncate ${finalAccumulated >= 0 ? 'text-[#6EE000]' : 'text-[#FF1F3D]'}">
            ${formatCurrency(finalAccumulated)}
          </div>
          <div class="text-xs text-zinc-500 leading-tight">
            ${winRate.toFixed(0)}%
          </div>
        </div>

        <!-- Média por Período -->
        <div class="tr-premium-card tr-accent-blue p-1.5 w-20 h-16 flex flex-col justify-center items-center text-center">
          <div class="text-xs text-zinc-400 mb-0.5 leading-tight">Média</div>
          <div class="text-xs font-bold truncate ${avgPerPeriod >= 0 ? 'text-[#448aff]' : 'text-orange-400'}">
            ${formatCurrency(avgPerPeriod)}
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

  // Notificar mudanças no filtro de período
  useEffect(() => {
    if (onPeriodFilterChange) {
      if (!trades.length) {
        onPeriodFilterChange([]);
        return;
      }

      let periodFilteredTrades = trades;

      // Para "month" (Todos), não aplicar filtro - mostrar todos os trades
      if (selectedPeriod === "month") {
        onPeriodFilterChange(trades);
        return;
      }

      const now = new Date();
      let startDate: Date;
      let endDate: Date;

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
      }

      // Aplicar filtro de período
      periodFilteredTrades = trades.filter((trade) => {
        const tradeDate = new Date(trade.dataHora);
        return tradeDate >= startDate && tradeDate <= endDate;
      });
      
      onPeriodFilterChange(periodFilteredTrades);
    }
  }, [selectedPeriod, selectedMonth, selectedStartDay, selectedEndDay, trades, onPeriodFilterChange]);

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
                ? "bg-[#6EE000] hover:bg-[#5bc800] text-white"
                : "border-[var(--brd)] text-[var(--dim)] hover:bg-[var(--surf)] hover:text-[var(--text)]"
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
          <SelectTrigger className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)] w-32 md:w-40 text-xs md:text-sm">
            <SelectValue placeholder="Mês Específico" />
          </SelectTrigger>
          <SelectContent className="bg-[var(--surf)] border-[var(--brd)]">
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
              <SelectTrigger className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)] w-12 md:w-16 text-xs md:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--surf)] border-[var(--brd)] max-h-40">
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
              <SelectTrigger className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)] w-12 md:w-16 text-xs md:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--surf)] border-[var(--brd)] max-h-40">
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
        <div className="h-[500px] md:h-[550px] flex items-center justify-center text-zinc-400">
          <div className="text-center">
            <BarChart3 className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">{t('empty.no_trades_period')}</p>
          </div>
        </div>
      ) : (
        <div className="relative h-[500px] md:h-[550px]">
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

            // Tooltip personalizado para trade individual
            const CustomTooltip = ({ active, payload, label }: any) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div style={{
                    backgroundColor: "#0f0f1a",
                    border: "1.5px solid #1e1e2e",
                    borderRadius: "12px",
                    padding: "10px 14px",
                    color: "#e0e0e0",
                    minWidth: "150px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                    fontFamily: "'Nunito', sans-serif",
                  }}>
                    <p style={{ margin: 0, fontWeight: "bold", marginBottom: "6px", fontSize: "12px" }}>
                      📅 {label} {data.tradeIndex ? `• Trade #${data.tradeIndex}` : ''}
                    </p>
                    <p style={{ margin: 0, marginBottom: "4px", color: data.total >= 0 ? "#6EE000" : "#FF1F3D", fontSize: "13px" }}>
                      {data.total >= 0 ? "📈" : "📉"} {data.total >= 0 ? "+" : ""}{formatCurrency(data.total)}
                    </p>
                    <p style={{ margin: 0, color: data.accumulated >= 0 ? "#6EE000" : "#FF1F3D", fontSize: "12px", opacity: 0.8 }}>
                      💰 Total: {formatCurrency(data.accumulated)}
                    </p>
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
                    <stop offset="0%" stopColor="#6EE000" />
                    <stop offset={`${zeroPosition}%`} stopColor="#6EE000" />
                    {/* Vermelho abaixo de 0 */}
                    <stop offset={`${zeroPosition}%`} stopColor="#FF1F3D" />
                    <stop offset="100%" stopColor="#FF1F3D" />
                  </linearGradient>
                </defs>

                {/* Eixos */}
                <XAxis
                  dataKey="period"
                  stroke="#6e7191"
                  fontSize={window.innerWidth < 768 ? 8 : 11}
                  angle={-45}
                  textAnchor="end"
                  height={window.innerWidth < 768 ? 50 : 80}
                  tick={{ fill: '#6e7191' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  tickLine={false}
                />

                <YAxis
                  stroke="#6e7191"
                  fontSize={window.innerWidth < 768 ? 9 : 12}
                  tickFormatter={(value) => formatCurrency(value)}
                  tick={{ fill: '#6e7191' }}
                  axisLine={false}
                  tickLine={false}
                />
                
                <RechartsTooltip content={<CustomTooltip />} />

                {/* Linha do eixo 0 */}
                <ReferenceLine y={0} stroke="gray" strokeWidth={1} />

                {/* Área preenchida - stepAfter para manter linha horizontal quando não há operações */}
                <Area
                  type="stepAfter"
                  dataKey="accumulated"
                  stroke="none"
                  fill="url(#dynamicGradient)"
                  fillOpacity={0.3}
                  isAnimationActive={false}
                />

                {/* Linha principal - stepAfter para efeito de degrau como gráfico de trading */}
                <Line
                  type="stepAfter"
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
    <div className={`tr-premium-card ${className.includes('h-') ? '' : 'aspect-square'} ${className}`}>
      <div className="p-4 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between mb-2">
          <div className="tr-stat-label truncate pr-2">
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
      </div>
    </div>
  );
}

// Circular Progress Component
interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

function CircularProgress({ percentage, size = 60, strokeWidth = 4, color = "#6EE000" }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center w-[35px] h-[35px] sm:w-[40px] sm:h-[40px]">
      <svg 
        width={size} 
        height={size} 
        className="transform -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
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
    </div>
  );
}

// Net Daily PnL Bar Chart Component
function NetDailyPnLBarChart({ trades, formatCurrency }: { trades: Trade[]; formatCurrency: (value: number) => string }) {
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
    <div className="w-full h-full min-h-[180px]">
      <ResponsiveContainer width="100%" height="100%" minHeight={180}>
        <BarChart 
          data={dailyData} 
          margin={{ top: 10, right: 8, left: 8, bottom: 20 }}
          barCategoryGap="20%"
        >
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ 
              fontSize: 10, 
              fill: '#9CA3AF',
              textAnchor: 'middle'
            }}
            height={20}
          />
          <YAxis hide />
          <RechartsTooltip
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null;
              
              const value = payload[0].value as number;
              const isPositive = value >= 0;
              
              return (
                <div style={{ backgroundColor: '#0f0f1a', border: '1.5px solid #1e1e2e', borderRadius: '12px', padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
                  <div className="text-xs text-zinc-400 mb-1">
                    {label}
                  </div>
                  <div className={`text-sm font-semibold ${isPositive ? 'text-[#6EE000]' : 'text-[#FF1F3D]'}`}>
                    {isPositive ? '+' : ''}{formatCurrency(Math.abs(value))}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    PnL Diário
                  </div>
                </div>
              );
            }}
            wrapperStyle={{ 
              outline: 'none',
              zIndex: 1000
            }}
          />
          <Bar 
            dataKey="pnl" 
            radius={[3, 3, 0, 0]}
            maxBarSize={30}
          >
            {dailyData.map((entry, index) => (
              <Cell 
                key={index} 
                fill={entry.pnl >= 0 ? '#6EE000' : '#FF1F3D'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Recent Trades Component
function RecentTrades({ trades, formatCurrency, hideData = false }: { trades: Trade[]; formatCurrency: (value: number) => string; hideData?: boolean }) {
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
              className="grid grid-cols-4 gap-2 text-xs px-1 py-1 hover:bg-[var(--surf)]/40 rounded transition-colors"
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
              <div className={`font-medium ${hideData ? 'text-zinc-500' : (result >= 0 ? 'text-[#6EE000]' : 'text-[#FF1F3D]')}`}>
                {hideData ? '•••••' : `${result >= 0 ? '+' : ''}${formatCurrency(result)}`}
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
  const { formatCurrency, formatCurrencyCompact, getCurrencySymbol } = useCurrency();
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
      color: "bg-[#448aff]",
      icon: TrendingUp,
      description: t('broker.forex.description'),
    },
    b3: {
      name: t('broker.b3.name'),
      type: t('broker.b3.type'),
      color: "bg-[#6EE000]",
      icon: BarChart3,
      description: t('broker.b3.description'),
    },
    crypto: {
      name: t('broker.crypto.name'),
      type: t('broker.crypto.type'),
      color: "bg-[#6EE000]",
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
  const [periodFilteredTrades, setPeriodFilteredTrades] = useState<Trade[]>([]);
  const [hideData, setHideData] = useState(false);


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

  // Fetch custom wallets
  const { data: wallets = [] } = useQuery({
    queryKey: ["/api/wallets"],
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

  // Lógica de filtragem avançada (mover para antes de usar)
  const filteredTrades = useMemo(() => {
    let filtered = [...trades];

    if (viewMode === "broker" && selectedBrokerFilter) {
      // Verificar se é uma carteira customizada (formato: wallet:id)
      if (selectedBrokerFilter.startsWith("wallet:")) {
        const walletId = selectedBrokerFilter.replace("wallet:", "");
        filtered = filtered.filter(
          (trade) => trade.walletId === walletId,
        );
      } else {
        // Filtro tradicional por corretora/mercado
        filtered = filtered.filter(
          (trade) => trade.corretora === selectedBrokerFilter,
        );
      }
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6EE000] mx-auto mb-4"></div>
          <p className="text-zinc-400">Carregando dados...</p>
        </div>
      </div>
    );
  }

  // Calcular métricas com base nos trades filtrados pelo período
  const metrics = calculateMetrics(periodFilteredTrades, t);

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
        wallets={Array.isArray(wallets) ? wallets : []}
        onCsvToggle={handleCsvToggle}
        onSelectAllCsvs={handleSelectAllCsvs}
        hideData={hideData}
        onHideDataChange={setHideData}
      />
      <div data-testid="dashboard-overview" className="space-y-4 p-2 sm:p-3 md:p-4 lg:p-6 pb-6 md:pb-8">
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


      <div className="space-y-6 md:space-y-8">
          {/* TradeZella-Style Dashboard - Top Row (Rectangular Cards) */}
          <div data-testid="metrics-cards" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6 mb-6">
            {/* Net PnL */}
            <Card className="tr-premium-card tr-accent-green" data-testid="card-net-pnl">
              <CardContent className="p-3 md:p-4 lg:p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="tr-stat-label">{t('metrics.net_pnl')}</div>
                  <DollarSign className="h-4 w-4 text-zinc-400" />
                </div>
                {(() => {
                  const totalResult = periodFilteredTrades.reduce((sum, t) => sum + parseFloat(t.resultado || '0'), 0);
                  const formattedValue = formatCurrency(totalResult);
                  const valueLength = formattedValue.length;
                  const fontSize = valueLength > 14 ? 'text-sm md:text-base lg:text-lg' : 
                                   valueLength > 11 ? 'text-base md:text-lg lg:text-xl' : 
                                   valueLength > 8 ? 'text-lg md:text-xl lg:text-2xl' : 
                                   'text-xl md:text-2xl lg:text-3xl';
                  const colorClass = totalResult >= 0 ? 'text-[#6EE000]' : 'text-[#FF1F3D]';
                  return (
                    <div className={`${fontSize} font-bold ${hideData ? 'text-zinc-500' : colorClass} whitespace-nowrap overflow-hidden`}>
                      {hideData ? '•••••' : formattedValue}
                    </div>
                  );
                })()}
                <div className="text-xs text-zinc-500 mt-1">
                  {periodFilteredTrades.length} trades
                </div>
              </CardContent>
            </Card>

            {/* Trade Win % - SEMPRE VISÍVEL (não é valor monetário) */}
            <Card className="tr-premium-card tr-accent-blue" data-testid="card-trade-win">
              <CardContent className="p-3 md:p-4 lg:p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="tr-stat-label">{t('dashboard.win_rate')}</div>
                  <Target className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  <div className="text-xl md:text-2xl lg:text-3xl font-bold text-[#ffffff]">
                    {(() => {
                      const winTrades = periodFilteredTrades.filter(t => parseFloat(t.resultado || '0') > 0).length;
                      const totalTrades = periodFilteredTrades.length;
                      const winRate = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0;
                      return (winRate % 1 === 0 ? winRate.toFixed(0) : winRate.toFixed(1)) + '%';
                    })()}
                  </div>
                  <div className="shrink-0 min-w-[35px]">
                    <CircularProgress 
                      percentage={(() => {
                        const winTrades = periodFilteredTrades.filter(t => parseFloat(t.resultado || '0') > 0).length;
                        const totalTrades = periodFilteredTrades.length;
                        return totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0;
                      })()} 
                      size={35}
                      color={(() => {
                        const winTrades = periodFilteredTrades.filter(t => parseFloat(t.resultado || '0') > 0).length;
                        const totalTrades = periodFilteredTrades.length;
                        const winRate = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0;
                        return winRate >= 60 ? "#6EE000" : winRate >= 40 ? "#eab308" : "#FF1F3D";
                      })()}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            

            {/* Day Win % - SEMPRE VISÍVEL (não é valor monetário) */}
            <Card className="tr-premium-card tr-accent-blue" data-testid="card-day-win">
              <CardContent className="p-3 md:p-4 lg:p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="tr-stat-label">{t('metrics.day_win_rate')}</div>
                  <Calendar className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  {(() => {
                    const dailyMap = new Map<string, number>();
                    periodFilteredTrades.forEach(trade => {
                      const date = format(new Date(trade.dataHora), 'yyyy-MM-dd');
                      const result = parseFloat(trade.resultado || '0');
                      dailyMap.set(date, (dailyMap.get(date) || 0) + result);
                    });
                    const totalDays = dailyMap.size;
                    const winningDays = Array.from(dailyMap.values()).filter(pnl => pnl > 0).length;
                    const dayWinRate = totalDays > 0 ? (winningDays / totalDays) * 100 : 0;
                    
                    return (
                      <>
                        <div className="flex flex-col">
                          <div className="text-xl md:text-2xl lg:text-3xl font-bold text-[#fafafa]">
                            {(dayWinRate % 1 === 0 ? dayWinRate.toFixed(0) : dayWinRate.toFixed(1)) + '%'}
                          </div>
                          <div className="text-xs text-zinc-500 mt-1 leading-tight">
                            {`${winningDays} de ${totalDays} dias`}
                          </div>
                        </div>
                        <div className="shrink-0 min-w-[35px]">
                          <CircularProgress 
                            percentage={dayWinRate} 
                            size={35}
                            color={dayWinRate >= 60 ? "#2563eb" : dayWinRate >= 40 ? "#eab308" : "#FF1F3D"}
                          />
                        </div>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* RR Médio - SEMPRE VISÍVEL (não é valor monetário) */}
            <Card className="tr-premium-card tr-accent-orange" data-testid="card-avg-rr">
              <CardContent className="p-3 md:p-4 lg:p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="tr-stat-label">{t('dashboard.avg_rr')}</div>
                  <TrendingUp className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="text-xl md:text-2xl lg:text-3xl font-bold text-white break-words">
                  {metrics.riscoRetornoMedio.toFixed(2)}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {t('metrics.risk_reward')}
                </div>
              </CardContent>
            </Card>

            {/* Average Win/Loss */}
            <Card className="tr-premium-card tr-accent-green" data-testid="card-avg-win-loss">
              <CardContent className="p-3 md:p-4 lg:p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="tr-stat-label">{t('metrics.avg_win_loss')}</div>
                  <Activity className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className={`text-base md:text-lg lg:text-xl font-bold ${hideData ? 'text-zinc-500' : 'text-[#6EE000]'} break-words`}>
                      {hideData ? '+•••' : '+' + (() => {
                        const avgWin = periodFilteredTrades.filter(t => parseFloat(t.resultado || '0') > 0)
                          .reduce((sum, t, _, arr) => sum + parseFloat(t.resultado || '0') / arr.length, 0);
                        return formatCurrency(avgWin);
                      })()}
                    </div>
                    <div className={`text-sm md:text-base font-semibold ${hideData ? 'text-zinc-500' : 'text-[#FF1F3D]'} break-words`}>
                      {hideData ? '-•••' : (() => {
                        const avgLoss = Math.abs(periodFilteredTrades.filter(t => parseFloat(t.resultado || '0') < 0)
                          .reduce((sum, t, _, arr) => sum + parseFloat(t.resultado || '0') / arr.length, 0));
                        return formatCurrency(-avgLoss);
                      })()}
                    </div>
                  </div>
                  {!hideData && (
                    <div className="ml-2 flex items-center">
                      {(() => {
                        const avgWin = periodFilteredTrades.filter(t => parseFloat(t.resultado || '0') > 0)
                          .reduce((sum, t, _, arr) => sum + parseFloat(t.resultado || '0') / arr.length, 0);
                        const avgLoss = Math.abs(periodFilteredTrades.filter(t => parseFloat(t.resultado || '0') < 0)
                          .reduce((sum, t, _, arr) => sum + parseFloat(t.resultado || '0') / arr.length, 0));
                        const maxValue = Math.max(avgWin, avgLoss);
                        const winHeight = maxValue > 0 ? (avgWin / maxValue) * 35 : 0;
                        const lossHeight = maxValue > 0 ? (avgLoss / maxValue) * 35 : 0;
                        
                        return (
                          <div className="flex items-end gap-1 h-10">
                            <div 
                              className="bg-[#6EE000] rounded-sm w-2 transition-all duration-300"
                              style={{ height: `${winHeight}px` }}
                            />
                            <div 
                              className="bg-[#FF1F3D] rounded-sm w-2 transition-all duration-300"
                              style={{ height: `${lossHeight}px` }}
                            />
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart + 4 Metric Blocks - Layout lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Performance por Período - Gráfico (3/4 da largura) */}
            <div className="lg:col-span-3">
              <div className="tr-premium-card tr-accent-blue h-full flex flex-col">
                <div className="px-5 pt-5 pb-3 border-b border-[var(--brd)]/40">
                  <p className="text-sm font-bold text-[var(--text)] tracking-widest uppercase">{t('dashboard.performance_chart')}</p>
                </div>
                <div className="p-4 flex-1">
                  <TradingPerformanceChart
                    trades={filteredTrades}
                    t={t}
                    onPeriodFilterChange={setPeriodFilteredTrades}
                    formatCurrency={formatCurrency}
                    hideData={hideData}
                  />
                </div>
              </div>
            </div>

            {/* 4 Metric Blocks - À direita (1/4 da largura) */}
            <div className="lg:col-span-1">
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 h-full">
                {/* Lucros - valor monetário ocultável, percentual e contagem sempre visíveis */}
                <div className="tr-premium-card p-3 flex flex-col items-center text-center relative">
                  <div className="text-xs text-zinc-400 mb-2">{t('metrics.profits_short')}</div>
                  <div className={`text-lg md:text-xl font-bold ${hideData ? 'text-zinc-500' : 'text-[#6EE000]'} mb-2`}>
                    {hideData ? '•••••' : (() => {
                      const totalPositive = periodFilteredTrades
                        .filter(t => parseFloat(t.resultado || '0') > 0)
                        .reduce((sum, t) => sum + parseFloat(t.resultado || '0'), 0);
                      return formatCurrency(totalPositive);
                    })()}
                  </div>
                  <div className="flex flex-col items-center">
                    {(() => {
                      const winTrades = periodFilteredTrades.filter(t => parseFloat(t.resultado || '0') > 0).length;
                      const totalTrades = periodFilteredTrades.length;
                      const winPercentage = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0;
                      return (
                        <>
                          <CircularProgress 
                            percentage={winPercentage} 
                            size={35}
                            color="#6EE000"
                          />
                          <div className="text-xs text-zinc-500 mt-1">
                            {winPercentage.toFixed(1)}%
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {`${periodFilteredTrades.filter(t => parseFloat(t.resultado || '0') > 0).length} trades`}
                  </div>
                </div>

                {/* Perdas - valor monetário ocultável, percentual e contagem sempre visíveis */}
                <div className="tr-premium-card p-3 flex flex-col items-center text-center relative">
                  <div className="text-xs text-zinc-400 mb-2">{t('metrics.losses_short')}</div>
                  <div className={`text-lg md:text-xl font-bold ${hideData ? 'text-zinc-500' : 'text-[#FF1F3D]'} mb-2`}>
                    {hideData ? '•••••' : (() => {
                      const totalNegative = Math.abs(periodFilteredTrades
                        .filter(t => parseFloat(t.resultado || '0') < 0)
                        .reduce((sum, t) => sum + parseFloat(t.resultado || '0'), 0));
                      return formatCurrency(-totalNegative);
                    })()}
                  </div>
                  <div className="flex flex-col items-center">
                    {(() => {
                      const lossTrades = periodFilteredTrades.filter(t => parseFloat(t.resultado || '0') < 0).length;
                      const totalTrades = periodFilteredTrades.length;
                      const lossPercentage = totalTrades > 0 ? (lossTrades / totalTrades) * 100 : 0;
                      return (
                        <>
                          <CircularProgress 
                            percentage={lossPercentage} 
                            size={35}
                            color="#FF1F3D"
                          />
                          <div className="text-xs text-zinc-500 mt-1">
                            {lossPercentage.toFixed(1)}%
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {`${periodFilteredTrades.filter(t => parseFloat(t.resultado || '0') < 0).length} trades`}
                  </div>
                </div>

                {/* Resultado - valor monetário ocultável, percentual e contagem sempre visíveis */}
                <div className="tr-premium-card p-3 flex flex-col items-center text-center relative">
                  <div className="text-xs text-zinc-400 mb-2">{t('metrics.result')}</div>
                  <div className={`text-lg md:text-xl font-bold mb-2 ${hideData ? 'text-zinc-500' : (() => {
                    const totalResult = periodFilteredTrades.reduce((sum, t) => sum + parseFloat(t.resultado || '0'), 0);
                    return totalResult >= 0 ? 'text-[#6EE000]' : 'text-[#FF1F3D]';
                  })()}`}>
                    {hideData ? '•••••' : (() => {
                      const totalResult = periodFilteredTrades.reduce((sum, t) => sum + parseFloat(t.resultado || '0'), 0);
                      return formatCurrency(totalResult);
                    })()}
                  </div>
                  <div className="flex flex-col items-center">
                    {(() => {
                      const winTrades = periodFilteredTrades.filter(t => parseFloat(t.resultado || '0') > 0).length;
                      const totalTrades = periodFilteredTrades.length;
                      const winRate = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0;
                      const totalResult = periodFilteredTrades.reduce((sum, t) => sum + parseFloat(t.resultado || '0'), 0);
                      const isPositive = totalResult >= 0;
                      return (
                        <>
                          <CircularProgress 
                            percentage={winRate} 
                            size={35}
                            color={isPositive ? "#6EE000" : "#FF1F3D"}
                          />
                          <div className="text-xs text-zinc-500 mt-1">
                            {winRate.toFixed(1)}%
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {`${periodFilteredTrades.length} trades`}
                  </div>
                </div>

                {/* Média - valor monetário ocultável, percentual sempre visível */}
                <div className="tr-premium-card p-3 flex flex-col items-center text-center relative">
                  <div className="text-xs text-zinc-400 mb-2">{t('metrics.average')}</div>
                  <div className={`text-lg md:text-xl font-bold mb-2 ${hideData ? 'text-zinc-500' : (() => {
                    const totalResult = periodFilteredTrades.reduce((sum, t) => sum + parseFloat(t.resultado || '0'), 0);
                    const avgResult = periodFilteredTrades.length > 0 ? totalResult / periodFilteredTrades.length : 0;
                    return avgResult >= 0 ? 'text-[#6EE000]' : 'text-[#FF1F3D]';
                  })()}`}>
                    {hideData ? '•••••' : (() => {
                      const totalResult = periodFilteredTrades.reduce((sum, t) => sum + parseFloat(t.resultado || '0'), 0);
                      const avgResult = periodFilteredTrades.length > 0 ? totalResult / periodFilteredTrades.length : 0;
                      return formatCurrency(avgResult);
                    })()}
                  </div>
                  <div className="flex flex-col items-center">
                    {(() => {
                      const totalResult = periodFilteredTrades.reduce((sum, t) => sum + parseFloat(t.resultado || '0'), 0);
                      const avgResult = periodFilteredTrades.length > 0 ? totalResult / periodFilteredTrades.length : 0;
                      const normalizedPercentage = Math.min(Math.abs(avgResult) * 2, 100);
                      const isPositive = avgResult >= 0;
                      return (
                        <>
                          <CircularProgress 
                            percentage={normalizedPercentage} 
                            size={35}
                            color={isPositive ? "#6EE000" : "#FF1F3D"}
                          />
                          <div className="text-xs text-zinc-500 mt-1">
                            {normalizedPercentage.toFixed(1)}%
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {t('metrics.per_trade')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row - Square Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Progress Tracker - Maior para dar mais espaço ao calendário */}
            <SquareCard
              title={t('metrics.progress_tracker')}
              value=""
              icon={Calendar}
              color="text-[#448aff]"
              className="md:col-span-2 lg:col-span-2 min-h-[500px] lg:min-h-[600px]"
              data-testid="card-progress-tracker"
            >
              <div className="h-full flex flex-col -mx-4 sm:mx-0">
                <div className="flex-1 overflow-hidden min-h-[400px] lg:min-h-[500px]">
                  <TradingCalendar 
                    trades={filteredTrades} 
                    className="scale-100"
                    hideData={hideData}
                  />
                </div>
                
                {/* Métricas adicionais no espaço vazio */}
                <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-[var(--brd)]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-w-full">
                    <div className="tr-premium-card tr-accent-green p-2 sm:p-3 min-h-0 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-zinc-400 text-xs truncate">{t('dashboard.best_trade')}</p>
                          <p className={`text-sm sm:text-lg font-bold ${hideData ? 'text-zinc-500' : 'text-[#6EE000]'} truncate`}>
                            {hideData ? '•••••' : formatCurrency(metrics.melhorTrade)}
                          </p>
                        </div>
                        <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-[#6EE000] flex-shrink-0 ml-2" />
                      </div>
                    </div>

                    <div className="tr-premium-card p-2 sm:p-3 min-h-0 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-zinc-400 text-xs truncate">{t('dashboard.frequent_emotion')}</p>
                          <p className="text-xs sm:text-sm font-bold text-white truncate">
                            {(metrics.emocaoMaisRecorrente.emocao || t('emotion.neutral')).charAt(0).toUpperCase() + (metrics.emocaoMaisRecorrente.emocao || t('emotion.neutral')).slice(1)}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">
                            {metrics.emocaoMaisRecorrente.count} {t('time.times')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SquareCard>

            {/* Métricas Avançadas de Performance - Ao lado do calendário */}
            <SquareCard
              title={t('metrics.advanced_metrics')}
              value=""
              icon={BarChart3}
              color="text-[#6EE000]"
              data-testid="card-advanced-metrics"
              className="md:col-span-2 lg:col-span-1 min-h-[500px] lg:min-h-[600px]"
            >
              <div className="h-full p-3 sm:p-4 space-y-3 sm:space-y-4 overflow-auto">
                {/* Seção 1: Métricas Matemáticas */}
                <div>
                  <AdvancedMetrics trades={periodFilteredTrades} t={t} formatCurrency={formatCurrency} getCurrencySymbol={getCurrencySymbol} />
                </div>
                
                {/* Seção 2: Métrika Score */}
                <div className="border-t border-[var(--brd)] pt-3 sm:pt-4">
                  <div className="text-sm font-semibold text-zinc-300 mb-2 sm:mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    {t('metrics.metrika_score')}
                  </div>
                  <div className="scale-90 sm:scale-100 origin-top">
                    <MetrikaScore trades={periodFilteredTrades} t={t} formatCurrency={formatCurrency} />
                  </div>
                </div>
              </div>
            </SquareCard>

            {/* Mobile: Cards PnL e Trades em layout responsivo */}
            <div className="md:hidden grid grid-cols-1 gap-3">
              {/* PnL Chart Mobile - Card separado */}
              <div className="tr-premium-card tr-accent-green">
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="tr-stat-label">{t('metrics.daily_net_pnl')}</span>
                    <BarChart3 className="h-4 w-4 text-[#6EE000]" />
                  </div>
                  <div className="h-48 overflow-hidden">
                    <NetDailyPnLBarChart trades={periodFilteredTrades} formatCurrency={formatCurrency} />
                  </div>
                </div>
              </div>

              {/* Recent Trades Mobile - Card separado */}
              <div className="tr-premium-card">
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="tr-stat-label">{t('dashboard.recent_trades')}</span>
                    <FileText className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div className="h-48 overflow-hidden">
                    <RecentTrades trades={periodFilteredTrades} formatCurrency={formatCurrency} hideData={hideData} />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Trade Time Performance + PnL e Trades Recentes - Lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trade Time Performance - 2 colunas */}
            <div className="lg:col-span-2">
              <div className="tr-premium-card tr-accent-blue h-full flex flex-col">
                <div className="px-5 pt-5 pb-3 flex items-center gap-2 border-b border-[var(--brd)]/40">
                  <Activity className="h-5 w-5 text-[#448aff] opacity-70" />
                  <p className="tr-section-label" style={{ color: '#448aff', marginBottom: 0 }}>{t('metrics.trade_time_performance')}</p>
                </div>
                <TradeTimePerformance trades={periodFilteredTrades} t={t} formatCurrency={formatCurrency} />
              </div>
            </div>

            {/* PnL e Trades Recentes - 1 coluna à direita */}
            <div className="lg:col-span-1">
              <div className="flex flex-col gap-4 h-full">
                {/* Net Daily PnL Chart */}
                <SquareCard
                  title={t('metrics.daily_net_pnl')}
                  value=""
                  icon={BarChart3}
                  color="text-[#6EE000]"
                  data-testid="card-daily-pnl-chart"
                  className="h-[280px] flex-shrink-0"
                >
                  <div className="h-full overflow-hidden min-h-[200px]">
                    <NetDailyPnLBarChart trades={periodFilteredTrades} formatCurrency={formatCurrency} />
                  </div>
                </SquareCard>

                {/* Recent Trades */}
                <SquareCard
                  title={t('dashboard.recent_trades')}
                  value=""
                  icon={FileText}
                  color="text-zinc-400"
                  data-testid="card-recent-trades"
                  className="flex-1 min-h-[280px]"
                >
                  <div className="h-full overflow-auto">
                    <RecentTrades trades={periodFilteredTrades} formatCurrency={formatCurrency} hideData={hideData} />
                  </div>
                </SquareCard>
              </div>
            </div>
          </div>

          {/* Gráfico de Rentabilidade e Análise de Volume */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Curva de Capital */}
            <div className="tr-premium-card tr-accent-green">
              <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-[var(--brd)]/40">
                <div>
                  <p className="tr-section-label">{t('dashboard.capital_curve')}</p>
                  <span className="text-[var(--text)] font-black text-xl tracking-tight leading-none">
                    {formatCurrency(periodFilteredTrades.reduce((s, tr) => s + parseFloat(tr.resultado || '0'), 0))}
                  </span>
                </div>
                <LineChart className="h-5 w-5 text-[#6EE000] opacity-70" />
              </div>
              <CapitalCurveChart trades={periodFilteredTrades} t={t} formatCurrency={formatCurrency} />
            </div>

            {/* Gráfico de Drawdown */}
            <div className="tr-premium-card tr-accent-red">
              <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-[var(--brd)]/40">
                <div>
                  <p className="tr-section-label">{t('metrics.drawdown')}</p>
                  <span className="text-[var(--r)] font-black text-xl tracking-tight leading-none">
                    {(() => {
                      let peak = 0, cum = 0, maxDD = 0;
                      [...periodFilteredTrades].sort((a,b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())
                        .forEach(tr => { cum += parseFloat(tr.resultado||'0'); if(cum>peak)peak=cum; const dd=peak-cum; if(dd>maxDD)maxDD=dd; });
                      return maxDD > 0 ? `−${formatCurrency(maxDD)}` : '—';
                    })()}
                  </span>
                </div>
                <TrendingDown className="h-5 w-5 text-[#FF1F3D] opacity-70" />
              </div>
              <DrawdownChart trades={periodFilteredTrades} t={t} formatCurrency={formatCurrency} />
            </div>
          </div>
      </div>

      {/* Dialog de Edição de Trade Manual */}
      <Dialog open={showEditTradeDialog} onOpenChange={setShowEditTradeDialog}>
        <DialogContent className="bg-[var(--card)] border-[var(--brd)] text-[var(--text)] max-w-md">
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
                  className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)]"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Mercado</Label>
                <div className="px-3 py-2 bg-[var(--surf)]/50 border border-[var(--brd)] rounded-md text-sm text-zinc-400">
                  {editingTrade.mercado === 'crypto' ? '🪙 Crypto' : 
                   editingTrade.mercado === 'forex' ? '💱 Forex' : 
                   '📊 B3 (Brasil)'}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-datahora">Data/Hora</Label>
                <Input
                  id="edit-datahora"
                  type="datetime-local"
                  value={editingTrade.dataHora ? (() => {
                    const date = new Date(editingTrade.dataHora);
                    const offset = date.getTimezoneOffset() * 60000;
                    const localDate = new Date(date.getTime() - offset);
                    return localDate.toISOString().slice(0, 16);
                  })() : ''}
                  onChange={(e) => {
                    setEditingTrade({...editingTrade, dataHora: new Date(e.target.value).toISOString()});
                  }}
                  className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-tipo">{t('trades.type')}</Label>
                <Select 
                  value={editingTrade.tipo || ''} 
                  onValueChange={(value) => setEditingTrade({...editingTrade, tipo: value})}
                >
                  <SelectTrigger className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)]">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--surf)] border-[var(--brd)]">
                    <SelectItem value="compra" className="text-white">Compra</SelectItem>
                    <SelectItem value="venda" className="text-white">Venda</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-capital">Capital Arriscado (R$)</Label>
                  <Input
                    id="edit-capital"
                    type="number"
                    step="0.01"
                    value={editingTrade.capitalUtilizado || ''}
                    onChange={(e) => setEditingTrade({...editingTrade, capitalUtilizado: e.target.value})}
                    className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-resultado">{t('metrics.result')} (R$)</Label>
                  <Input
                    id="edit-resultado"
                    type="number"
                    step="0.01"
                    value={editingTrade.resultado || ''}
                    onChange={(e) => setEditingTrade({...editingTrade, resultado: e.target.value})}
                    className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-quantidade">{t('trades.quantity')}</Label>
                  <Input
                    id="edit-quantidade"
                    type="number"
                    step="0.01"
                    value={editingTrade.quantidade || ''}
                    onChange={(e) => setEditingTrade({...editingTrade, quantidade: e.target.value})}
                    className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-entrada">Preço Entrada</Label>
                  <Input
                    id="edit-entrada"
                    type="number"
                    step="0.0001"
                    value={editingTrade.precoEntrada || ''}
                    onChange={(e) => setEditingTrade({...editingTrade, precoEntrada: e.target.value})}
                    className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-saida">Preço Saída</Label>
                  <Input
                    id="edit-saida"
                    type="number"
                    step="0.0001"
                    value={editingTrade.precoSaida || ''}
                    onChange={(e) => setEditingTrade({...editingTrade, precoSaida: e.target.value})}
                    className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-stop">Stop Loss</Label>
                  <Input
                    id="edit-stop"
                    type="number"
                    step="0.0001"
                    value={editingTrade.stop || ''}
                    onChange={(e) => setEditingTrade({...editingTrade, stop: e.target.value})}
                    className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-alvo">Alvo (Target)</Label>
                  <Input
                    id="edit-alvo"
                    type="number"
                    step="0.0001"
                    value={editingTrade.alvo || ''}
                    onChange={(e) => setEditingTrade({...editingTrade, alvo: e.target.value})}
                    className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-setup">Setup</Label>
                  <Input
                    id="edit-setup"
                    value={editingTrade.setup || ''}
                    onChange={(e) => setEditingTrade({...editingTrade, setup: e.target.value})}
                    className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-comentario">Comentário</Label>
                <Input
                  id="edit-comentario"
                  value={editingTrade.comentario || ''}
                  onChange={(e) => setEditingTrade({...editingTrade, comentario: e.target.value})}
                  className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)]"
                  placeholder="Observações sobre o trade..."
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
              className="border-[var(--brd)] text-[var(--dim)] hover:bg-[var(--surf)]"
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
                      dataHora: editingTrade.dataHora,
                      resultado: parseFloat(editingTrade.resultado || '0'),
                      quantidade: parseFloat(editingTrade.quantidade || '0'),
                      capitalUtilizado: editingTrade.capitalUtilizado || '0',
                      precoEntrada: editingTrade.precoEntrada || '0',
                      precoSaida: editingTrade.precoSaida || '0',
                      stop: editingTrade.stop || '0',
                      alvo: editingTrade.alvo || '0',
                      setup: editingTrade.setup || '',
                      comentario: editingTrade.comentario || '',
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
