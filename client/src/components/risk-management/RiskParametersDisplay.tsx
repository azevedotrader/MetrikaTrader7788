import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, TrendingUp, AlertTriangle, Target, Trash2, CheckCircle2, MessageSquare, Loader2, Filter, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  formatCurrency?: (value: number) => string;
  getCurrencySymbol?: () => string;
}

export function RiskParametersDisplay({
  bankroll,
  onDelete,
  isDeleting,
  formatCurrency: formatCurrencyProp,
  getCurrencySymbol: getCurrencySymbolProp,
}: RiskParametersDisplayProps) {
  const bankrollValue = parseFloat(bankroll.bankrollValue);
  const riskPerOperation = parseFloat(bankroll.riskPerOperation);
  const maxDailyRisk = parseFloat(bankroll.maxDailyRisk);
  const maxWeeklyRisk = parseFloat(bankroll.maxWeeklyRisk);
  const minRiskRewardRatio = parseFloat(bankroll.minRiskRewardRatio);
  
  // Default currency formatting if prop not provided
  const defaultFormatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };
  
  const formatCurrency = formatCurrencyProp || defaultFormatCurrency;
  const currencySymbol = getCurrencySymbolProp ? getCurrencySymbolProp() : "R$";

  // Estados para filtros
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [marketFilter, setMarketFilter] = useState<string>("all");

  // Buscar trades do usuário para o gráfico
  const { data: trades, isLoading: isLoadingTrades } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
  });

  // Filtrar trades baseado nos filtros selecionados
  const filteredTrades = useMemo(() => {
    if (!trades) return [];

    let filtered = [...trades];

    // Filtro de período
    if (periodFilter !== "all") {
      const now = new Date();
      const daysAgo = parseInt(periodFilter);
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(trade => new Date(trade.dataHora) >= cutoffDate);
    }

    // Filtro de mercado
    if (marketFilter !== "all") {
      filtered = filtered.filter(trade => trade.mercado.toLowerCase() === marketFilter.toLowerCase());
    }

    return filtered;
  }, [trades, periodFilter, marketFilter]);

  // Processar dados para o gráfico
  const chartData = useMemo(() => {
    if (!filteredTrades || filteredTrades.length === 0) {
      return [];
    }

    const sortedTrades = [...filteredTrades].sort(
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
  }, [filteredTrades, bankrollValue]);

  // Calcular estatísticas avançadas
  const statistics = useMemo(() => {
    if (!filteredTrades || filteredTrades.length === 0) {
      return null;
    }

    const wins = filteredTrades.filter(t => parseFloat(t.resultado || "0") > 0);
    const losses = filteredTrades.filter(t => parseFloat(t.resultado || "0") < 0);
    
    const totalProfit = wins.reduce((sum, t) => sum + parseFloat(t.resultado || "0"), 0);
    const totalLoss = Math.abs(losses.reduce((sum, t) => sum + parseFloat(t.resultado || "0"), 0));
    
    const winRate = filteredTrades.length > 0 ? (wins.length / filteredTrades.length) * 100 : 0;
    const avgWin = wins.length > 0 ? totalProfit / wins.length : 0;
    const avgLoss = losses.length > 0 ? totalLoss / losses.length : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;
    
    const bestTrade = filteredTrades.reduce((best, t) => {
      const result = parseFloat(t.resultado || "0");
      return result > parseFloat(best.resultado || "0") ? t : best;
    }, filteredTrades[0]);
    
    const worstTrade = filteredTrades.reduce((worst, t) => {
      const result = parseFloat(t.resultado || "0");
      return result < parseFloat(worst.resultado || "0") ? t : worst;
    }, filteredTrades[0]);

    return {
      totalTrades: filteredTrades.length,
      wins: wins.length,
      losses: losses.length,
      winRate,
      totalProfit,
      totalLoss,
      avgWin,
      avgLoss,
      profitFactor,
      bestTrade,
      worstTrade,
    };
  }, [filteredTrades]);

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
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex items-start gap-2 min-w-0 flex-1">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <CardTitle className="text-white text-base sm:text-lg">
                  Gestão de Risco Ativa
                </CardTitle>
                <CardDescription className="text-green-300/70 mt-1 text-sm">
                  Seu plano personalizado está configurado e pronto para uso
                </CardDescription>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 flex-shrink-0 self-start"
              data-testid="button-delete-management"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? "Deletando..." : "Refazer"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Capital Total */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Capital Total</CardTitle>
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
          value={`Para cada ${currencySymbol}1 arriscado, busque ganhar ${currencySymbol}${minRiskRewardRatio.toFixed(1)}`}
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
                  Reduza seu risco pela METADE até obter 1 trade positivo. Isso protege seu
                  capital durante períodos difíceis.
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
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5" />
                    Evolução do Capital
                  </CardTitle>
                  <CardDescription>
                    Visualização da performance ao longo dos seus trades
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500 mb-1">Saldo {periodFilter === "all" ? "Atual" : "do Período"}</p>
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

              {/* Explicação e Filtros */}
              <div className="bg-blue-950/30 border border-blue-800/30 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-3">
                  <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-200/80 leading-relaxed">
                    Este gráfico mostra como seu capital evoluiu ao longo do tempo. A linha roxa representa o saldo acumulado 
                    após cada trade. Use os filtros abaixo para analisar períodos específicos ou mercados diferentes.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-400 mb-2 block flex items-center gap-1">
                      <Filter className="w-3 h-3" />
                      Período
                    </label>
                    <Select value={periodFilter} onValueChange={setPeriodFilter}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os trades</SelectItem>
                        <SelectItem value="7">Últimos 7 dias</SelectItem>
                        <SelectItem value="30">Últimos 30 dias</SelectItem>
                        <SelectItem value="90">Últimos 90 dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 mb-2 block flex items-center gap-1">
                      <Filter className="w-3 h-3" />
                      Mercado
                    </label>
                    <Select value={marketFilter} onValueChange={setMarketFilter}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os mercados</SelectItem>
                        <SelectItem value="crypto">Crypto</SelectItem>
                        <SelectItem value="forex">Forex</SelectItem>
                        <SelectItem value="b3">B3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
                    tickFormatter={(value) => `${currencySymbol} ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={bankrollValue}
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

            {/* Estatísticas Detalhadas */}
            {statistics && (
              <div className="mt-6 pt-6 border-t border-zinc-800">
                <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  📊 Estatísticas do Período
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-zinc-500 mb-1">Total de Trades</p>
                    <p className="text-lg font-bold text-white">{statistics.totalTrades}</p>
                  </div>
                  
                  <div className="bg-green-950/30 border border-green-800/30 rounded-lg p-3 text-center">
                    <p className="text-xs text-green-400 mb-1">Wins</p>
                    <p className="text-lg font-bold text-green-400">{statistics.wins}</p>
                  </div>
                  
                  <div className="bg-red-950/30 border border-red-800/30 rounded-lg p-3 text-center">
                    <p className="text-xs text-red-400 mb-1">Losses</p>
                    <p className="text-lg font-bold text-red-400">{statistics.losses}</p>
                  </div>
                  
                  <div className="bg-blue-950/30 border border-blue-800/30 rounded-lg p-3 text-center">
                    <p className="text-xs text-blue-400 mb-1">Win Rate</p>
                    <p className="text-lg font-bold text-blue-400">{statistics.winRate.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-zinc-800/30 rounded-lg p-3">
                    <p className="text-xs text-zinc-400 mb-2">Lucro Médio por Win</p>
                    <p className="text-base font-semibold text-green-400">{formatCurrency(statistics.avgWin)}</p>
                  </div>
                  
                  <div className="bg-zinc-800/30 rounded-lg p-3">
                    <p className="text-xs text-zinc-400 mb-2">Perda Média por Loss</p>
                    <p className="text-base font-semibold text-red-400">{formatCurrency(statistics.avgLoss)}</p>
                  </div>
                  
                  <div className="bg-zinc-800/30 rounded-lg p-3">
                    <p className="text-xs text-zinc-400 mb-2">Melhor Trade</p>
                    <p className="text-base font-semibold text-green-400">
                      {formatCurrency(parseFloat(statistics.bestTrade.resultado || "0"))}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">{statistics.bestTrade.ativo}</p>
                  </div>
                  
                  <div className="bg-zinc-800/30 rounded-lg p-3">
                    <p className="text-xs text-zinc-400 mb-2">Pior Trade</p>
                    <p className="text-base font-semibold text-red-400">
                      {formatCurrency(parseFloat(statistics.worstTrade.resultado || "0"))}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">{statistics.worstTrade.ativo}</p>
                  </div>
                </div>

                <div className="mt-3 bg-purple-950/30 border border-purple-800/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-purple-400 mb-1">Profit Factor</p>
                      <p className="text-xs text-zinc-400">Lucro Total ÷ Perda Total</p>
                    </div>
                    <p className={`text-2xl font-bold ${statistics.profitFactor >= 1.5 ? "text-green-400" : statistics.profitFactor >= 1 ? "text-yellow-400" : "text-red-400"}`}>
                      {statistics.profitFactor.toFixed(2)}
                    </p>
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">
                    {statistics.profitFactor >= 2 && "🔥 Excelente! Você ganha 2x mais do que perde"}
                    {statistics.profitFactor >= 1.5 && statistics.profitFactor < 2 && "✅ Muito bom! Continue assim"}
                    {statistics.profitFactor >= 1 && statistics.profitFactor < 1.5 && "⚠️ Razoável, mas pode melhorar"}
                    {statistics.profitFactor < 1 && "❌ Atenção! Você está perdendo mais do que ganhando"}
                  </div>
                </div>
              </div>
            )}
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
            Sabia que você pode gerenciar seu capital e criar gestões de risco diretamente pelo WhatsApp? 
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
            href="https://wa.me/5522974051621?text=Oi!%20Quero%20acessar%20minha%20gest%C3%A3o%20de%20risco"
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
