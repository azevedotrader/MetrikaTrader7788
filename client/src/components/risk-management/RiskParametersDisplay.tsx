import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, TrendingUp, AlertTriangle, Target, Trash2, CheckCircle2, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface BankrollManagement {
  id: string;
  userId: string;
  bankrollValue: string;
  riskPerOperation: string;
  maxDailyRisk: string;
  maxWeeklyRisk: string;
  minRiskRewardRatio: string;
  drawdownTriggerLosses: number;
  createdAt: Date;
}

interface Trade {
  id: string;
  dataHora: string;
  resultado: string;
  capitalUtilizado: string;
  ativo: string;
  mercado: string;
}

interface RiskParametersDisplayProps {
  bankroll: BankrollManagement;
  onDelete: () => void;
  isDeleting: boolean;
}

export function RiskParametersDisplay({
  bankroll,
  onDelete,
  isDeleting,
}: RiskParametersDisplayProps) {
  const bankrollValue = parseFloat(bankroll.bankrollValue);
  const riskPerOperation = parseFloat(bankroll.riskPerOperation);
  const maxDailyRisk = parseFloat(bankroll.maxDailyRisk);
  const maxWeeklyRisk = parseFloat(bankroll.maxWeeklyRisk);
  const minRiskRewardRatio = parseFloat(bankroll.minRiskRewardRatio);

  // Buscar trades do usuário para o gráfico
  const { data: trades, isLoading: isLoadingTrades } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
  });

  // Processar dados para o gráfico
  const chartData = useMemo(() => {
    if (!trades || trades.length === 0) {
      return [];
    }

    const sortedTrades = [...trades].sort(
      (a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime()
    );

    let runningBalance = bankrollValue;
    const data = [];

    data.push({
      date: "Início",
      saldo: bankrollValue,
      resultado: 0,
      ativo: "-",
      formattedDate: "Início",
    });

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
  }, [trades, bankrollValue]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
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

  return (
    <div className="space-y-6" data-testid="risk-parameters-display">
      {/* Header com botão de deletar */}
      <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-800/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                Gestão de Risco Ativa
              </CardTitle>
              <CardDescription className="text-green-300/70 mt-2">
                Seu plano personalizado está configurado e pronto para uso
              </CardDescription>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-delete-management"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? "Deletando..." : "Refazer"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Banca Total */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Banca Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            {formatCurrency(bankrollValue)}
          </div>
        </CardContent>
      </Card>

      {/* Grid de Parâmetros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Risco por Operação */}
        <ParameterCard
          icon={Shield}
          title="Risco por Operação"
          percentage={formatPercent(riskPerOperation)}
          value={formatCurrency(bankrollValue * riskPerOperation)}
          description="Nunca arrisque mais que este valor por trade"
          color="from-blue-500/20 to-cyan-500/20"
          borderColor="border-blue-500/50"
          testId="param-risk-per-operation"
        />

        {/* Risco Máximo Diário */}
        <ParameterCard
          icon={AlertTriangle}
          title="Risco Máximo Diário"
          percentage={formatPercent(maxDailyRisk)}
          value={formatCurrency(bankrollValue * maxDailyRisk)}
          description="Se perder esse valor no dia, PARE de operar"
          color="from-orange-500/20 to-red-500/20"
          borderColor="border-orange-500/50"
          testId="param-max-daily-risk"
        />

        {/* Risco Máximo Semanal */}
        <ParameterCard
          icon={TrendingUp}
          title="Risco Máximo Semanal"
          percentage={formatPercent(maxWeeklyRisk)}
          value={formatCurrency(bankrollValue * maxWeeklyRisk)}
          description="Limite semanal - reavalie sua estratégia se atingir"
          color="from-purple-500/20 to-pink-500/20"
          borderColor="border-purple-500/50"
          testId="param-max-weekly-risk"
        />

        {/* Relação Risco/Retorno Mínima */}
        <ParameterCard
          icon={Target}
          title="Relação Risco/Retorno Mínima"
          percentage={`1:${minRiskRewardRatio.toFixed(1)}`}
          value={`Para cada R$1 arriscado, busque ganhar R$${minRiskRewardRatio.toFixed(1)}`}
          description="Sempre busque esse R:R ou melhor"
          color="from-green-500/20 to-emerald-500/20"
          borderColor="border-green-500/50"
          testId="param-min-risk-reward"
        />
      </div>

      {/* Regra de Drawdown */}
      <Card className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border-red-800/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Regra de Drawdown (Proteção Automática)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-red-400" data-testid="text-drawdown-trigger">
                  {bankroll.drawdownTriggerLosses}
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-white">
                  Após {bankroll.drawdownTriggerLosses} perdas seguidas
                </h4>
                <p className="text-sm text-zinc-400 mt-1">
                  Reduza seu risco pela METADE até obter 1 trade positivo. Isso protege sua
                  banca durante períodos difíceis.
                </p>
              </div>
            </div>
            <div className="bg-red-950/30 border border-red-800/30 rounded-lg p-3">
              <p className="text-xs text-red-300">
                <strong>Exemplo:</strong> Se seu risco normal é{" "}
                {formatCurrency(bankrollValue * riskPerOperation)}, após{" "}
                {bankroll.drawdownTriggerLosses} perdas seguidas, reduza para{" "}
                {formatCurrency((bankrollValue * riskPerOperation) / 2)} até recuperar.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Performance */}
      {trades && trades.length > 0 ? (
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
                <p className="text-xl font-bold text-white">
                  {formatCurrency(chartData[chartData.length - 1]?.saldo || bankrollValue)}
                </p>
                {chartData.length > 1 && (
                  <p
                    className={`text-sm font-medium ${
                      chartData[chartData.length - 1].saldo >= bankrollValue
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {chartData[chartData.length - 1].saldo >= bankrollValue ? "+" : ""}
                    {formatCurrency(chartData[chartData.length - 1].saldo - bankrollValue)} (
                    {((((chartData[chartData.length - 1].saldo - bankrollValue) / bankrollValue) * 100)).toFixed(2)}%)
                  </p>
                )}
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
                    y={bankrollValue}
                    stroke="#6366f1"
                    strokeDasharray="5 5"
                    label={{
                      value: "Banca Inicial",
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
                <p className="text-xs text-zinc-500 mb-1">Banca Inicial</p>
                <p className="text-sm font-semibold text-white">{formatCurrency(bankrollValue)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-zinc-500 mb-1">Total de Trades</p>
                <p className="text-sm font-semibold text-white">{trades.length}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-zinc-500 mb-1">Variação</p>
                <p
                  className={`text-sm font-semibold ${
                    chartData[chartData.length - 1]?.saldo >= bankrollValue
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {chartData.length > 1 
                    ? `${chartData[chartData.length - 1].saldo >= bankrollValue ? "+" : ""}${((((chartData[chartData.length - 1].saldo - bankrollValue) / bankrollValue) * 100)).toFixed(2)}%`
                    : "0.00%"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : isLoadingTrades ? (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-6 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </CardContent>
        </Card>
      ) : null}

      {/* Card do WhatsApp */}
      <Card className="bg-gradient-to-br from-green-950/30 to-emerald-950/30 border-green-800/40">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <MessageSquare className="w-5 h-5 text-green-400" />
            Também disponível pelo WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-green-200/80 leading-relaxed">
            Sabia que você pode gerenciar sua banca e criar gestões de risco diretamente pelo WhatsApp? 
            É a mesma tecnologia, com o mesmo algoritmo de cálculo!
          </p>
          
          <div className="bg-green-900/30 border border-green-700/30 rounded-md p-3">
            <p className="text-xs text-green-200/90">
              <strong>✨ Recursos disponíveis no WhatsApp:</strong>
            </p>
            <ul className="text-xs text-green-200/80 mt-2 space-y-1 ml-4">
              <li>• Criar gestão personalizada (7 perguntas interativas)</li>
              <li>• Salvar trades rapidamente</li>
              <li>• Consultar seus parâmetros de risco</li>
              <li>• Tudo com botões - sem precisar digitar!</li>
            </ul>
          </div>

          <a
            href="https://wa.me/5511999999999?text=Oi!%20Quero%20acessar%20minha%20gest%C3%A3o%20de%20risco"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
              size="lg"
              data-testid="button-whatsapp-cta-active"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Acessar pelo WhatsApp
            </Button>
          </a>
        </CardContent>
      </Card>

      {/* Mensagem de Disciplina */}
      <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-800/50">
        <CardContent className="p-6">
          <p className="text-center text-lg font-semibold text-transparent bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text">
            💡 Lembre-se: A disciplina é o único caminho para a consistência.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

interface ParameterCardProps {
  icon: React.ElementType;
  title: string;
  percentage: string;
  value: string;
  description: string;
  color: string;
  borderColor: string;
  testId: string;
}

function ParameterCard({
  icon: Icon,
  title,
  percentage,
  value,
  description,
  color,
  borderColor,
  testId,
}: ParameterCardProps) {
  return (
    <Card className={cn("bg-gradient-to-br", color, borderColor)} data-testid={testId}>
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-base flex items-center gap-2">
          <Icon className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-3xl font-bold text-white">{percentage}</div>
        <div className="text-sm text-zinc-300">{value}</div>
        <p className="text-xs text-zinc-400 pt-2 border-t border-white/10">{description}</p>
      </CardContent>
    </Card>
  );
}
