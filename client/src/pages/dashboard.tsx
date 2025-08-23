import { useState, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  CheckSquare
} from "lucide-react";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ComposedChart } from 'recharts';
import { type Trade } from "@shared/schema";
import { TradingCalendar } from "@/components/ui/trading-calendar";
import { SmartReprocessButton } from "@/components/SmartReprocessButton";
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BrokerStats {
  totalTrades: number;
  totalProfit: number;
  winRate: number;
}

const brokerInfo = {
  "forex": {
    name: "Forex",
    type: "Câmbio",
    color: "bg-blue-500", 
    icon: TrendingUp,
    description: "Trading Forex com importação CSV"
  },
  "b3": {
    name: "B3",
    type: "Ações BR",
    color: "bg-green-500",
    icon: BarChart3,
    description: "Ações brasileiras B3 com importação CSV"
  },
  "crypto": {
    name: "Crypto",
    type: "Criptomoedas",
    color: "bg-green-500",
    icon: Activity,
    description: "Trading de criptomoedas com importação CSV"
  }
};

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
  'confiante': '●',
  'ansioso': '▲',
  'impulsivo': '♦',
  'calmo': '◆',
  'eufórico': '★',
  'frustrado': '■',
  'neutro': '○'
};

// Capital Curve Chart - Professional Trading Analytics
function CapitalCurveChart({ trades }: { trades: Trade[] }) {
  const [timeFilter, setTimeFilter] = useState<'dia' | 'semana' | 'mes' | 'ano'>('mes');

  const chartData = useMemo(() => {
    if (!trades.length) return [];

    // Ordenar trades por data
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime()
    );

    // Função para agrupar dados baseado no filtro
    const groupDataByPeriod = () => {
      const groups = new Map();
      let cumulativeProfit = 0;

      sortedTrades.forEach(trade => {
        const tradeDate = new Date(trade.dataHora);
        const profit = parseFloat(trade.resultado || "0");
        cumulativeProfit += profit;

        let periodKey: string;
        let periodLabel: string;

        switch (timeFilter) {
          case 'dia':
            periodKey = format(startOfDay(tradeDate), 'yyyy-MM-dd');
            periodLabel = format(tradeDate, 'dd/MM', { locale: ptBR });
            break;
          case 'semana':
            periodKey = format(startOfWeek(tradeDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
            periodLabel = format(startOfWeek(tradeDate, { weekStartsOn: 1 }), 'dd/MM', { locale: ptBR });
            break;
          case 'mes':
            periodKey = format(startOfMonth(tradeDate), 'yyyy-MM');
            periodLabel = format(tradeDate, 'MMM/yy', { locale: ptBR });
            break;
          case 'ano':
            periodKey = format(startOfYear(tradeDate), 'yyyy');
            periodLabel = format(tradeDate, 'yyyy', { locale: ptBR });
            break;
        }

        if (!groups.has(periodKey)) {
          groups.set(periodKey, {
            period: periodLabel,
            date: periodKey,
            profit: 0,
            cumulativeProfit: 0,
            trades: 0
          });
        }

        const group = groups.get(periodKey);
        group.profit += profit;
        group.cumulativeProfit = cumulativeProfit;
        group.trades += 1;
      });

      return Array.from(groups.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    };

    return groupDataByPeriod();
  }, [trades, timeFilter]);

  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'cumulativeProfit') {
      return [`R$ ${value.toFixed(2)}`, 'Rentabilidade Acumulada'];
    }
    return [`R$ ${value.toFixed(2)}`, 'Resultado do Período'];
  };

  return (
    <div className="w-full">
      <CardContent className="p-6">
        {/* Filtros de Tempo */}
        <div className="flex justify-end gap-2 mb-4">
          {[
            { key: 'dia', label: 'Dia' },
            { key: 'semana', label: 'Semana' },
            { key: 'mes', label: 'Mês' },
            { key: 'ano', label: 'Ano' }
          ].map(filter => (
            <Button
              key={filter.key}
              variant={timeFilter === filter.key ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeFilter(filter.key as any)}
              className={timeFilter === filter.key ? 
                "bg-neutral-primary hover:bg-neutral-secondary" : 
                "border-charcoal-600 text-charcoal-300 hover:bg-charcoal-800"
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
              <RechartsLineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="period" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#F1F5F9'
                  }}
                  formatter={formatTooltipValue}
                  labelStyle={{ color: '#CBD5E1' }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeProfit"
                  stroke="#22c55e"
                  strokeWidth={3}
                  dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                  strokeDasharray="5 5"
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-400">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum dado para exibir</p>
                <p className="text-sm">Registre alguns trades para ver o gráfico</p>
              </div>
            </div>
          )}
        </div>

        {/* Legenda */}
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-green-500"></div>
            <span className="text-slate-300">Rentabilidade Acumulada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-green-500 border-dashed"></div>
            <span className="text-slate-300">Resultado do Período</span>
          </div>
        </div>
      </CardContent>
    </div>
  );
}

// Performance Period Chart Component
function PerformancePeriodChart({ trades }: { trades: Trade[] }) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year' | 'specific-month'>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  
  const getChartData = () => {
    if (!trades.length) return [];
    
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let groupBy: 'day' | 'week' | 'month';
    
    switch (selectedPeriod) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        groupBy = 'day';
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
        groupBy = 'day';
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        endDate = now;
        groupBy = 'month';
        break;
      case 'specific-month':
        const selectedDate = new Date(selectedMonth + '-01');
        startDate = startOfMonth(selectedDate);
        endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
        groupBy = 'day';
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
        groupBy = 'day';
    }
    
    // Filtrar trades por período
    const filteredTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.dataHora);
      return tradeDate >= startDate && tradeDate <= endDate;
    });
    
    if (filteredTrades.length === 0) return [];
    
    // Ordenar trades por data
    const sortedTrades = [...filteredTrades].sort((a, b) => 
      new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime()
    );
    
    // Agrupar trades por período
    const groups = new Map<string, { trades: Trade[], date: Date }>();
    
    sortedTrades.forEach(trade => {
      const tradeDate = new Date(trade.dataHora);
      let key: string;
      
      if (groupBy === 'day') {
        key = format(tradeDate, 'dd/MM', { locale: ptBR });
      } else if (groupBy === 'month') {
        key = format(tradeDate, 'MMM/yy', { locale: ptBR });
      } else {
        key = format(tradeDate, 'dd/MM', { locale: ptBR });
      }
      
      if (!groups.has(key)) {
        groups.set(key, { trades: [], date: tradeDate });
      }
      groups.get(key)!.trades.push(trade);
    });
    
    // Criar dados do gráfico com valores individuais e acumulados
    let accumulated = 0;
    const chartData: any[] = [];
    
    Array.from(groups.entries()).forEach(([period, { trades: periodTrades }]) => {
      const positives = periodTrades.filter(t => parseFloat(t.resultado || "0") > 0);
      const negatives = periodTrades.filter(t => parseFloat(t.resultado || "0") < 0);
      
      const totalPositive = positives.reduce((sum, t) => sum + parseFloat(t.resultado || "0"), 0);
      const totalNegative = negatives.reduce((sum, t) => sum + parseFloat(t.resultado || "0"), 0);
      const periodTotal = totalPositive + totalNegative;
      
      accumulated += periodTotal;
      
      chartData.push({
        period,
        positive: totalPositive,
        negative: Math.abs(totalNegative),
        total: periodTotal,
        accumulated,
        positiveCount: positives.length,
        negativeCount: negatives.length,
        totalCount: periodTrades.length
      });
    });
    
    return chartData;
  };

  const chartData = getChartData();
  const maxValue = Math.max(
    ...chartData.map(d => Math.max(d.positive, d.negative, Math.abs(d.accumulated)))
  );
  const yAxisDomain = maxValue > 0 ? [-maxValue * 1.1, maxValue * 1.1] : [-100, 100];

  return (
    <div className="w-full">
      {/* Filtros de Período */}
      <div className="flex justify-center gap-1 md:gap-2 mb-4 md:mb-6 flex-wrap">
        {[
          { key: 'week', label: '7 Dias' },
          { key: 'month', label: '30 Dias' },
          { key: 'year', label: '1 Ano' },
          { key: 'specific-month', label: 'Mês Específico' }
        ].map(filter => (
          <Button
            key={filter.key}
            variant={selectedPeriod === filter.key ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPeriod(filter.key as 'week' | 'month' | 'year' | 'specific-month')}
            className={`text-xs md:text-sm ${selectedPeriod === filter.key ? 
              "bg-purple-600 hover:bg-purple-700 text-white" : 
              "border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Seletor de Mês Específico */}
      {selectedPeriod === 'specific-month' && (
        <div className="flex justify-center mb-4 md:mb-6">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white w-36 md:w-48 text-sm">
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              {(() => {
                const months = [];
                const now = new Date();
                
                // Criar lista dos últimos 24 meses
                for (let i = 0; i < 24; i++) {
                  const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                  const value = format(date, 'yyyy-MM');
                  const label = format(date, 'MMMM yyyy', { locale: ptBR });
                  months.push({ value, label });
                }
                
                return months.map(month => (
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
      )}
      
      {chartData.length === 0 ? (
        <div className="h-[550px] md:h-[380px] flex items-center justify-center text-zinc-400">
          <div className="text-center">
            <BarChart3 className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Nenhum trade no período selecionado</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 550 : 380}>
          <AreaChart data={chartData} margin={{ 
            top: window.innerWidth < 768 ? 0 : 10, 
            right: window.innerWidth < 768 ? -8 : 30, 
            left: window.innerWidth < 768 ? -8 : 50, 
            bottom: window.innerWidth < 768 ? 25 : 60 
          }}>
            <defs>
              <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.3}/>
              </linearGradient>
              <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.8}/>
              </linearGradient>
              <linearGradient id="accumulatedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.4} />
            
            <XAxis 
              dataKey="period"
              stroke="#9CA3AF"
              fontSize={window.innerWidth < 768 ? 8 : 11}
              angle={-45}
              textAnchor="end"
              height={window.innerWidth < 768 ? 50 : 80}
              tick={{ fill: '#e2e8f0' }}
              axisLine={{ stroke: '#64748b', strokeWidth: 1 }}
            />
            
            <YAxis 
              stroke="#9CA3AF"
              fontSize={window.innerWidth < 768 ? 9 : 12}
              tick={{ fill: '#cbd5e1' }}
              tickFormatter={(value) => window.innerWidth < 768 ? 
                `${(value/1000).toFixed(0)}k` : 
                `R$ ${(value/1000).toFixed(1)}k`
              }
              domain={yAxisDomain}
              axisLine={{ stroke: '#64748b', strokeWidth: 1 }}
            />
            
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                padding: '12px'
              }}
              labelStyle={{ color: '#e2e8f0', fontWeight: 'bold', marginBottom: '8px' }}
              formatter={(value: any, name: string) => {
                const formattedValue = `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                const displayName = name === 'positive' ? '✅ Lucros' : 
                                  name === 'negative' ? '❌ Perdas' :
                                  name === 'accumulated' ? '📊 Acumulado' : name;
                return [formattedValue, displayName];
              }}
              content={(props: any) => {
                const { active, payload, label } = props;
                if (!active || !payload || !payload.length) return null;
                
                const data = payload[0].payload;
                const isMobile = window.innerWidth < 768;
                
                return (
                  <div className={`bg-zinc-800 border border-zinc-600 rounded-lg shadow-xl ${
                    isMobile ? 'p-2 text-xs max-w-[250px]' : 'p-3 text-sm max-w-[320px]'
                  }`}>
                    <p className={`text-white font-bold mb-2 ${isMobile ? 'text-xs truncate' : 'text-sm'}`}>
                      {label}
                    </p>
                    <div className={`space-y-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      <div className="flex justify-between gap-2">
                        <span className="text-green-400 truncate">✅ Lucros:</span>
                        <span className="text-green-400 font-semibold shrink-0">
                          R$ {isMobile ? 
                            data.positive.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) :
                            data.positive.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                          }
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-red-400 truncate">❌ Perdas:</span>
                        <span className="text-red-400 font-semibold shrink-0">
                          -R$ {isMobile ? 
                            data.negative.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) :
                            data.negative.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                          }
                        </span>
                      </div>
                      <div className="border-t border-zinc-600 pt-1 mt-1">
                        <div className="flex justify-between gap-2">
                          <span className="text-zinc-300 truncate">Total:</span>
                          <span className={`font-semibold shrink-0 ${data.total >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            R$ {isMobile ? 
                              data.total.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) :
                              data.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                            }
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-blue-400 truncate">📊 Acumulado:</span>
                          <span className={`font-bold shrink-0 ${data.accumulated >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                            R$ {isMobile ? 
                              data.accumulated.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) :
                              data.accumulated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                            }
                          </span>
                        </div>
                      </div>
                      <div className={`border-t border-zinc-600 pt-1 mt-1 text-zinc-400 ${
                        isMobile ? 'text-xs' : 'text-xs'
                      }`}>
                        <div>Trades: {data.totalCount} ({data.positiveCount}✅/{data.negativeCount}❌)</div>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            
            {/* Barras de lucros */}
            <Area 
              type="monotone" 
              dataKey="positive" 
              stackId="1"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#positiveGradient)"
            />
            
            {/* Barras de perdas (negativo) */}
            <Area 
              type="monotone" 
              dataKey={(data: any) => -data.negative} 
              stackId="1"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#negativeGradient)"
            />
            
            {/* Linha acumulada */}
            <Line 
              type="monotone" 
              dataKey="accumulated" 
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
      
      {/* Resumo abaixo do gráfico */}
      {chartData.length > 0 && (
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <div className="text-xs text-zinc-400 mb-1">Total de Lucros</div>
            <div className="text-xl font-bold text-green-400">
              R$ {chartData.reduce((sum, d) => sum + d.positive, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              {chartData.reduce((sum, d) => sum + d.positiveCount, 0)} trades
            </div>
          </div>
          
          <div className="text-center p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <div className="text-xs text-zinc-400 mb-1">Total de Perdas</div>
            <div className="text-xl font-bold text-red-400">
              -R$ {chartData.reduce((sum, d) => sum + d.negative, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              {chartData.reduce((sum, d) => sum + d.negativeCount, 0)} trades
            </div>
          </div>
          
          <div className="text-center p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <div className="text-xs text-zinc-400 mb-1">Resultado Período</div>
            <div className={`text-xl font-bold ${chartData[chartData.length - 1]?.accumulated >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              R$ {chartData[chartData.length - 1]?.accumulated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              Taxa: {((chartData.reduce((sum, d) => sum + d.positiveCount, 0) / chartData.reduce((sum, d) => sum + d.totalCount, 0)) * 100).toFixed(1)}% acerto
            </div>
          </div>
          
          <div className="text-center p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <div className="text-xs text-zinc-400 mb-1">Média por Dia</div>
            <div className={`text-xl font-bold ${(chartData[chartData.length - 1]?.accumulated / chartData.length) >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
              R$ {(chartData[chartData.length - 1]?.accumulated / chartData.length || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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

function calculateMetrics(trades: Trade[]): TradeMetrics {
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
      lucroPorDiaSemana: []
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
  const tradesRecentes = trades.filter(trade => new Date(trade.dataHora) >= oneWeekAgo);
  const tradesMes = trades.filter(trade => new Date(trade.dataHora) >= oneMonthAgo);
  const tradesAno = trades.filter(trade => new Date(trade.dataHora) >= oneYearAgo);

  const rentabilidadeSemana = tradesRecentes.reduce((acc, trade) => 
    acc + parseFloat(trade.resultado || "0"), 0);
  const rentabilidadeMes = tradesMes.reduce((acc, trade) => 
    acc + parseFloat(trade.resultado || "0"), 0);
  const rentabilidadeAno = tradesAno.reduce((acc, trade) => 
    acc + parseFloat(trade.resultado || "0"), 0);

  // Melhor e pior trade
  const resultados = trades.map(trade => parseFloat(trade.resultado || "0"));
  const melhorTrade = Math.max(...resultados);
  const piorTrade = Math.min(...resultados);

  // Taxa de acerto
  const tradesLucrativos = trades.filter(trade => parseFloat(trade.resultado || "0") > 0);
  const taxaAcerto = (tradesLucrativos.length / trades.length) * 100;

  // R/R médio baseado nos valores de Take e Stop dos trades
  const tradesComTakeStop = trades.filter(trade => 
    trade.alvo && trade.stop && 
    parseFloat(trade.alvo) > 0 && parseFloat(trade.stop) > 0
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
    const lucros = trades.filter(trade => parseFloat(trade.resultado || "0") > 0);
    const perdas = trades.filter(trade => parseFloat(trade.resultado || "0") < 0);
    
    const lucroMedio = lucros.length > 0 
      ? lucros.reduce((acc, trade) => acc + parseFloat(trade.resultado || "0"), 0) / lucros.length 
      : 0;
    const perdaMedia = perdas.length > 0 
      ? Math.abs(perdas.reduce((acc, trade) => acc + parseFloat(trade.resultado || "0"), 0) / perdas.length)
      : 0;
    
    riscoRetornoMedio = perdaMedia > 0 ? lucroMedio / perdaMedia : 0;
  }

  // Setup mais lucrativo
  const setupLucros = trades.reduce((acc, trade) => {
    const setup = trade.setup || 'Não definido';
    const resultado = parseFloat(trade.resultado || "0");
    if (!acc[setup]) acc[setup] = 0;
    acc[setup] += resultado;
    return acc;
  }, {} as Record<string, number>);

  const setupMaisLucrativo = Object.entries(setupLucros).reduce((best, [setup, total]) => {
    if (total > best.total) {
      return { setup, total, percent: (total / rentabilidadeTotal) * 100 };
    }
    return best;
  }, { setup: "", total: 0, percent: 0 });

  // Emoção mais recorrente
  const emocoesCount = trades.reduce((acc, trade) => {
    const emocao = trade.emocao || 'neutro';
    acc[emocao] = (acc[emocao] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const emocaoMaisRecorrente = Object.entries(emocoesCount).reduce((most, [emocao, count]) => {
    if (count > most.count) {
      return { emocao, count };
    }
    return most;
  }, { emocao: "", count: 0 });

  // Lucro por dia da semana
  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const lucroPorDia = trades.reduce((acc, trade) => {
    const dia = new Date(trade.dataHora).getDay();
    const resultado = parseFloat(trade.resultado || "0");
    acc[dia] += resultado;
    return acc;
  }, new Array(7).fill(0));

  const lucroPorDiaSemana = diasSemana.map((dia, index) => ({
    dia,
    valor: lucroPorDia[index]
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
    lucroPorDiaSemana
  };
}

function calculateBrokerStats(trades: Trade[]): BrokerStats {
  if (!trades.length) {
    return { totalTrades: 0, totalProfit: 0, winRate: 0 };
  }

  const totalTrades = trades.length;
  const totalProfit = trades.reduce((sum, trade) => sum + parseFloat(trade.resultado || "0"), 0);
  const winningTrades = trades.filter(trade => parseFloat(trade.resultado || "0") > 0).length;
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

function MetricCard({ title, value, icon: Icon, color = "text-white", subtitle }: MetricCardProps) {
  return (
    <Card className="bg-zinc-900/90 border-zinc-800 hover:bg-zinc-900/95 transition-colors min-w-0">
      <CardHeader className="pb-1 md:pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs md:text-sm font-medium text-zinc-400 truncate pr-1">
            {title}
          </CardTitle>
          <Icon className={`h-3 w-3 md:h-4 md:w-4 flex-shrink-0 ${color || 'text-zinc-400'}`} />
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-2 md:pb-4">
        <div className={`text-xs md:text-2xl font-bold ${color} truncate leading-tight`}>
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-zinc-500 mt-1 hidden md:block truncate">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get current user ID for isolation info
  const currentUserId = localStorage.getItem('user-id') || 'default-user';
  
  // Estados para o sistema de filtros avançados
  const [selectedBrokerFilter, setSelectedBrokerFilter] = useState<string | null>(null);
  const [selectedCsvIds, setSelectedCsvIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'broker' | 'csv'>('all');
  const [editingCsv, setEditingCsv] = useState<{id: string; currentName: string} | null>(null);
  const [newCsvName, setNewCsvName] = useState('');

  // Fetch trades data
  const { data: trades = [], isLoading } = useQuery<Trade[]>({
    queryKey: ['/api/trades']
  });

  // Fetch trades by broker for broker analysis
  const { data: tradesByBroker = {} } = useQuery({
    queryKey: ['/api/trades/by-broker']
  });

  // Fetch CSV imports
  const { data: csvImports = [] } = useQuery({
    queryKey: ['/api/csv-imports']
  });

  // Mutation para renomear CSV
  const renameCsvMutation = useMutation({
    mutationFn: async ({ csvId, displayName }: { csvId: string; displayName: string }) => {
      return apiRequest('PATCH', `/api/csv-imports/${csvId}/rename`, { displayName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/csv-imports'] });
      setEditingCsv(null);
      setNewCsvName('');
      toast({
        title: "CSV renomeado com sucesso",
        description: "O nome do arquivo foi atualizado."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao renomear",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation para deletar CSV
  const deleteCsvMutation = useMutation({
    mutationFn: async (csvId: string) => {
      return apiRequest('DELETE', `/api/csv-imports/${csvId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/csv-imports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trades/by-broker'] });
      toast({
        title: "CSV excluído com sucesso",
        description: "O arquivo CSV e todos os trades relacionados foram removidos."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir o CSV",
        variant: "destructive"
      });
    }
  });

  // Lógica de filtragem avançada
  const filteredTrades = useMemo(() => {
    let filtered = [...trades];
    
    if (viewMode === 'broker' && selectedBrokerFilter) {
      filtered = filtered.filter(trade => trade.corretora === selectedBrokerFilter);
    }
    
    if (viewMode === 'csv' && selectedCsvIds.length > 0) {
      // Filtrar por trades que vieram dos CSVs selecionados usando csvImportId
      filtered = filtered.filter(trade => 
        trade.csvImportId && selectedCsvIds.includes(trade.csvImportId)
      );
    }
    
    return filtered;
  }, [trades, viewMode, selectedBrokerFilter, selectedCsvIds, csvImports]);

  // Reset dashboard mutation
  const resetDashboardMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', '/api/trades/reset-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trades/by-broker'] });
      queryClient.invalidateQueries({ queryKey: ['/api/csv-imports'] });
      toast({
        title: "Dashboard Completamente Resetada",
        description: "Todos os dados foram deletados: trades, importações CSV e configurações de API. Você pode começar do zero agora."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao resetar",
        description: "Não foi possível resetar a dashboard: " + error.message,
        variant: "destructive"
      });
    }
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
  const metrics = calculateMetrics(filteredTrades);

  // Componente de Filtros Avançados
  const AdvancedFilters = () => {
    const handleCsvToggle = (csvId: string) => {
      setSelectedCsvIds(prev => 
        prev.includes(csvId) 
          ? prev.filter(id => id !== csvId)
          : [...prev, csvId]
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
      setEditingCsv({ id: csv.id, currentName: csv.displayName || csv.fileName });
      setNewCsvName(csv.displayName || csv.fileName);
    };

    const handleRename = () => {
      if (editingCsv && newCsvName.trim()) {
        renameCsvMutation.mutate({ 
          csvId: editingCsv.id, 
          displayName: newCsvName.trim() 
        });
      }
    };

    return (
      <Card className="bg-transparent border-transparent mb-2">
        <CardContent className="p-2">
          <div className="max-w-xs">
            {/* Dropdown de Visualização */}
            <div className="space-y-1">
              <Select value={viewMode} onValueChange={(value: 'all' | 'broker' | 'csv') => {
                setViewMode(value);
                if (value !== 'broker') setSelectedBrokerFilter(null);
                if (value !== 'csv') setSelectedCsvIds([]);
              }}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm">
                  <SelectValue placeholder="Selecione o modo de visualização" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all" className="text-white hover:bg-zinc-700">
                    Consolidar Todos os Dados
                  </SelectItem>
                  <SelectItem value="broker" className="text-white hover:bg-zinc-700">
                    Filtrar por Corretora
                  </SelectItem>
                  <SelectItem value="csv" className="text-white hover:bg-zinc-700">
                    Filtrar por CSVs Importados
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {/* Dropdown de Corretoras */}
              {viewMode === 'broker' && (
                <div className="space-y-1">
                  <Select value={selectedBrokerFilter || ''} onValueChange={setSelectedBrokerFilter}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm">
                      <SelectValue placeholder="Selecione uma corretora" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="b3" className="text-white hover:bg-zinc-700">
                        B3 - Ações Brasileiras
                      </SelectItem>
                      <SelectItem value="crypto" className="text-white hover:bg-zinc-700">
                        Crypto - Criptomoedas
                      </SelectItem>
                      <SelectItem value="forex" className="text-white hover:bg-zinc-700">
                        Forex - Câmbio
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Seletor de CSVs */}
              {viewMode === 'csv' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleSelectAllCsvs}
                      className="text-zinc-400 hover:text-white text-xs h-6 px-2"
                    >
                      <CheckSquare className="w-3 h-3 mr-1" />
                      {selectedCsvIds.length === (csvImports as any[]).length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                    </Button>
                  </div>
                  
                  {(csvImports as any[]).length === 0 ? (
                    <div className="text-center py-2 text-zinc-500">
                      <p className="text-xs">Nenhum CSV importado ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {(csvImports as any[]).map((csv: any) => (
                        <div key={csv.id} className="flex items-center space-x-2 p-2 bg-zinc-800/30 rounded border border-zinc-700/50 hover:bg-zinc-700/30 transition-colors">
                          <Checkbox 
                            checked={selectedCsvIds.includes(csv.id)}
                            onCheckedChange={() => handleCsvToggle(csv.id)}
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
                  )}
                  
                  {selectedCsvIds.length > 0 && (
                    <div className="mt-1 p-1 bg-green-900/20 border border-green-700/50 rounded text-center">
                      <p className="text-green-400 text-xs font-medium">
                        ✓ {selectedCsvIds.length} CSV{selectedCsvIds.length > 1 ? 's' : ''}
                      </p>
                    </div>
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
    <div className="space-y-3 md:space-y-4 lg:space-y-6 p-3 md:p-4 lg:p-6 pb-6 md:pb-8">
      <div className="flex flex-col gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-400 mt-1 md:mt-2 text-xs md:text-sm lg:text-base">
            {viewMode === 'all' && 'Dados consolidados de todas as corretoras'}
            {viewMode === 'broker' && selectedBrokerFilter && `Mostrando dados da ${brokerInfo[selectedBrokerFilter as keyof typeof brokerInfo]?.name}`}
            {viewMode === 'csv' && selectedCsvIds.length > 0 && `Filtrando por ${selectedCsvIds.length} CSV${selectedCsvIds.length > 1 ? 's' : ''} selecionado${selectedCsvIds.length > 1 ? 's' : ''}`}
            {viewMode === 'csv' && selectedCsvIds.length === 0 && 'Selecione CSVs para visualizar'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Smart Reprocess Button */}
          {trades.length > 0 && (
            <SmartReprocessButton 
              userId={currentUserId}
              onSuccess={() => {
                toast({
                  title: "Dados Atualizados",
                  description: "Todos os dados foram reprocessados com interpretação inteligente."
                });
              }}
            />
          )}
        </div>
      </div>

      {/* Componente de Filtros Avançados */}
      <AdvancedFilters />

      <Tabs defaultValue="overview" className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-slate-800 border-zinc-800 h-auto">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700 text-xs md:text-sm py-2">Visão Geral</TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-slate-700 text-xs md:text-sm py-2">Insights</TabsTrigger>
          <TabsTrigger value="brokers" className="data-[state=active]:bg-slate-700 text-xs md:text-sm py-2">Gestão</TabsTrigger>
          <TabsTrigger value="imports" className="data-[state=active]:bg-slate-700 text-xs md:text-sm py-2">Importações</TabsTrigger>
          <TabsTrigger value="consolidated" className="data-[state=active]:bg-slate-700 text-xs md:text-sm py-2 col-span-2 md:col-span-1">Consolidado</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 md:space-y-6">
          {/* Main Metrics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <MetricCard
              title="Rentabilidade Total"
              value={window.innerWidth < 768 ? 
                Math.abs(metrics.rentabilidadeTotal) >= 1000 ?
                  `R$${(metrics.rentabilidadeTotal/1000).toFixed(1)}k` :
                  `R$${metrics.rentabilidadeTotal.toFixed(0)}` :
                `R$ ${metrics.rentabilidadeTotal.toFixed(2)}`
              }
              icon={DollarSign}
              color={metrics.rentabilidadeTotal >= 0 ? "text-green-400" : "text-red-400"}
              subtitle="Resultado geral"
            />
            
            <MetricCard
              title="Total de Trades"
              value={metrics.totalTrades}
              icon={BarChart3}
              color="text-zinc-300"
              subtitle="Operações realizadas"
            />
            
            <MetricCard
              title="Taxa de Acerto"
              value={`${metrics.taxaAcerto.toFixed(1)}%`}
              icon={Target}
              color="text-white"
              subtitle="Precisão das operações"
            />
            
            <MetricCard
              title="R/R Médio"
              value={`${metrics.riscoRetornoMedio.toFixed(2)}:1`}
              icon={TrendingUp}
              color="text-white"
              subtitle="Risco vs Retorno"
            />
          </div>

          {/* Performance Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
            <Card className="bg-zinc-900/90 border-zinc-800 hover:bg-zinc-900/95 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm">Melhor Trade</p>
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
                    <p className="text-zinc-400 text-sm">Pior Trade</p>
                    <p className="text-2xl font-bold text-red-400">
                      R$ {metrics.piorTrade.toFixed(2)}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/90 border-zinc-800 hover:bg-zinc-900/95 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm">Setup Top</p>
                    <p className="text-lg font-bold text-green-400">
                      {metrics.setupMaisLucrativo.setup || 'N/A'}
                    </p>
                    <p className="text-sm text-zinc-500">
                      R$ {metrics.setupMaisLucrativo.total.toFixed(2)}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/90 border-zinc-800 hover:bg-zinc-900/95 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm">Emoção Frequente</p>
                    <p className="text-lg font-bold text-white flex items-center gap-1">
                      {simbolosEmocoes[metrics.emocaoMaisRecorrente.emocao as keyof typeof simbolosEmocoes] || '○'} 
                      {metrics.emocaoMaisRecorrente.emocao || 'neutro'}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {metrics.emocaoMaisRecorrente.count} vezes
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-white" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance por Período - Gráfico Visual */}
          <Card className="bg-zinc-900/90 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-400" />
                Performance por Período
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 md:px-6">
              <PerformancePeriodChart trades={filteredTrades} />
            </CardContent>
          </Card>

          {/* Distribuição por Mercado */}
          <Card className="bg-zinc-900/90 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-400" />
                Distribuição por Mercado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(brokerInfo).map(([broker, info]) => {
                  const brokerTrades = filteredTrades.filter((t: Trade) => t.corretora === broker);
                  const brokerResult = brokerTrades.reduce((sum: number, t: Trade) => sum + parseFloat(t.resultado || "0"), 0);
                  const percentage = filteredTrades.length > 0 ? (brokerTrades.length / filteredTrades.length) * 100 : 0;
                  
                  return (
                    <div key={broker} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${info.color}`}></div>
                        <span className="text-slate-300">{info.name}</span>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${brokerResult >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          R$ {brokerResult.toFixed(2)}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {brokerTrades.length} trades ({percentage.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Trading Calendar */}
          <TradingCalendar trades={filteredTrades} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Main Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Rentabilidade Total"
              value={`R$ ${metrics.rentabilidadeTotal.toFixed(2)}`}
              icon={DollarSign}
              color={metrics.rentabilidadeTotal >= 0 ? "text-green-400" : "text-red-400"}
            />
            
            <MetricCard
              title="Total de Trades"
              value={metrics.totalTrades}
              icon={BarChart3}
              color="text-zinc-300"
            />
            
            <MetricCard
              title="Taxa de Acerto"
              value={`${metrics.taxaAcerto.toFixed(1)}%`}
              icon={Target}
              color={metrics.taxaAcerto >= 50 ? "text-green-400" : "text-red-400"}
            />
            
            <MetricCard
              title="R/R Médio"
              value={`${metrics.riscoRetornoMedio.toFixed(2)}:1`}
              icon={TrendingUp}
              color={metrics.riscoRetornoMedio >= 2 ? "text-green-400" : "text-white"}
            />
          </div>

          {/* Gráfico de Rentabilidade e Análise de Volume */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Rentabilidade ao Longo do Tempo */}
            <Card className="bg-zinc-900/90 border-zinc-800 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-zinc-400" />
                  Curva de Capital
                </CardTitle>
              </CardHeader>
              <CapitalCurveChart trades={filteredTrades} />
            </Card>


          </div>

          {/* Análise Temporal Detalhada */}
          <Card className="bg-zinc-900/90 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-sm md:text-base">
                <Calendar className="h-4 w-4 md:h-5 md:w-5 text-green-400" />
                Performance Temporal Detalhada
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
                  <div className="text-xs text-zinc-400 mb-1 md:mb-2">Trades Hoje</div>
                  <div className={`text-xs md:text-sm font-semibold ${
                    (() => {
                      const hoje = new Date();
                      const resultadoHoje = filteredTrades.filter((t: Trade) => {
                        const tradeDate = new Date(t.dataHora);
                        return tradeDate.toDateString() === hoje.toDateString();
                      }).reduce((sum: number, t: Trade) => sum + parseFloat(t.resultado || "0"), 0);
                      return resultadoHoje >= 0 ? 'text-green-400' : 'text-red-400';
                    })()
                  }`}>
                    R$ {(() => {
                      const hoje = new Date();
                      const resultadoHoje = filteredTrades.filter((t: Trade) => {
                        const tradeDate = new Date(t.dataHora);
                        return tradeDate.toDateString() === hoje.toDateString();
                      }).reduce((sum: number, t: Trade) => sum + parseFloat(t.resultado || "0"), 0);
                      return resultadoHoje.toFixed(2);
                    })()}
                  </div>
                </div>

                <div className="text-center p-2 md:p-4 bg-zinc-800/50 rounded-lg">
                  <div className="text-lg md:text-2xl font-bold text-white mb-1">
                    {metrics.rentabilidadeSemana.toFixed(2)}
                  </div>
                  <div className="text-xs text-zinc-400 mb-1 md:mb-2">Esta Semana</div>
                  <div className={`text-xs md:text-sm font-semibold ${metrics.rentabilidadeSemana >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    R$ {metrics.rentabilidadeSemana.toFixed(2)}
                  </div>
                </div>

                <div className="text-center p-2 md:p-4 bg-zinc-800/50 rounded-lg">
                  <div className="text-lg md:text-2xl font-bold text-white mb-1">
                    {metrics.rentabilidadeMes.toFixed(2)}
                  </div>
                  <div className="text-xs text-zinc-400 mb-1 md:mb-2">Este Mês</div>
                  <div className={`text-xs md:text-sm font-semibold ${metrics.rentabilidadeMes >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    R$ {metrics.rentabilidadeMes.toFixed(2)}
                  </div>
                </div>

                <div className="text-center p-2 md:p-4 bg-zinc-800/50 rounded-lg">
                  <div className="text-lg md:text-2xl font-bold text-white mb-1">
                    {metrics.rentabilidadeAno.toFixed(2)}
                  </div>
                  <div className="text-xs text-zinc-400 mb-1 md:mb-2">Este Ano</div>
                  <div className={`text-xs md:text-sm font-semibold ${metrics.rentabilidadeAno >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    R$ {metrics.rentabilidadeAno.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brokers" className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {Object.entries(brokerInfo).map(([broker, info]) => {
              const trades = (tradesByBroker as any)[broker] || [];
              const stats = calculateBrokerStats(trades);
              const IconComponent = info.icon;

              return (
                <Card key={broker} className="bg-zinc-900/90 border-zinc-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${info.color}`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-white">{info.name}</CardTitle>
                          <CardDescription>{info.description}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary">{info.type}</Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
                      <div className="min-w-0">
                        <div className="text-sm md:text-2xl font-bold text-white">{stats.totalTrades}</div>
                        <div className="text-xs text-zinc-400">Trades</div>
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs md:text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'} break-all`}>
                          {stats.totalProfit >= 0 ? '+' : ''}R${window.innerWidth < 768 ? 
                            Math.abs(stats.totalProfit) >= 1000 ? 
                              `${(stats.totalProfit/1000).toFixed(1)}k` :
                              stats.totalProfit.toFixed(0) :
                            stats.totalProfit.toFixed(2)
                          }
                        </div>
                        <div className="text-xs text-zinc-400">Resultado</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm md:text-2xl font-bold text-blue-400">{stats.winRate.toFixed(1)}%</div>
                        <div className="text-xs text-zinc-400">Win Rate</div>
                      </div>
                    </div>

                    <Separator className="bg-slate-700" />

                    <div className="flex justify-between items-center">
                      <div className="flex space-x-1">
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="imports" className="space-y-4">
          <Card className="bg-zinc-900/90 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Histórico de Importações CSV</CardTitle>
              <CardDescription>Acompanhe suas importações de dados</CardDescription>
            </CardHeader>
            <CardContent>
              {(csvImports as any[]).length === 0 ? (
                <div className="text-center py-8 text-zinc-400">
                  Nenhuma importação realizada ainda
                </div>
              ) : (
                <div className="space-y-4">
                  {(csvImports as any[]).map((importItem: any) => (
                    <div key={importItem.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${importItem.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <div>
                          {editingCsv?.id === importItem.id ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={newCsvName}
                                onChange={(e) => setNewCsvName(e.target.value)}
                                className="bg-zinc-800 border border-zinc-600 text-white px-2 py-1 rounded text-sm"
                                placeholder="Nome do arquivo"
                                data-testid={`input-csv-name-${importItem.id}`}
                              />
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (newCsvName.trim()) {
                                    renameCsvMutation.mutate({ 
                                      csvId: importItem.id, 
                                      displayName: newCsvName.trim() 
                                    });
                                  }
                                }}
                                disabled={renameCsvMutation.isPending}
                                className="h-7 px-2"
                                data-testid={`button-save-csv-${importItem.id}`}
                              >
                                ✓
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingCsv(null);
                                  setNewCsvName('');
                                }}
                                className="h-7 px-2"
                                data-testid={`button-cancel-csv-${importItem.id}`}
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <div className="font-medium text-white">{importItem.displayName || importItem.fileName}</div>
                          )}
                          <div className="text-sm text-zinc-400">
                            {brokerInfo[importItem.broker as keyof typeof brokerInfo]?.name || importItem.broker}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <div className="text-white">{importItem.tradesImported} trades</div>
                          <div className="text-xs text-zinc-400">
                            {new Date(importItem.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        {editingCsv?.id !== importItem.id && (
                          <div className="flex space-x-1 ml-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingCsv({ id: importItem.id, currentName: importItem.displayName || importItem.fileName });
                                setNewCsvName(importItem.displayName || importItem.fileName);
                              }}
                              className="h-7 px-2 text-zinc-400 hover:text-white"
                              data-testid={`button-edit-csv-${importItem.id}`}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (confirm(`Tem certeza que deseja excluir "${importItem.displayName || importItem.fileName}"?\n\nEsta ação irá deletar:\n• O arquivo CSV\n• Todos os trades relacionados a este CSV\n\nEsta ação não pode ser desfeita.`)) {
                                  deleteCsvMutation.mutate(importItem.id);
                                }
                              }}
                              disabled={deleteCsvMutation.isPending}
                              className="h-7 px-2 text-red-400 hover:text-red-300 border-red-400 hover:border-red-300"
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consolidated" className="space-y-6">
          {/* Resumo Consolidado */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Resultado Total Consolidado"
              value={`R$ ${metrics.rentabilidadeTotal.toFixed(2)}`}
              icon={DollarSign}
              color={metrics.rentabilidadeTotal >= 0 ? "text-green-400" : "text-red-400"}
              subtitle="Soma de todas as corretoras"
            />
            
            <MetricCard
              title="Total de Trades"
              value={metrics.totalTrades}
              icon={BarChart3}
              color="text-zinc-300"
              subtitle="Crypto + Forex + B3"
            />
            
            <MetricCard
              title="Taxa de Acerto Geral"
              value={`${metrics.taxaAcerto.toFixed(1)}%`}
              icon={Target}
              color={metrics.taxaAcerto >= 50 ? "text-green-400" : "text-red-400"}
              subtitle="Média ponderada"
            />
            
            <MetricCard
              title="R/R Médio Consolidado"
              value={`${metrics.riscoRetornoMedio.toFixed(2)}:1`}
              icon={TrendingUp}
              color={metrics.riscoRetornoMedio >= 2 ? "text-green-400" : "text-white"}
              subtitle="Risco/Retorno geral"
            />
          </div>

          {/* Performance por Corretora */}
          <Card className="bg-zinc-900/90 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building className="h-5 w-5 text-green-400" />
                Performance por Corretora
              </CardTitle>
              <CardDescription>Comparativo de resultados entre as corretoras</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(brokerInfo).map(([broker, info]) => {
                  const trades = (tradesByBroker as any)[broker] || [];
                  const stats = calculateBrokerStats(trades);
                  const IconComponent = info.icon;
                  
                  return (
                    <div key={broker} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${info.color}`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-medium">{info.name}</div>
                          <div className="text-zinc-400 text-sm">{info.description}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                          <div className="text-lg font-bold text-white">{stats.totalTrades}</div>
                          <div className="text-xs text-zinc-400">Trades</div>
                        </div>
                        <div>
                          <div className={`text-lg font-bold ${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {stats.totalProfit >= 0 ? '+' : ''}R$ {stats.totalProfit.toFixed(2)}
                          </div>
                          <div className="text-xs text-zinc-400">Resultado</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-400">{stats.winRate.toFixed(1)}%</div>
                          <div className="text-xs text-zinc-400">Win Rate</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Distribuição por Mercado */}
          <Card className="bg-zinc-900/90 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-400" />
                Distribuição por Mercado
              </CardTitle>
              <CardDescription>Análise consolidada dos diferentes mercados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['crypto', 'forex', 'b3'].map((mercado) => {
                  const tradesMercado = trades.filter((trade: Trade) => trade.mercado === mercado);
                  const totalMercado = tradesMercado.reduce((sum: number, trade: Trade) => sum + parseFloat(trade.resultado || "0"), 0);
                  const countMercado = tradesMercado.length;
                  const winRateMercado = countMercado > 0 ? 
                    (tradesMercado.filter((trade: Trade) => parseFloat(trade.resultado || "0") > 0).length / countMercado) * 100 : 0;
                  
                  const mercadoInfo = {
                    crypto: { name: 'Crypto', color: 'text-white' },
                    forex: { name: 'Forex', color: 'text-blue-400' },
                    b3: { name: 'B3', color: 'text-green-400' }
                  };
                  
                  const info = mercadoInfo[mercado as keyof typeof mercadoInfo];
                  
                  return (
                    <div key={mercado} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${info.color.replace('text-', 'bg-')}`}></div>
                        <div>
                          <div className="text-white font-medium">{info.name}</div>
                          <div className="text-zinc-400 text-sm">{countMercado} trades</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className={`text-lg font-bold ${totalMercado >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {totalMercado >= 0 ? '+' : ''}R$ {totalMercado.toFixed(2)}
                          </div>
                          <div className="text-xs text-zinc-400">Resultado</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${info.color}`}>
                            {winRateMercado.toFixed(1)}%
                          </div>
                          <div className="text-xs text-zinc-400">Win Rate</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Ações da Dashboard */}
          <Card className="bg-zinc-900/90 border-zinc-800">
            <CardContent className="pt-6 space-y-3">
              <Button 
                className="w-full gradient-purple-blue hover:opacity-90 transition-opacity"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/trades/by-broker'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/csv-imports'] });
                  toast({
                    title: "Dados Atualizados",
                    description: "Dados consolidados de todas as corretoras foram atualizados com sucesso."
                  });
                }}
              >
                <Sync className="w-4 h-4 mr-2" />
                Atualizar Dados Consolidados
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="w-full bg-red-600 hover:bg-red-700"
                    data-testid="button-reset-dashboard"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Resetar Dashboard
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-800 border-zinc-800">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Resetar Dashboard Completamente</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-300">
                      Esta ação irá <strong>deletar TODOS os dados permanentemente</strong>:<br/>
                      • Todos os trades de todas as corretoras<br/>
                      • Histórico completo de importações CSV<br/>
                      • Todas as configurações de API das corretoras<br/>
                      <br/>
                      Você começará completamente do zero. <strong>Esta ação não pode ser desfeita</strong>.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-slate-700 border-zinc-700 text-white hover:bg-slate-600">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => resetDashboardMutation.mutate()}
                      data-testid="button-confirm-reset"
                    >
                      Sim, resetar tudo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}