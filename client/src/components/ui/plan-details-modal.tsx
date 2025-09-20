import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Crown, Zap, Calendar, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PlanDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  planInfo: {
    planType: 'free' | 'starter' | 'pro' | 'black';
    isAiEnabled: boolean;
    hasUnlimitedTrades: boolean;
    daysRemaining?: number;
    expiresAt?: string;
  };
}

export function PlanDetailsModal({ isOpen, onClose, planInfo }: PlanDetailsModalProps) {
  const getPlanInfo = () => {
    switch (planInfo.planType) {
      case 'free':
        return {
          name: 'Free',
          color: 'bg-gray-500',
          icon: <Zap className="w-5 h-5" />,
          description: 'Plano gratuito com recursos básicos'
        };
      case 'starter':
        return {
          name: 'Starter',
          color: 'bg-blue-600',
          icon: <Zap className="w-5 h-5" />,
          description: 'Plano ideal para traders iniciantes'
        };
      case 'pro':
        return {
          name: 'Pro',
          color: 'bg-purple-600',
          icon: <Crown className="w-5 h-5" />,
          description: 'Plano avançado para traders profissionais'
        };
      case 'black':
        return {
          name: 'Black',
          color: 'bg-black',
          icon: <Crown className="w-5 h-5" />,
          description: 'Plano premium com todos os recursos'
        };
      default:
        return {
          name: 'Free',
          color: 'bg-gray-500',
          icon: <Zap className="w-5 h-5" />,
          description: 'Plano gratuito com recursos básicos'
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
        color: "text-gray-600",
        icon: <Zap className="w-4 h-4" />
      };
    }
    
    // Se não há informação de dias restantes (plano sem expiração definida)
    if (planInfo.daysRemaining === undefined) {
      return {
        message: "Plano ativo (sem expiração definida)",
        color: "text-blue-600",
        icon: <CheckCircle className="w-4 h-4" />
      };
    }
    
    if (isExpired) {
      return {
        message: "Seu plano expirou",
        color: "text-red-600",
        icon: <Clock className="w-4 h-4" />
      };
    }
    
    if (isExpiringSoon) {
      return {
        message: `Expira em ${planInfo.daysRemaining} dias`,
        color: "text-yellow-600",
        icon: <Clock className="w-4 h-4" />
      };
    }
    
    return {
      message: `${planInfo.daysRemaining} dias restantes`,
      color: "text-green-600",
      icon: <CheckCircle className="w-4 h-4" />
    };
  };

  const statusInfo = getStatusMessage();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-white">
            <span>Detalhes do Plano</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Badge do Plano */}
          <div className="flex items-center justify-center">
            <Badge 
              className={`${planDetails.color} text-white flex items-center space-x-2 px-4 py-2 text-lg`}
            >
              {planDetails.icon}
              <span>{planDetails.name}</span>
            </Badge>
          </div>

          {/* Descrição */}
          <p className="text-center text-zinc-400">
            {planDetails.description}
          </p>

          {/* Status da Assinatura */}
          <div className="flex items-center justify-center space-x-2">
            <div className={`flex items-center space-x-2 ${statusInfo.color}`}>
              {statusInfo.icon}
              <span className="font-medium">{statusInfo.message}</span>
            </div>
          </div>

          {/* Informações de Expiração (apenas para planos pagos) */}
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

          {/* Recursos do Plano */}
          <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Recursos Disponíveis</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className={`w-4 h-4 ${planInfo.hasUnlimitedTrades ? 'text-green-600' : 'text-red-600'}`} />
                <span className="text-sm text-zinc-300">
                  {planInfo.hasUnlimitedTrades ? 'Trades ilimitados' : 'Máximo 10 trades'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className={`w-4 h-4 ${planInfo.isAiEnabled ? 'text-green-600' : 'text-red-600'}`} />
                <span className="text-sm text-zinc-300">
                  {planInfo.isAiEnabled ? 'Análise com IA' : 'Sem acesso à IA'}
                </span>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col space-y-2">
            {planInfo.planType === 'free' && (
              <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                Fazer Upgrade
              </Button>
            )}
            
            {isPaidPlan && (isExpired || isExpiringSoon) && (
              <Button className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                Renovar Plano
              </Button>
            )}
            
            <Button variant="outline" onClick={onClose} className="w-full border-zinc-600 text-white hover:bg-zinc-800">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}