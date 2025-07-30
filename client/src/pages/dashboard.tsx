import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Target,
  Calendar,
  DollarSign,
  BarChart3,
  Timer,
  Brain,
  Trophy,
  AlertTriangle
} from "lucide-react";
import { type Trade } from "@shared/schema";

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
  const tradesPositivos = trades.filter(trade => parseFloat(trade.resultado || "0") > 0);
  const taxaAcerto = (tradesPositivos.length / trades.length) * 100;

  // Risco/Retorno médio
  const riscoRetornoMedio = trades.reduce((acc, trade) => {
    const risco = parseFloat(trade.risco || "2");
    const retorno = Math.abs(parseFloat(trade.resultado || "0"));
    return acc + (retorno / risco);
  }, 0) / trades.length;

  // Setup mais lucrativo
  const setupLucros: { [key: string]: number } = {};
  trades.forEach(trade => {
    const setup = trade.setup || "Outros";
    const resultado = parseFloat(trade.resultado || "0");
    setupLucros[setup] = (setupLucros[setup] || 0) + resultado;
  });

  const setupMaisLucrativo = Object.entries(setupLucros).reduce((max, [setup, total]) => {
    return total > max.total ? { setup, total, percent: (total / rentabilidadeTotal) * 100 } : max;
  }, { setup: "", total: 0, percent: 0 });

  // Emoção mais recorrente
  const emocoesCount: { [key: string]: number } = {};
  trades.forEach(trade => {
    const emocao = trade.emocao || "neutro";
    emocoesCount[emocao] = (emocoesCount[emocao] || 0) + 1;
  });

  const emocaoMaisRecorrente = Object.entries(emocoesCount).reduce((max, [emocao, count]) => {
    return count > max.count ? { emocao, count } : max;
  }, { emocao: "", count: 0 });

  // Lucro por dia da semana
  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const lucroPorDia: { [key: number]: number } = {};
  
  trades.forEach(trade => {
    const dia = new Date(trade.dataHora).getDay();
    const resultado = parseFloat(trade.resultado || "0");
    lucroPorDia[dia] = (lucroPorDia[dia] || 0) + resultado;
  });

  const lucroPorDiaSemana = diasSemana.map((dia, index) => ({
    dia,
    valor: lucroPorDia[index] || 0
  }));

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
    tempoMedioTrade: 0, // Calcular baseado em dados futuros
    setupMaisLucrativo,
    emocaoMaisRecorrente,
    lucroPorDiaSemana
  };
}

function MetricCard({ title, value, icon: Icon, color = "text-white", badge, subtitle }: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
  badge?: string;
  subtitle?: string;
}) {
  return (
    <Card className="bg-slate-900/50 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-300">{title}</CardTitle>
        <Icon className="h-4 w-4 text-purple-400" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>
          {typeof value === 'number' ? 
            (title.includes('R$') || title.includes('Resultado') ? 
              `R$ ${value.toFixed(2)}` : 
              value.toFixed(1)
            ) : value
          }
        </div>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        {badge && (
          <Badge variant="secondary" className="mt-2">
            {badge}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: trades = [], isLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-2">Carregando suas métricas...</p>
        </div>
      </div>
    );
  }

  const metrics = calculateMetrics(trades);

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-2">Resumo completo da sua performance de trading</p>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="✅ Rentabilidade Total"
          value={`R$ ${metrics.rentabilidadeTotal.toFixed(2)}`}
          icon={DollarSign}
          color={metrics.rentabilidadeTotal >= 0 ? "text-green-400" : "text-red-400"}
        />
        
        <MetricCard
          title="🧮 Total de Trades"
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

      {/* Rentabilidade por período */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="📈 Rentabilidade (Semana)"
          value={`R$ ${metrics.rentabilidadeSemana.toFixed(2)}`}
          icon={Calendar}
          color={metrics.rentabilidadeSemana >= 0 ? "text-green-400" : "text-red-400"}
        />
        
        <MetricCard
          title="📈 Rentabilidade (Mês)"
          value={`R$ ${metrics.rentabilidadeMes.toFixed(2)}`}
          icon={Calendar}
          color={metrics.rentabilidadeMes >= 0 ? "text-green-400" : "text-red-400"}
        />
        
        <MetricCard
          title="📈 Rentabilidade (Ano)"
          value={`R$ ${metrics.rentabilidadeAno.toFixed(2)}`}
          icon={Calendar}
          color={metrics.rentabilidadeAno >= 0 ? "text-green-400" : "text-red-400"}
        />
      </div>

      {/* Melhores e piores trades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          title="💥 Melhor Trade"
          value={`R$ ${metrics.melhorTrade.toFixed(2)}`}
          icon={Trophy}
          color="text-green-400"
          subtitle="Maior lucro em uma operação"
        />
        
        <MetricCard
          title="💥 Pior Trade"
          value={`R$ ${metrics.piorTrade.toFixed(2)}`}
          icon={AlertTriangle}
          color="text-red-400"
          subtitle="Maior prejuízo em uma operação"
        />
      </div>

      {/* Setup e Emoção */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          title="🔍 Setup Mais Lucrativo"
          value={metrics.setupMaisLucrativo.setup || "Nenhum"}
          icon={Target}
          color="text-purple-400"
          subtitle={metrics.setupMaisLucrativo.total > 0 ? 
            `R$ ${metrics.setupMaisLucrativo.total.toFixed(2)} (${metrics.setupMaisLucrativo.percent.toFixed(1)}%)` : 
            "Nenhum trade registrado"
          }
        />
        
        <MetricCard
          title="🧠 Emoção Mais Recorrente"
          value={`${emojiEmocoes[metrics.emocaoMaisRecorrente.emocao as keyof typeof emojiEmocoes] || '😐'} ${
            metrics.emocaoMaisRecorrente.emocao || 'Neutro'
          }`}
          icon={Brain}
          color="text-blue-400"
          subtitle={`${metrics.emocaoMaisRecorrente.count} trades`}
        />
      </div>

      {/* Lucro por dia da semana */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-400" />
            📊 Lucro/Prejuízo por Dia da Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.lucroPorDiaSemana.map(({ dia, valor }) => (
              <div key={dia} className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">{dia}</span>
                <div className="flex items-center gap-2">
                  <div className={`w-32 h-6 bg-slate-800 rounded-full overflow-hidden`}>
                    <div 
                      className={`h-full transition-all duration-300 ${
                        valor >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ 
                        width: `${Math.min(Math.abs(valor) / Math.max(...metrics.lucroPorDiaSemana.map(d => Math.abs(d.valor))) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  <span className={`text-sm font-medium min-w-[80px] text-right ${
                    valor >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    R$ {valor.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trades recentes */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Timer className="h-5 w-5 text-purple-400" />
            Últimos Trades
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              Nenhum trade registrado ainda. 
              <br />
              <span className="text-purple-400">Comece registrando seu primeiro trade!</span>
            </p>
          ) : (
            <div className="space-y-3">
              {trades.slice(-5).reverse().map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      parseFloat(trade.resultado || "0") >= 0 ? 'bg-green-400' : 'bg-red-400'
                    }`} />
                    <div>
                      <p className="text-white font-medium">{trade.ativo}</p>
                      <p className="text-slate-400 text-sm">
                        {trade.setup} • {new Date(trade.dataHora).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      parseFloat(trade.resultado || "0") >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      R$ {parseFloat(trade.resultado || "0").toFixed(2)}
                    </p>
                    <p className="text-slate-400 text-sm">{trade.mercado}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}