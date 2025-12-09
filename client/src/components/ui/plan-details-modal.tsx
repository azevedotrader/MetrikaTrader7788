import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Crown, Zap, Calendar, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PlanDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  planInfo: {
    planType: 'free' | 'monthly' | 'quarterly' | 'annual';
    isAiEnabled: boolean;
    hasUnlimitedTrades: boolean;
    daysRemaining?: number;
    expiresAt?: string;
  };
}

const CHECKOUT_LINKS = {
  monthly: 'https://hub.la/g/CGRfvH9XIZzkXUFTkesn',
  quarterly: 'https://hub.la/g/lUlRpoibiOjhnJF47H43',
  annual: 'https://hub.la/g/kUCz3mE6Gon3TeOz1h40',
};

export function PlanDetailsModal({ isOpen, onClose, planInfo }: PlanDetailsModalProps) {
  const getPlanInfo = () => {
    switch (planInfo.planType) {
      case 'free':
        return {
          name: 'Free',
          color: 'bg-gray-500',
          icon: <Zap className="w-5 h-5" />,
          description: 'Plano gratuito com recursos limitados'
        };
      case 'monthly':
        return {
          name: 'Mensal',
          color: 'bg-blue-600',
          icon: <Crown className="w-5 h-5" />,
          description: 'Acesso completo por 1 mês'
        };
      case 'quarterly':
        return {
          name: 'Trimestral',
          color: 'bg-purple-600',
          icon: <Crown className="w-5 h-5" />,
          description: 'Acesso completo por 3 meses'
        };
      case 'annual':
        return {
          name: 'Anual',
          color: 'bg-gradient-to-r from-purple-600 to-blue-600',
          icon: <Crown className="w-5 h-5" />,
          description: 'Acesso completo por 1 ano - Melhor custo-benefício'
        };
      default:
        return {
          name: 'Free',
          color: 'bg-gray-500',
          icon: <Zap className="w-5 h-5" />,
          description: 'Plano gratuito com recursos limitados'
        };
    }
  };

  const planDetails = getPlanInfo();
  const isPaidPlan = planInfo.planType !== 'free';
  const isExpired = planInfo.daysRemaining !== undefined && planInfo.daysRemaining < 0;
  const isExpiringSoon = planInfo.daysRemaining !== undefined && planInfo.daysRemaining <= 7 && planInfo.daysRemaining > 0;

  const formatExpirationDate = (expiresAt: string) => {
    try {
      return format(new Date(expiresAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const getStatusMessage = () => {
    if (!isPaidPlan) {
      return {
        message: "Você está no plano gratuito",
        color: "text-gray-400",
        icon: <Zap className="w-4 h-4" />
      };
    }
    
    if (planInfo.daysRemaining === undefined) {
      return {
        message: "Plano ativo",
        color: "text-green-500",
        icon: <CheckCircle className="w-4 h-4" />
      };
    }
    
    if (isExpired) {
      return {
        message: "Seu plano expirou",
        color: "text-red-500",
        icon: <Clock className="w-4 h-4" />
      };
    }
    
    if (isExpiringSoon) {
      return {
        message: `Expira em ${planInfo.daysRemaining} dias`,
        color: "text-yellow-500",
        icon: <Clock className="w-4 h-4" />
      };
    }
    
    return {
      message: `${planInfo.daysRemaining} dias restantes`,
      color: "text-green-500",
      icon: <CheckCircle className="w-4 h-4" />
    };
  };

  const handleUpgradeClick = (plan: 'monthly' | 'quarterly' | 'annual') => {
    window.open(CHECKOUT_LINKS[plan], '_blank');
  };

  const statusInfo = getStatusMessage();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-zinc-900 border-zinc-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-white">
            <span>Detalhes do Plano</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-center">
            <Badge 
              className={`${planDetails.color} text-white flex items-center space-x-2 px-4 py-2 text-lg`}
            >
              {planDetails.icon}
              <span>{planDetails.name}</span>
            </Badge>
          </div>

          <p className="text-center text-zinc-400">
            {planDetails.description}
          </p>

          <div className="flex items-center justify-center space-x-2">
            <div className={`flex items-center space-x-2 ${statusInfo.color}`}>
              {statusInfo.icon}
              <span className="font-medium">{statusInfo.message}</span>
            </div>
          </div>

          {isPaidPlan && planInfo.expiresAt && (
            <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2 text-zinc-300">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Data de Expiração</span>
              </div>
              <p className="text-white font-medium">
                {formatExpirationDate(planInfo.expiresAt)}
              </p>
              
              {planInfo.daysRemaining !== undefined && (
                <div className="flex items-center space-x-2 text-zinc-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    {planInfo.daysRemaining > 0 
                      ? `${planInfo.daysRemaining} dias restantes`
                      : planInfo.daysRemaining === 0
                      ? 'Expira hoje'
                      : `Expirado há ${Math.abs(planInfo.daysRemaining)} dias`
                    }
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Recursos do seu Plano</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                {planInfo.hasUnlimitedTrades ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm text-zinc-300">
                  {planInfo.hasUnlimitedTrades ? 'Trades ilimitados' : 'Máximo 10 trades'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {planInfo.isAiEnabled ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm text-zinc-300">
                  {planInfo.isAiEnabled ? 'Análise com IA' : 'Sem acesso à IA'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {isPaidPlan ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm text-zinc-300">
                  {isPaidPlan ? 'Suporte prioritário' : 'Suporte básico'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {isPaidPlan ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm text-zinc-300">
                  {isPaidPlan ? 'Importação CSV ilimitada' : 'Importação CSV limitada'}
                </span>
              </div>
            </div>
          </div>

          {planInfo.planType === 'free' && (
            <div className="bg-zinc-800/50 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-medium text-center text-zinc-300">Escolha seu plano</h3>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  onClick={() => handleUpgradeClick('monthly')}
                  className="flex flex-col items-center py-4 bg-blue-600 hover:bg-blue-700"
                  data-testid="button-upgrade-monthly"
                >
                  <span className="text-xs font-medium">Mensal</span>
                  <ExternalLink className="w-3 h-3 mt-1" />
                </Button>
                <Button 
                  onClick={() => handleUpgradeClick('quarterly')}
                  className="flex flex-col items-center py-4 bg-purple-600 hover:bg-purple-700"
                  data-testid="button-upgrade-quarterly"
                >
                  <span className="text-xs font-medium">Trimestral</span>
                  <ExternalLink className="w-3 h-3 mt-1" />
                </Button>
                <Button 
                  onClick={() => handleUpgradeClick('annual')}
                  className="flex flex-col items-center py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  data-testid="button-upgrade-annual"
                >
                  <span className="text-xs font-medium">Anual</span>
                  <ExternalLink className="w-3 h-3 mt-1" />
                </Button>
              </div>
            </div>
          )}
          
          {isPaidPlan && (isExpired || isExpiringSoon) && (
            <div className="grid grid-cols-3 gap-2">
              <Button 
                onClick={() => handleUpgradeClick('monthly')}
                className="flex flex-col items-center py-3 bg-blue-600 hover:bg-blue-700"
              >
                <span className="text-xs">Renovar Mensal</span>
              </Button>
              <Button 
                onClick={() => handleUpgradeClick('quarterly')}
                className="flex flex-col items-center py-3 bg-purple-600 hover:bg-purple-700"
              >
                <span className="text-xs">Renovar Trimestral</span>
              </Button>
              <Button 
                onClick={() => handleUpgradeClick('annual')}
                className="flex flex-col items-center py-3 bg-gradient-to-r from-purple-600 to-blue-600"
              >
                <span className="text-xs">Renovar Anual</span>
              </Button>
            </div>
          )}
          
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="w-full border-zinc-600 text-white hover:bg-zinc-800"
            data-testid="button-close-modal"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
