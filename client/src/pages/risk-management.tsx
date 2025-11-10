import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();
  
  // Sistema de moeda dinâmica baseado no idioma
  const getCurrency = () => {
    switch (language) {
      case 'pt': return { symbol: 'R$', code: 'BRL' };
      case 'en': return { symbol: '$', code: 'USD' };
      case 'es': return { symbol: '$', code: 'USD' };
      default: return { symbol: 'R$', code: 'BRL' };
    }
  };
  
  const currency = getCurrency();
  const [accountBalance, setAccountBalance] = useState<string>("");
  const [riskProfile, setRiskProfile] = useState<string>("moderado");
  
  // Map risk profiles to percentages (máximo risco diário)
  const getRiskPercentage = (profile: string): number => {
    switch (profile) {
      case "conservador": return 1; // Máximo 1% risco diário
      case "moderado": return 2.4; // Máximo 2.4% risco diário
      case "alto_risco": return 10; // Máximo 10% risco diário
      default: return 2.4;
    }
  };

  // Risco por trade específico para cada perfil
  const getRiskPerTrade = (profile: string): number => {
    switch (profile) {
      case "conservador": return 0.25; // 0.25% por trade
      case "moderado": return 0.6; // 0.6% por trade
      case "alto_risco": return 2.5; // 2.5% por trade
      default: return 0.6;
    }
  };

  // Configuração realística por perfil de risco
  const PROFILE_CONFIG = {
    conservador: {
      riskPerTrade: 0.0025, // 0.25% por trade
      maxDailyRisk: 0.01, // 1% risco máximo diário
      expectedRiskReward: 3, // 3x o risco = lucro esperado
      winRate: 0.6, // 60% de trades positivos
      expectedMonthlyReturn: 0.045, // ~4.5% ao mês
      description: "Conservador: 0.25% por trade, máx 1% diário"
    },
    moderado: {
      riskPerTrade: 0.006, // 0.6% por trade
      maxDailyRisk: 0.024, // 2.4% risco máximo diário
      expectedRiskReward: 3, // 3x o risco = lucro esperado
      winRate: 0.55, // 55% de trades positivos
      expectedMonthlyReturn: 0.072, // ~7.2% ao mês
      description: "Moderado: 0.6% por trade, máx 2.4% diário"
    },
    alto_risco: {
      riskPerTrade: 0.025, // 2.5% por trade
      maxDailyRisk: 0.10, // 10% risco máximo diário
      expectedRiskReward: 3, // 3x o risco = lucro esperado
      winRate: 0.5, // 50% de trades positivos
      expectedMonthlyReturn: 0.15, // ~15% ao mês
      description: "Agressivo: 2.5% por trade, máx 10% diário"
    }
  };

  const getProfileConfig = (profile: string) => {
    return PROFILE_CONFIG[profile as keyof typeof PROFILE_CONFIG] || PROFILE_CONFIG.moderado;
  };
  const [results, setResults] = useState<RiskCalculation | null>(null);

  const calculateRisk = () => {
    const balance = parseFloat(accountBalance) || 0;
    const maxDailyRisk = getRiskPercentage(riskProfile);
    const riskPerTrade = getRiskPerTrade(riskProfile);

    if (balance <= 0) return;

    const riskAmountPerTrade = (balance * riskPerTrade) / 100;
    const maxDailyRiskAmount = (balance * maxDailyRisk) / 100;
    
    // Cálculo baseado no perfil de risco atualizado
    const profileConfig = getProfileConfig(riskProfile);
    
    // Lucro esperado = 3x o valor em risco por trade
    const potentialProfit = riskAmountPerTrade * profileConfig.expectedRiskReward;
    
    // Expectativa líquida considerando win rate
    const expectedReturn = (profileConfig.winRate * potentialProfit) - ((1 - profileConfig.winRate) * riskAmountPerTrade);
    
    // Número máximo de trades por dia baseado no risco diário
    const maxTradesPerDay = Math.floor(maxDailyRiskAmount / riskAmountPerTrade);
    
    // Crescimento diário projetado
    const dailyGrowthProjection = (expectedReturn / balance) * 100 * Math.min(maxTradesPerDay, 4); // Limitando a 4 trades/dia

    setResults({
      accountBalance: balance,
      riskPercentage: riskPerTrade,
      riskAmount: riskAmountPerTrade,
      potentialProfit,
      positionSize: riskAmountPerTrade, // Tamanho da posição = risco por trade
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
                      placeholder={language === 'pt' ? '10000,00' : '10000.00'}
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
                        🛡️ Conservador (0.25% por operação)
                      </SelectItem>
                      <SelectItem value="moderado" className="text-white">
                        ⚖️ Moderado (0.6% por operação)
                      </SelectItem>
                      <SelectItem value="alto_risco" className="text-white">
                        🚀 Alto Risco (2.5% por operação)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-zinc-400">
                    {getProfileConfig(riskProfile).description}
                  </p>
                </div>

                
              </CardContent>
            </Card>

            {/* Guia e Dicas */}
            <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-800/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  {t('risk_management.how_to_use')}
                </CardTitle>
                <CardDescription className="text-blue-200">
                  {t('risk_management.essential_tips')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 md:p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-green-900/20 rounded-lg border border-green-800/30">
                    <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-green-600 mb-1">{t('risk_management.risk_by_profile')}</h4>
                      <p className="text-xs text-green-100">
                        {riskProfile === "conservador" && t('risk_management.conservative_desc')}
                        {riskProfile === "moderado" && t('risk_management.moderate_desc')}
                        {riskProfile === "alto_risco" && t('risk_management.high_risk_desc')}
                        {!riskProfile && t('risk_management.no_profile_desc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-yellow-900/20 rounded-lg border border-yellow-800/30">
                    <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-yellow-500 mb-1">{t('risk_management.position_size_title')}</h4>
                      <p className="text-xs text-yellow-100">
                        {t('risk_management.position_size_desc')}
                      </p>
                    </div>
                  </div>

                  

                  <div className="pt-2 border-t border-zinc-700">
                    <h5 className="text-sm font-medium text-white mb-2">{t('risk_management.steps_to_use')}</h5>
                    <ol className="text-xs text-zinc-300 space-y-1 list-decimal list-inside">
                      <li>{t('risk_management.step1')}</li>
                      <li>{t('risk_management.step2')}</li>
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
                      value={`${currency.symbol}${results.riskAmount.toFixed(2)}`}
                      color="bg-red-500"
                      icon={Target}
                    />
                    <ProjectionCard
                      title={t('risk_management.expected_profit_per_trade')}
                      value={results.potentialProfit >= 0 ? `+${currency.symbol}${results.potentialProfit.toFixed(2)}` : `-${currency.symbol}${Math.abs(results.potentialProfit).toFixed(2)}`}
                      color={results.potentialProfit >= 0 ? "bg-green-600" : "bg-orange-600"}
                      icon={TrendingUp}
                    />
                    <ProjectionCard
                      title={t('risk_management.daily_growth_expected')}
                      value={`${results.dailyGrowthProjection >= 0 ? '+' : ''}${results.dailyGrowthProjection.toFixed(2)}%`}
                      color={results.dailyGrowthProjection >= 0 ? "bg-purple-600" : "bg-orange-600"}
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
                    {t('risk_management.growth_simulation_title')}
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base text-zinc-400">
                    {t('risk_management.growth_simulation_description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="h-80 lg:h-96 xl:h-[450px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={Array.from({ length: 91 }, (_, index) => {
                          const day = index;
                          
                          if (day === 0) {
                            return {
                              day: 0,
                              balance: results.accountBalance,
                              gain: 0
                            };
                          }
                          
                          // Usar configuração inteligente baseada no perfil de risco
                          const config = getProfileConfig(riskProfile);
                          const targetDailyReturn = Math.pow(1 + config.expectedMonthlyReturn, 1/30) - 1;
                          
                          let cumulativeReturn = 0;
                          
                          // Simular cada dia com configurações específicas do perfil
                          for (let d = 1; d <= day; d++) {
                            // Semente baseada no perfil + dia para consistência determinística
                            const profileHash = riskProfile.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0);
                            const seed = ((profileHash + d) * 1234567) % 1000000;
                            const random1 = (seed / 1000000);
                            const random2 = ((seed * 7) % 1000000) / 1000000;
                            
                            // Taxa de sucesso específica do perfil
                            const isWin = random1 < config.winRate;
                            
                            // Variação do retorno diário baseada no perfil atualizado
                            let dailyReturn;
                            if (isWin) {
                              // Ganhos = 3x o risco por trade (conforme especificado)
                              dailyReturn = config.riskPerTrade * config.expectedRiskReward * (0.8 + random2 * 0.4); // Variação de ±20%
                            } else {
                              // Perdas = risco por trade
                              dailyReturn = -config.riskPerTrade * (0.8 + random2 * 0.4); // Variação de ±20%
                            }
                            
                            // Ajustar para tender à meta mensal com força moderada
                            const adjustment = (targetDailyReturn * d - cumulativeReturn) * 0.1;
                            dailyReturn += adjustment;
                            
                            cumulativeReturn += dailyReturn;
                          }
                          
                          const projectedBalance = results.accountBalance * (1 + cumulativeReturn);
                          
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
                          tickFormatter={(value) => `${currency.symbol}${value.toFixed(0)}`}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                          formatter={(value: number, name: string) => [
                            name === 'balance' ? `${currency.symbol}${value.toFixed(2)}` : `+${currency.symbol}${value.toFixed(2)}`,
                            name === 'balance' ? t('risk_management.projected_balance') : t('risk_management.accumulated_gain')
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
                          stroke="#16a34a" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                          activeDot={{ r: 4, stroke: '#16a34a', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Legenda */}
                  <div className="flex justify-center gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 bg-blue-600 rounded"></div>
                      <span className="text-zinc-400">{t('risk_management.projected_balance')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 bg-green-600 rounded border-2 border-dashed border-green-600"></div>
                      <span className="text-zinc-400">{t('risk_management.accumulated_gain')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Marcos de Tempo */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-lg md:text-xl text-white">
                    {t('risk_management.realistic_goals')}
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base text-zinc-400">
                    {t('risk_management.expected_growth_based')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    {[7, 15, 30, 90].map((days) => {
                      // Cálculo mais realístico considerando dias de trading (5 dias por semana)
                      const config = getProfileConfig(riskProfile);
                      const tradingDays = Math.floor(days * 5/7); // Apenas dias úteis
                      const avgTradesPerDay = 1.2; // Média realística de trades por dia
                      const totalTrades = tradingDays * avgTradesPerDay;
                      
                      // Crescimento baseado no novo sistema (risco por trade vs lucro esperado 3x)
                      const expectedWin = config.riskPerTrade * config.expectedRiskReward; // 3x o risco
                      const expectedLoss = config.riskPerTrade; // 1x o risco
                      const expectedReturn = (config.winRate * expectedWin) - ((1 - config.winRate) * expectedLoss);
                      
                      const projectedBalance = results.accountBalance * Math.pow(1 + expectedReturn, totalTrades);
                      const totalGain = projectedBalance - results.accountBalance;
                      const gainPercentage = (totalGain / results.accountBalance) * 100;
                      
                      return (
                        <div key={days} className="space-y-3 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                            <span className="text-sm md:text-base text-zinc-400">
                              {t('risk_management.days_business_days').replace('{days}', days.toString()).replace('{tradingDays}', tradingDays.toString())}
                            </span>
                            <span className="text-sm md:text-base text-white font-medium">
                              {currency.symbol}{projectedBalance.toFixed(2)} ({gainPercentage >= 0 ? '+' : ''}{gainPercentage.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress 
                            value={Math.min(Math.abs(gainPercentage), 50)} 
                            className="h-3"
                          />
                          <div className="text-xs text-zinc-500">
                            {totalGain >= 0 ? t('risk_management.expected_gain') : t('risk_management.possible_loss')}: {totalGain >= 0 ? '+' : ''}{currency.symbol}{totalGain.toFixed(2)} (~{totalTrades.toFixed(0)} {t('risk_management.trades')})
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
                Insira o saldo da conta para ver projeções realísticas baseadas em dados do mercado
              </p>
              <p className="text-xs text-zinc-500 mt-2">
                ⚠️ Lembre-se: trading envolve riscos reais. Estas são apenas estimativas baseadas em probabilidades.
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Card de Integração WhatsApp - Gestão de Banca */}
        <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-800/50 mt-6 md:mt-8 lg:col-span-3">
          <CardHeader className="p-4 md:p-6 border-b border-green-800/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600/20 rounded-lg">
                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg md:text-xl text-white">
                  🚀 Gestão de Banca via WhatsApp
                </CardTitle>
                <CardDescription className="text-sm md:text-base text-green-400/80 mt-1">
                  Crie e gerencie sua banca personalizada direto pelo WhatsApp
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-4">
            {/* Instruções */}
            <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Como funciona:
              </h4>
              <div className="space-y-2 text-sm text-zinc-300">
                <div className="flex items-start gap-2">
                  <span className="text-green-500 font-mono">1.</span>
                  <div>
                    <p className="font-medium text-white">Configure seu WhatsApp no Perfil</p>
                    <p className="text-zinc-400 text-xs">Adicione seu número na aba "Perfil" da plataforma</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 font-mono">2.</span>
                  <div>
                    <p className="font-medium text-white">Crie sua gestão de banca</p>
                    <p className="text-zinc-400 text-xs font-mono">/banca criar 1000 moderado longo</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 font-mono">3.</span>
                  <div>
                    <p className="font-medium text-white">Veja seu resumo a qualquer momento</p>
                    <p className="text-zinc-400 text-xs font-mono">/banca</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Comandos disponíveis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
                <div className="text-xs text-zinc-500 uppercase mb-1">Criar Gestão</div>
                <code className="text-green-400 text-sm font-mono block">
                  /banca criar VALOR [PERFIL] [PRAZO]
                </code>
                <p className="text-xs text-zinc-400 mt-2">
                  Ex: <span className="text-white">/banca criar 1000</span>
                </p>
              </div>
              <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
                <div className="text-xs text-zinc-500 uppercase mb-1">Ver Resumo</div>
                <code className="text-green-400 text-sm font-mono block">
                  /banca
                </code>
                <p className="text-xs text-zinc-400 mt-2">
                  Mostra seus parâmetros e projeção
                </p>
              </div>
            </div>

            {/* Botão de ação */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => window.open('https://wa.me/5522974051621', '_blank')}
                data-testid="button-open-whatsapp"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Abrir WhatsApp (+55 22 97405-1621)
              </Button>
              <Button
                variant="outline"
                className="border-green-800 text-green-400 hover:bg-green-900/20"
                onClick={() => setLocation('/perfil')}
                data-testid="button-configure-whatsapp"
              >
                <Shield className="w-4 h-4 mr-2" />
                Configurar WhatsApp no Perfil
              </Button>
            </div>

            {/* Aviso de segurança */}
            <div className="flex items-start gap-2 bg-yellow-900/20 border border-yellow-800/30 rounded-lg p-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-yellow-200/90">
                <strong>Importante:</strong> Configure seu número WhatsApp no perfil antes de usar os comandos. 
                Somente usuários autenticados podem criar gestão de banca.
              </div>
            </div>
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}