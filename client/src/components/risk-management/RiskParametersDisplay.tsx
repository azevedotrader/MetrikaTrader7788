import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, TrendingUp, AlertTriangle, Target, Trash2, CheckCircle2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
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
