import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Clock, Crown, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface PlanInfo {
  planType: 'free' | 'starter' | 'pro' | 'black';
  isAiEnabled: boolean;
  hasUnlimitedTrades: boolean;
  daysRemaining?: number;
  expiresAt?: string;
}

export function PlanStatus() {
  const { user } = useAuth();
  
  const { data: planInfo, isLoading, error } = useQuery({
    queryKey: ['/api/user/plan'],
    queryFn: async () => {
      const userId = localStorage.getItem('user-id');
      
      if (!userId || userId === '' || userId === 'null') {
        throw new Error('Usuário não autenticado');
      }
      
      const response = await fetch('/api/user/plan', {
        credentials: "include",
        headers: {
          "user-id": userId,
          "X-User-ID": userId,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch plan info');
      }
      return response.json() as PlanInfo;
    },
    refetchInterval: 60000, // Atualiza a cada minuto
    enabled: !!user, // Só executa se o usuário estiver logado
  });

  // Se não há usuário logado ou dados carregando
  if (!user || isLoading || error || !planInfo) {
    return null;
  }

  const getPlanInfo = () => {
    switch (planInfo.planType) {
      case 'free':
        return {
          name: 'Free',
          color: 'bg-gray-500',
          icon: <Zap className="w-3 h-3" />
        };
      case 'starter':
        return {
          name: 'Starter',
          color: 'bg-blue-500',
          icon: <Zap className="w-3 h-3" />
        };
      case 'pro':
        return {
          name: 'Pro',
          color: 'bg-purple-500',
          icon: <Crown className="w-3 h-3" />
        };
      case 'black':
        return {
          name: 'Black',
          color: 'bg-black',
          icon: <Crown className="w-3 h-3" />
        };
      default:
        return {
          name: 'Free',
          color: 'bg-gray-500',
          icon: <Zap className="w-3 h-3" />
        };
    }
  };

  const planDetails = getPlanInfo();
  const showDuration = planInfo.planType !== 'free' && planInfo.daysRemaining !== undefined;

  const formatDaysRemaining = (days: number) => {
    if (days > 0) {
      return `${days} dias restantes`;
    } else if (days === 0) {
      return 'Expira hoje';
    } else {
      return 'Expirado';
    }
  };

  return (
    <div className="flex items-center space-x-2" data-testid="plan-status">
      <Badge 
        className={`${planDetails.color} text-white hover:${planDetails.color}/80 flex items-center space-x-1 px-2 py-1 text-xs`}
        data-testid={`badge-plan-${planInfo.planType}`}
      >
        {planDetails.icon}
        <span>{planDetails.name}</span>
      </Badge>
      
      {showDuration && (
        <div className="flex items-center space-x-1 text-xs text-zinc-400" data-testid="plan-duration">
          <Clock className="w-3 h-3" />
          <span>
            {planInfo.daysRemaining !== undefined 
              ? formatDaysRemaining(planInfo.daysRemaining)
              : ''
            }
          </span>
        </div>
      )}
    </div>
  );
}