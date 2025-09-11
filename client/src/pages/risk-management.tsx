import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calculator, TrendingUp, DollarSign, Target } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface RiskCalculation {
  accountBalance: number;
  riskPercentage: number;
  riskRewardRatio: number;
  riskAmount: number;
  potentialProfit: number;
  positionSize: number;
  dailyGrowthProjection: number;
}

export default function RiskManagement() {
  const { t } = useLanguage();
  const [accountBalance, setAccountBalance] = useState<string>("");
  const [riskPercentage, setRiskPercentage] = useState<string>("2");
  const [riskRewardRatio, setRiskRewardRatio] = useState<string>("2");
  const [results, setResults] = useState<RiskCalculation | null>(null);

  const calculateRisk = () => {
    const balance = parseFloat(accountBalance) || 0;
    const risk = parseFloat(riskPercentage) || 2;
    const rrRatio = parseFloat(riskRewardRatio) || 2;

    if (balance <= 0) return;

    const riskAmount = (balance * risk) / 100;
    const potentialProfit = riskAmount * rrRatio;
    const positionSize = riskAmount / 200; // Simplified calculation without stop loss pips
    const dailyGrowthProjection = (potentialProfit / balance) * 100;

    setResults({
      accountBalance: balance,
      riskPercentage: risk,
      riskRewardRatio: rrRatio,
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
  }, [accountBalance, riskPercentage, riskRewardRatio]);

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

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
          {/* Configurações */}
          <Card className="bg-zinc-900/50 border-zinc-800">
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
                <Label htmlFor="risk" className="text-sm md:text-base text-zinc-300">
                  {t('risk_management.risk_percentage')} (%)
                </Label>
                <Input
                  id="risk"
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={riskPercentage}
                  onChange={(e) => setRiskPercentage(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white h-12 text-base"
                  data-testid="input-risk-percentage"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rrRatio" className="text-sm md:text-base text-zinc-300">
                  {t('risk_management.risk_reward_ratio')}
                </Label>
                <Input
                  id="rrRatio"
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  value={riskRewardRatio}
                  onChange={(e) => setRiskRewardRatio(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white h-12 text-base"
                  data-testid="input-risk-reward-ratio"
                />
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

          {/* Resultados */}
          {results && (
            <div className="space-y-4 md:space-y-6">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-lg md:text-xl text-white">
                    {t('risk_management.results')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
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
                      title={t('risk_management.position_size')}
                      value={`${results.positionSize.toFixed(2)} lots`}
                      color="bg-blue-600"
                      icon={Calculator}
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

              {/* Projeção de Crescimento */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-lg md:text-xl text-white">
                    {t('risk_management.growth_projection')}
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base text-zinc-400">
                    {t('risk_management.growth_projection_description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="space-y-3 md:space-y-4">
                    {[7, 15, 30, 90].map((days) => {
                      const projectedBalance = results.accountBalance * Math.pow(1 + (results.dailyGrowthProjection / 100), days);
                      const totalGain = projectedBalance - results.accountBalance;
                      const gainPercentage = (totalGain / results.accountBalance) * 100;
                      
                      return (
                        <div key={days} className="space-y-2">
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                            <span className="text-sm md:text-base text-zinc-400">
                              {t('risk_management.after_days').replace('{days}', days.toString())}
                            </span>
                            <span className="text-sm md:text-base text-white font-medium">
                              ${projectedBalance.toFixed(2)} (+{gainPercentage.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress 
                            value={Math.min(gainPercentage, 100)} 
                            className="h-2"
                          />
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
          <Card className="bg-zinc-900/50 border-zinc-800 mt-6 md:mt-8">
            <CardContent className="p-6 md:p-8 text-center">
              <Calculator className="w-12 h-12 md:w-16 md:h-16 text-zinc-600 mx-auto mb-3 md:mb-4" />
              <p className="text-sm md:text-base text-zinc-400">
                {t('risk_management.enter_balance_to_start')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}