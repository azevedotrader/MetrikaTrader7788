import { useState, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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
  Trash2
} from "lucide-react";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { type Trade } from "@shared/schema";
import { TradingCalendar } from "@/components/ui/trading-calendar";
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
    color: "bg-purple-500",
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

const emojiEmocoes = {
  'confiante': '😎',
  'ansioso': '😰',
  'impulsivo': '🔥',
  'calmo': '😌',
  'eufórico': '🤩',
  'frustrado': '😤',
  'neutro': '😐'
};

// Componente do gráfico de rentabilidade ao longo do tempo
function ProfitabilityTimeChart({ trades }: { trades: Trade[] }) {
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
                "bg-purple-600 hover:bg-purple-700" : 
                "border-slate-600 text-slate-300 hover:bg-slate-800"
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
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2 }}
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
            <div className="flex items-center justify-center h-full text-slate-400">
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
            <div className="w-3 h-0.5 bg-purple-500"></div>
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
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-slate-400">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-slate-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1">
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
  const [selectedBrokerFilter, setSelectedBrokerFilter] = useState<string | null>(null);

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
        title: "Dashboard Resetada",
        description: "Todos os trades foram deletados. Você pode começar do zero agora."
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
          <p className="text-slate-400">Carregando dados...</p>
        </div>
      </div>
    );
  }

  // Filter trades based on selected broker
  const filteredTrades = selectedBrokerFilter 
    ? trades.filter((trade: Trade) => trade.corretora === selectedBrokerFilter)
    : trades;

  const metrics = calculateMetrics(filteredTrades);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-2">
            {selectedBrokerFilter 
              ? `Mostrando dados da ${brokerInfo[selectedBrokerFilter as keyof typeof brokerInfo]?.name}`
              : 'Dados consolidados de todas as corretoras'
            }
          </p>
        </div>
        
        <div className="flex gap-2">
          {/* Consolidated Data Button */}
          <Button 
            className={`gradient-purple-blue hover:opacity-90 transition-opacity ${
              selectedBrokerFilter === null ? 'ring-2 ring-purple-400' : ''
            }`}
            onClick={() => {
              setSelectedBrokerFilter(null);
              toast({
                title: "Dados Consolidados",
                description: "Mostrando dados de todas as corretoras somados."
              });
            }}
          >
            <Building className="w-4 h-4 mr-2" />
            📊 Consolidar Todas
          </Button>

          {/* Broker Filter Buttons */}
          {Object.entries(brokerInfo).map(([broker, info]) => {
            const IconComponent = info.icon;
            return (
              <Button 
                key={broker}
                variant="outline"
                className={`${info.color.replace('bg-', 'border-').replace('500', '600')} text-white hover:${info.color} ${
                  selectedBrokerFilter === broker ? `ring-2 ring-purple-400 ${info.color}` : ''
                }`}
                onClick={() => {
                  setSelectedBrokerFilter(broker);
                  toast({
                    title: `${info.name} Selecionado`,
                    description: `Dashboard mostrando apenas dados da ${info.name}.`
                  });
                }}
              >
                <IconComponent className="w-4 h-4 mr-2" />
                {broker === 'crypto' ? '🪙' : broker === 'forex' ? '💱' : '📈'} {info.name}
              </Button>
            );
          })}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800 border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">Visão Geral</TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-slate-700">Insights Detalhados</TabsTrigger>
          <TabsTrigger value="brokers" className="data-[state=active]:bg-slate-700">Gestão</TabsTrigger>
          <TabsTrigger value="imports" className="data-[state=active]:bg-slate-700">Importações</TabsTrigger>
          <TabsTrigger value="consolidated" className="data-[state=active]:bg-slate-700">Consolidado</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Main Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="💰 Rentabilidade Total"
              value={`R$ ${metrics.rentabilidadeTotal.toFixed(2)}`}
              icon={DollarSign}
              color={metrics.rentabilidadeTotal >= 0 ? "text-green-400" : "text-red-400"}
              subtitle="Resultado geral"
            />
            
            <MetricCard
              title="📊 Total de Trades"
              value={metrics.totalTrades}
              icon={BarChart3}
              subtitle="Operações realizadas"
            />
            
            <MetricCard
              title="🎯 Taxa de Acerto"
              value={`${metrics.taxaAcerto.toFixed(1)}%`}
              icon={Target}
              color={metrics.taxaAcerto >= 50 ? "text-green-400" : "text-red-400"}
              subtitle="Precisão das operações"
            />
            
            <MetricCard
              title="🔁 R/R Médio"
              value={`${metrics.riscoRetornoMedio.toFixed(2)}:1`}
              icon={TrendingUp}
              color={metrics.riscoRetornoMedio >= 2 ? "text-green-400" : "text-yellow-400"}
              subtitle="Risco vs Retorno"
            />
          </div>

          {/* Performance Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Melhor Trade</p>
                    <p className="text-2xl font-bold text-green-400">
                      R$ {metrics.melhorTrade.toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Pior Trade</p>
                    <p className="text-2xl font-bold text-red-400">
                      R$ {metrics.piorTrade.toFixed(2)}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Setup Top</p>
                    <p className="text-lg font-bold text-purple-400">
                      {metrics.setupMaisLucrativo.setup || 'N/A'}
                    </p>
                    <p className="text-sm text-slate-500">
                      R$ {metrics.setupMaisLucrativo.total.toFixed(2)}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Emoção Frequente</p>
                    <p className="text-lg font-bold text-blue-400 flex items-center gap-1">
                      {emojiEmocoes[metrics.emocaoMaisRecorrente.emocao as keyof typeof emojiEmocoes] || '😐'} 
                      {metrics.emocaoMaisRecorrente.emocao || 'neutro'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {metrics.emocaoMaisRecorrente.count} vezes
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance por Período */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-400" />
                📅 Performance por Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                  <div className="text-3xl font-bold text-white mb-2">
                    R$ {metrics.rentabilidadeSemana.toFixed(2)}
                  </div>
                  <div className="text-sm text-slate-400 mb-1">Esta Semana</div>
                  <div className={`text-sm font-semibold ${metrics.rentabilidadeSemana >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {metrics.rentabilidadeSemana >= 0 ? '+' : ''}{metrics.rentabilidadeSemana.toFixed(2)}
                  </div>
                </div>

                <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                  <div className="text-3xl font-bold text-white mb-2">
                    R$ {metrics.rentabilidadeMes.toFixed(2)}
                  </div>
                  <div className="text-sm text-slate-400 mb-1">Este Mês</div>
                  <div className={`text-sm font-semibold ${metrics.rentabilidadeMes >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {metrics.rentabilidadeMes >= 0 ? '+' : ''}{metrics.rentabilidadeMes.toFixed(2)}
                  </div>
                </div>

                <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                  <div className="text-3xl font-bold text-white mb-2">
                    R$ {metrics.rentabilidadeAno.toFixed(2)}
                  </div>
                  <div className="text-sm text-slate-400 mb-1">Este Ano</div>
                  <div className={`text-sm font-semibold ${metrics.rentabilidadeAno >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {metrics.rentabilidadeAno >= 0 ? '+' : ''}{metrics.rentabilidadeAno.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Distribuição por Mercado */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-400" />
                📈 Distribuição por Mercado
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
                        <div className="text-xs text-slate-500">
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
              title="💰 Rentabilidade Total"
              value={`R$ ${metrics.rentabilidadeTotal.toFixed(2)}`}
              icon={DollarSign}
              color={metrics.rentabilidadeTotal >= 0 ? "text-green-400" : "text-red-400"}
            />
            
            <MetricCard
              title="📊 Total de Trades"
              value={metrics.totalTrades}
              icon={BarChart3}
            />
            
            <MetricCard
              title="🎯 Taxa de Acerto"
              value={`${metrics.taxaAcerto.toFixed(1)}%`}
              icon={Target}
              color={metrics.taxaAcerto >= 50 ? "text-green-400" : "text-red-400"}
            />
            
            <MetricCard
              title="🔁 R/R Médio"
              value={`${metrics.riscoRetornoMedio.toFixed(2)}:1`}
              icon={TrendingUp}
              color={metrics.riscoRetornoMedio >= 2 ? "text-green-400" : "text-yellow-400"}
            />
          </div>

          {/* Gráfico de Rentabilidade e Análise de Volume */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Rentabilidade ao Longo do Tempo */}
            <Card className="bg-slate-900/50 border-slate-700 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-purple-400" />
                  📈 Rentabilidade ao Longo do Tempo
                </CardTitle>
              </CardHeader>
              <ProfitabilityTimeChart trades={filteredTrades} />
            </Card>

            {/* Análise de Volume */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-purple-400" />
                  💰 Análise de Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Capital Total Investido</span>
                    <span className="text-blue-400 font-semibold">
                      R$ {filteredTrades.reduce((sum: number, t: Trade) => sum + parseFloat(t.capitalUtilizado || "0"), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Ticket Médio</span>
                    <span className="text-purple-400 font-semibold">
                      R$ {filteredTrades.length > 0 ? (filteredTrades.reduce((sum: number, t: Trade) => sum + parseFloat(t.capitalUtilizado || "0"), 0) / filteredTrades.length).toFixed(2) : "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">ROI Total</span>
                    <span className={`font-semibold ${
                      metrics.rentabilidadeTotal >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {filteredTrades.reduce((sum: number, t: Trade) => sum + parseFloat(t.capitalUtilizado || "0"), 0) > 0 ? 
                        ((metrics.rentabilidadeTotal / filteredTrades.reduce((sum: number, t: Trade) => sum + parseFloat(t.capitalUtilizado || "0"), 0)) * 100).toFixed(2) : "0.00"}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Análise Temporal Detalhada */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-400" />
                📅 Performance Temporal Detalhada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                  <div className="text-2xl font-bold text-white mb-1">
                    {(() => {
                      const hoje = new Date();
                      const tradesHoje = filteredTrades.filter((t: Trade) => {
                        const tradeDate = new Date(t.dataHora);
                        return tradeDate.toDateString() === hoje.toDateString();
                      });
                      return tradesHoje.length;
                    })()}
                  </div>
                  <div className="text-xs text-slate-400 mb-2">Trades Hoje</div>
                  <div className={`text-sm font-semibold ${
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

                <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                  <div className="text-2xl font-bold text-white mb-1">
                    {metrics.rentabilidadeSemana.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-400 mb-2">Esta Semana</div>
                  <div className={`text-sm font-semibold ${metrics.rentabilidadeSemana >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    R$ {metrics.rentabilidadeSemana.toFixed(2)}
                  </div>
                </div>

                <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                  <div className="text-2xl font-bold text-white mb-1">
                    {metrics.rentabilidadeMes.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-400 mb-2">Este Mês</div>
                  <div className={`text-sm font-semibold ${metrics.rentabilidadeMes >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    R$ {metrics.rentabilidadeMes.toFixed(2)}
                  </div>
                </div>

                <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                  <div className="text-2xl font-bold text-white mb-1">
                    {metrics.rentabilidadeAno.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-400 mb-2">Este Ano</div>
                  <div className={`text-sm font-semibold ${metrics.rentabilidadeAno >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    R$ {metrics.rentabilidadeAno.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brokers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(brokerInfo).map(([broker, info]) => {
              const trades = (tradesByBroker as any)[broker] || [];
              const stats = calculateBrokerStats(trades);
              const IconComponent = info.icon;

              return (
                <Card key={broker} className="bg-slate-800/50 border-slate-700">
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
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-white">{stats.totalTrades}</div>
                        <div className="text-xs text-slate-400">Trades</div>
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {stats.totalProfit >= 0 ? '+' : ''}R$ {stats.totalProfit.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-400">Resultado</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-400">{stats.winRate.toFixed(1)}%</div>
                        <div className="text-xs text-slate-400">Win Rate</div>
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
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Histórico de Importações CSV</CardTitle>
              <CardDescription>Acompanhe suas importações de dados</CardDescription>
            </CardHeader>
            <CardContent>
              {(csvImports as any[]).length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  Nenhuma importação realizada ainda
                </div>
              ) : (
                <div className="space-y-4">
                  {(csvImports as any[]).map((importItem: any) => (
                    <div key={importItem.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${importItem.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <div>
                          <div className="font-medium text-white">{importItem.fileName}</div>
                          <div className="text-sm text-slate-400">
                            {brokerInfo[importItem.broker as keyof typeof brokerInfo]?.name || importItem.broker}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white">{importItem.tradesImported} trades</div>
                        <div className="text-xs text-slate-400">
                          {new Date(importItem.createdAt).toLocaleDateString('pt-BR')}
                        </div>
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
              title="💰 Resultado Total Consolidado"
              value={`R$ ${metrics.rentabilidadeTotal.toFixed(2)}`}
              icon={DollarSign}
              color={metrics.rentabilidadeTotal >= 0 ? "text-green-400" : "text-red-400"}
              subtitle="Soma de todas as corretoras"
            />
            
            <MetricCard
              title="📊 Total de Trades"
              value={metrics.totalTrades}
              icon={BarChart3}
              subtitle="Crypto + Forex + B3"
            />
            
            <MetricCard
              title="🎯 Taxa de Acerto Geral"
              value={`${metrics.taxaAcerto.toFixed(1)}%`}
              icon={Target}
              color={metrics.taxaAcerto >= 50 ? "text-green-400" : "text-red-400"}
              subtitle="Média ponderada"
            />
            
            <MetricCard
              title="⚖️ R/R Médio Consolidado"
              value={`${metrics.riscoRetornoMedio.toFixed(2)}:1`}
              icon={TrendingUp}
              color={metrics.riscoRetornoMedio >= 2 ? "text-green-400" : "text-yellow-400"}
              subtitle="Risco/Retorno geral"
            />
          </div>

          {/* Performance por Corretora */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building className="h-5 w-5 text-purple-400" />
                📈 Performance por Corretora
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
                    <div key={broker} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${info.color}`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-medium">{info.name}</div>
                          <div className="text-slate-400 text-sm">{info.description}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                          <div className="text-lg font-bold text-white">{stats.totalTrades}</div>
                          <div className="text-xs text-slate-400">Trades</div>
                        </div>
                        <div>
                          <div className={`text-lg font-bold ${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {stats.totalProfit >= 0 ? '+' : ''}R$ {stats.totalProfit.toFixed(2)}
                          </div>
                          <div className="text-xs text-slate-400">Resultado</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-400">{stats.winRate.toFixed(1)}%</div>
                          <div className="text-xs text-slate-400">Win Rate</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Distribuição por Mercado */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-400" />
                🌍 Distribuição por Mercado
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
                    crypto: { name: 'Crypto', emoji: '🪙', color: 'text-orange-400' },
                    forex: { name: 'Forex', emoji: '💱', color: 'text-blue-400' },
                    b3: { name: 'B3', emoji: '📈', color: 'text-green-400' }
                  };
                  
                  const info = mercadoInfo[mercado as keyof typeof mercadoInfo];
                  
                  return (
                    <div key={mercado} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{info.emoji}</span>
                        <div>
                          <div className="text-white font-medium">{info.name}</div>
                          <div className="text-slate-400 text-sm">{countMercado} trades</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className={`text-lg font-bold ${totalMercado >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {totalMercado >= 0 ? '+' : ''}R$ {totalMercado.toFixed(2)}
                          </div>
                          <div className="text-xs text-slate-400">Resultado</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${info.color}`}>
                            {winRateMercado.toFixed(1)}%
                          </div>
                          <div className="text-xs text-slate-400">Win Rate</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Ações da Dashboard */}
          <Card className="bg-slate-800/50 border-slate-700">
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
                🔄 Atualizar Dados Consolidados
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="w-full bg-red-600 hover:bg-red-700"
                    data-testid="button-reset-dashboard"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    🗑️ Resetar Dashboard
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-800 border-slate-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">⚠️ Resetar Dashboard</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-300">
                      Esta ação irá <strong>deletar TODOS os seus trades</strong> e dados de trading permanentemente. 
                      Você começará do zero. Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
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