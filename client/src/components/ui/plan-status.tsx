import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { PlanDetailsModal } from "./plan-details-modal";

interface PlanInfo {
  planType: 'free' | 'monthly' | 'quarterly' | 'annual';
  isAiEnabled: boolean;
  hasUnlimitedTrades: boolean;
  daysRemaining?: number;
  expiresAt?: string;
}

interface PlanStatusProps {
  compact?: boolean;
}

export function PlanStatus({ compact = false }: PlanStatusProps) {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data: planInfo, isLoading, error } = useQuery<PlanInfo>({
    queryKey: ['/api/user/plan'],
    refetchInterval: 60000, // Atualiza a cada minuto
    enabled: !!user, // Só executa se o usuário estiver logado
  });

  // Se não há usuário logado ou dados carregando, mostrar plano padrão
  if (!user || isLoading || error || !planInfo) {
    // Mostrar badge básico enquanto carrega ou se há erro
    return (
      <div className="flex items-center space-x-2" data-testid="plan-status">
        <Badge 
          className="bg-gray-500 text-white hover:bg-gray-600 flex items-center space-x-1 px-2 py-1 text-xs cursor-pointer transition-colors"
          data-testid="badge-plan-loading"
        >
          <Zap className="w-3 h-3" />
          <span>Free</span>
        </Badge>
      </div>
    );
  }

  const getPlanInfo = () => {
    switch (planInfo.planType) {
      case 'free':
        return {
          name: 'Free',
          color: 'bg-gray-500',
          icon: <Zap className="w-3 h-3" />
        };
      case 'monthly':
        return {
          name: 'Mensal',
          color: 'bg-[#448aff]',
          icon: <Crown className="w-3 h-3" />
        };
      case 'quarterly':
        return {
          name: 'Trimestral',
          color: 'bg-[#5bc800]',
          icon: <Crown className="w-3 h-3" />
        };
      case 'annual':
        return {
          name: 'Anual',
          color: 'bg-[#6EE000]',
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

  return (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3" data-testid="plan-status">
        <Badge 
          className={`${planDetails.color} text-white hover:${planDetails.color}/80 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium cursor-pointer transition-all duration-200 hover:scale-105`}
          data-testid={`badge-plan-${planInfo.planType}`}
          onClick={() => setIsModalOpen(true)}
        >
          {planDetails.icon}
          <span>{planDetails.name}</span>
        </Badge>
        
      </div>

      <PlanDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        planInfo={planInfo}
      />
    </>
  );
}