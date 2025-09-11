import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Calculator, TrendingUp, DollarSign, Target, BarChart3, BookOpen, Lightbulb, Shield, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RiskCalculation {
  accountBalance: number;
  riskPercentage: number;
  riskAmount: number;
  potentialProfit: number;
  positionSize: number;
  dailyGrowthProjection: number;
}

export default function RiskManagement() {
  const { t } = useLanguage();
  const [accountBalance, setAccountBalance] = useState<string>("");
  const [riskProfile, setRiskProfile] = useState<string>("moderado");
  
  // Map risk profiles to percentages
  const getRiskPercentage = (profile: string): number => {
    switch (profile) {
      case "conservador": return 1;
      case "moderado": return 2.5;
      case "alto_risco": return 5;
      default: return 2.5;
    }
  };
  const [results, setResults] = useState<RiskCalculation | null>(null);

  const calculateRisk = () => {
    const balance = parseFloat(accountBalance) || 0;
    const risk = getRiskPercentage(riskProfile);

    if (balance <= 0) return;

    const riskAmount = (balance * risk) / 100;
    const potentialProfit = riskAmount; // Simplified: potential profit equals risk amount
    const positionSize = riskAmount / 200; // Simplified calculation without stop loss pips
    const dailyGrowthProjection = (potentialProfit / balance) * 100;

    setResults({
      accountBalance: balance,
      riskPercentage: risk,
      riskAmount,
      potentialProfit,
      positionSize,
      dailyGrowthProjection,
    });
  };

  useEffect(() => {
    if (accountBalance && parseFloat(accountBalance) > 0) {
      calculateRisk();
    }
  }, [accountBalance, riskProfile]);

  const ProjectionCard = ({ title, value, color, icon: Icon }: { 
    title: string; 
    value: string; 
    color: string; 
    icon: React.ElementType;
  }) => (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardContent className="p-3 md:p-4">
        <div className="flex items-center space-x-2 md:space-x-3">
          <div className={cn("p-2 rounded-lg flex-shrink-0", color)}>
            <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs md:text-sm text-zinc-400 truncate">{title}</p>
            <p className="text-sm md:text-lg font-bold text-white">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2 md:gap-3">
            <Calculator className="w-6 h-6 md:w-8 md:h-8" />
            {t('risk_management.title')}
          </h1>
          <p className="text-sm md:text-base text-zinc-400">
            {t('risk_management.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="space-y-6">
            {/* Configurações */}
            <Card data-testid="risk-calculator" className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">
                  {t('risk_management.settings')}
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  {t('risk_management.settings_description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
                <div className="space-y-2">
                  <Label htmlFor="balance" className="text-sm md:text-base text-zinc-300">
                    {t('risk_management.account_balance')}
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                      id="balance"
                      type="number"
                      placeholder="10000.00"
                      value={accountBalance}
                      onChange={(e) => setAccountBalance(e.target.value)}
                      className="pl-10 bg-zinc-800 border-zinc-700 text-white h-12 text-base"
                      data-testid="input-account-balance"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="risk-profile" className="text-sm md:text-base text-zinc-300">
                    Perfil de Risco
                  </Label>
                  <Select
                    value={riskProfile}
                    onValueChange={setRiskProfile}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-12 text-base">
                      <SelectValue placeholder="Selecione seu perfil de risco" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="conservador" className="text-white">
                        🛡️ Conservador (1% por operação)
                      </SelectItem>
                      <SelectItem value="moderado" className="text-white">
                        ⚖️ Moderado (2.5% por operação)
                      </SelectItem>
                      <SelectItem value="alto_risco" className="text-white">
                        🚀 Alto Risco (5% por operação)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-zinc-400">
                    {riskProfile === "conservador" && "Perfil conservador: menor risco, crescimento gradual"}
                    {riskProfile === "moderado" && "Perfil moderado: equilibrio entre risco e retorno"}
                    {riskProfile === "alto_risco" && "Alto risco: maior potencial, mas riscos elevados"}
                  </p>
                </div>

                <Button 
                  onClick={calculateRisk}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
                  data-testid="button-calculate-risk"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  {t('risk_management.calculate')}
                </Button>
              </CardContent>
            </Card>

            {/* Guia e Dicas */}
            <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-800/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  Como Usar a Gestão de Risco
                </CardTitle>
                <CardDescription className="text-blue-200">
                  Dicas essenciais para maximizar seus resultados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 md:p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-green-900/20 rounded-lg border border-green-800/30">
                    <Shield className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-green-300 mb-1">Gestão de Risco por Perfil</h4>
                      <p className="text-xs text-green-100">
                        {riskProfile === "conservador" && "Conservador: Mantenha sempre 1% por operação para preservar capital a longo prazo."}
                        {riskProfile === "moderado" && "Moderado: Use 2-3% por operação, equilibrando crescimento e segurança."}
                        {riskProfile === "alto_risco" && "Alto Risco: Até 5% por operação para traders experientes com alta tolerância ao risco."}
                        {!riskProfile && "Selecione um perfil para ver recomendações específicas de risco por operação."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-yellow-900/20 rounded-lg border border-yellow-800/30">
                    <Lightbulb className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-yellow-300 mb-1">Tamanho da Posição</h4>
                      <p className="text-xs text-yellow-100">
                        Use nossa calculadora para determinar exatamente quantos lotes operar baseado no seu stop loss e tolerância ao risco.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-red-900/20 rounded-lg border border-red-800/30">
                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-red-300 mb-1">Importante</h4>
                      <p className="text-xs text-red-100">
                        Os resultados são projeções baseadas em dados históricos. Performance passada não garante resultados futuros.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-700">
                    <h5 className="text-sm font-medium text-white mb-2">Passos para usar:</h5>
                    <ol className="text-xs text-zinc-300 space-y-1 list-decimal list-inside">
                      <li>Insira o saldo real da sua conta</li>
                      <li>Escolha seu perfil de risco</li>
                      <li>Analise os resultados da calculadora</li>
                      <li>Use o gráfico para visualizar o crescimento</li>
                      <li>Siga sempre seu plano de risco</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resultados */}
          {results && (
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-lg md:text-xl text-white">
                    {t('risk_management.results')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    <ProjectionCard
                      title={t('risk_management.risk_amount')}
                      value={`$${results.riskAmount.toFixed(2)}`}
                      color="bg-red-600"
                      icon={Target}
                    />
                    <ProjectionCard
                      title={t('risk_management.potential_profit')}
                      value={`$${results.potentialProfit.toFixed(2)}`}
                      color="bg-green-600"
                      icon={TrendingUp}
                    />
                    <ProjectionCard
                      title={t('risk_management.daily_growth')}
                      value={`${results.dailyGrowthProjection.toFixed(2)}%`}
                      color="bg-purple-600"
                      icon={TrendingUp}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico de Projeção */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-lg md:text-xl text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Gráfico de Projeção de Crescimento
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base text-zinc-400">
                    Visualização da evolução projetada do saldo da conta
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="h-80 lg:h-96 xl:h-[450px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={Array.from({ length: 91 }, (_, index) => {
                          const day = index;
                          const projectedBalance = day === 0 
                            ? results.accountBalance 
                            : results.accountBalance * Math.pow(1 + (results.dailyGrowthProjection / 100), day);
                          return {
                            day,
                            balance: projectedBalance,
                            gain: projectedBalance - results.accountBalance
                          };
                        })}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="day" 
                          stroke="#9CA3AF"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `$${value.toFixed(0)}`}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                          formatter={(value: number, name: string) => [
                            name === 'balance' ? `$${value.toFixed(2)}` : `+$${value.toFixed(2)}`,
                            name === 'balance' ? 'Saldo Projetado' : 'Ganho Acumulado'
                          ]}
                          labelFormatter={(day) => `Dia ${day}`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="balance" 
                          stroke="#3B82F6" 
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="gain" 
                          stroke="#10B981" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                          activeDot={{ r: 4, stroke: '#10B981', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Legenda */}
                  <div className="flex justify-center gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 bg-blue-500 rounded"></div>
                      <span className="text-zinc-400">Saldo Projetado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 bg-green-500 rounded border-2 border-dashed border-green-500"></div>
                      <span className="text-zinc-400">Ganho Acumulado</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Marcos de Tempo */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-lg md:text-xl text-white">
                    Marcos de Crescimento
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base text-zinc-400">
                    Projeções em períodos específicos
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    {[7, 15, 30, 90].map((days) => {
                      const projectedBalance = results.accountBalance * Math.pow(1 + (results.dailyGrowthProjection / 100), days);
                      const totalGain = projectedBalance - results.accountBalance;
                      const gainPercentage = (totalGain / results.accountBalance) * 100;
                      
                      return (
                        <div key={days} className="space-y-3 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                            <span className="text-sm md:text-base text-zinc-400">
                              Após {days} dias
                            </span>
                            <span className="text-sm md:text-base text-white font-medium">
                              ${projectedBalance.toFixed(2)} (+{gainPercentage.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress 
                            value={Math.min(gainPercentage, 100)} 
                            className="h-3"
                          />
                          <div className="text-xs text-zinc-500">
                            Ganho: +${totalGain.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {!results && (
          <Card className="bg-zinc-900/50 border-zinc-800 mt-6 md:mt-8 lg:col-span-3">
            <CardContent className="p-6 md:p-8 text-center">
              <Calculator className="w-12 h-12 md:w-16 md:h-16 text-zinc-600 mx-auto mb-3 md:mb-4" />
              <p className="text-sm md:text-base text-zinc-400">
                Insira o saldo da conta para começar
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}