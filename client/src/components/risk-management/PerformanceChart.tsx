import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, Loader2 } from "lucide-react";

interface Trade {
  id: string;
  dataHora: string;
  resultado: string;
  capitalUtilizado: string;
  ativo: string;
  mercado: string;
}

interface BankrollManagement {
  bankrollValue: string;
}

interface PerformanceChartProps {
  bankroll: BankrollManagement;
}

export function PerformanceChart({ bankroll }: PerformanceChartProps) {
  const initialBankroll = parseFloat(bankroll.bankrollValue);

  // Buscar trades do usuário
  const { data: trades, isLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
  });

  // Processar dados para o gráfico
  const chartData = useMemo(() => {
    if (!trades || trades.length === 0) {
      return [];
    }

    // Ordenar trades por data
    const sortedTrades = [...trades].sort(
      (a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime()
    );

    let runningBalance = initialBankroll;
    const data = [];

    // Ponto inicial
    data.push({
      date: "Início",
      saldo: initialBankroll,
      resultado: 0,
      ativo: "-",
      formattedDate: "Início",
    });

    // Calcular saldo acumulado
    sortedTrades.forEach((trade, index) => {
      const resultado = parseFloat(trade.resultado || "0");
      runningBalance += resultado;

      const tradeDate = new Date(trade.dataHora);
      const formattedDate = tradeDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });

      data.push({
        date: `Trade ${index + 1}`,
        saldo: runningBalance,
        resultado: resultado,
        ativo: trade.ativo,
        formattedDate: formattedDate,
      });
    });

    return data;
  }, [trades, initialBankroll]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-1">{data.date}</p>
          <p className="text-zinc-400 text-xs mb-2">{data.formattedDate}</p>
          <p className="text-white font-bold">{formatCurrency(data.saldo)}</p>
          {data.resultado !== 0 && (
            <p
              className={`text-sm mt-1 ${
                data.resultado > 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {data.resultado > 0 ? "+" : ""}
              {formatCurrency(data.resultado)}
            </p>
          )}
          {data.ativo !== "-" && (
            <p className="text-zinc-500 text-xs mt-1">{data.ativo}</p>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </CardContent>
      </Card>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Evolução da Banca
          </CardTitle>
          <CardDescription>Gráfico de performance ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-zinc-800/50 rounded-lg p-8 text-center">
            <p className="text-zinc-400">
              Nenhum trade registrado ainda. Comece a adicionar trades para ver sua evolução!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentBalance = chartData[chartData.length - 1]?.saldo || initialBankroll;
  const profitLoss = currentBalance - initialBankroll;
  const profitLossPercent = ((profitLoss / initialBankroll) * 100).toFixed(2);
  const isProfit = profitLoss >= 0;

  return (
    <Card className="bg-zinc-900/50 border-zinc-800" data-testid="performance-chart">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" />
              Evolução da Banca
            </CardTitle>
            <CardDescription>
              Visualização da performance ao longo de {trades.length} trade{trades.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 mb-1">Saldo Atual</p>
            <p className="text-xl font-bold text-white">{formatCurrency(currentBalance)}</p>
            <p
              className={`text-sm font-medium ${
                isProfit ? "text-green-400" : "text-red-400"
              }`}
            >
              {isProfit ? "+" : ""}
              {formatCurrency(profitLoss)} ({isProfit ? "+" : ""}
              {profitLossPercent}%)
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="date"
                stroke="#71717a"
                style={{ fontSize: "12px" }}
                tick={{ fill: "#71717a" }}
              />
              <YAxis
                stroke="#71717a"
                style={{ fontSize: "12px" }}
                tick={{ fill: "#71717a" }}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={initialBankroll}
                stroke="#6366f1"
                strokeDasharray="5 5"
                label={{
                  value: "Capital Inicial",
                  fill: "#6366f1",
                  fontSize: 12,
                  position: "insideTopRight",
                }}
              />
              <Line
                type="monotone"
                dataKey="saldo"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: "#8b5cf6", r: 4 }}
                activeDot={{ r: 6, fill: "#a78bfa" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-zinc-800">
          <div className="text-center">
            <p className="text-xs text-zinc-500 mb-1">Capital Inicial</p>
            <p className="text-sm font-semibold text-white">{formatCurrency(initialBankroll)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-zinc-500 mb-1">Total de Trades</p>
            <p className="text-sm font-semibold text-white">{trades.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-zinc-500 mb-1">Variação</p>
            <p
              className={`text-sm font-semibold ${
                isProfit ? "text-green-400" : "text-red-400"
              }`}
            >
              {isProfit ? "+" : ""}
              {profitLossPercent}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
