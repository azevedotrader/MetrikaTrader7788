import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export interface UserPlan {
  planType: 'free' | 'monthly' | 'quarterly' | 'annual';
  isAiEnabled: boolean;
  hasUnlimitedTrades: boolean;
  daysRemaining?: number;
  expiresAt?: string;
}

// Helper function to check if a plan is paid (has full access)
export function isPaidPlan(planType: string): boolean {
  return planType === 'monthly' || planType === 'quarterly' || planType === 'annual';
}

// Helper to get plan display name
function getPlanDisplayName(planType: string): string {
  switch (planType) {
    case 'monthly': return 'Mensal';
    case 'quarterly': return 'Trimestral';
    case 'annual': return 'Anual';
    default: return 'Gratuito';
  }
}

export function useUserPlan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const previousPlanRef = useRef<string | null>(null);

  const { data: userPlan, isLoading } = useQuery<UserPlan>({
    queryKey: ['/api/user/plan'],
    enabled: !!user,
    staleTime: 15 * 1000, // 15 seconds - check frequently for plan changes
    refetchInterval: 30 * 1000, // Poll every 30 seconds for real-time updates
    refetchIntervalInBackground: true, // Keep polling even when tab is not focused
  });

  // Detect plan changes and notify user
  useEffect(() => {
    if (userPlan?.planType && previousPlanRef.current !== null) {
      const previousPlan = previousPlanRef.current;
      const currentPlan = userPlan.planType;
      
      if (previousPlan !== currentPlan) {
        const isUpgrade = isPaidPlan(currentPlan) && !isPaidPlan(previousPlan);
        const isDowngrade = !isPaidPlan(currentPlan) && isPaidPlan(previousPlan);
        const isPlanChange = isPaidPlan(currentPlan) && isPaidPlan(previousPlan);
        
        if (isUpgrade) {
          toast({
            title: "🎉 Plano Atualizado!",
            description: `Seu plano foi alterado para ${getPlanDisplayName(currentPlan)}. Aproveite todos os recursos!`,
            duration: 8000,
          });
        } else if (isDowngrade) {
          toast({
            title: "Plano Alterado",
            description: `Seu plano foi alterado para ${getPlanDisplayName(currentPlan)}.`,
            variant: "destructive",
            duration: 8000,
          });
        } else if (isPlanChange) {
          toast({
            title: "Plano Atualizado",
            description: `Seu plano foi alterado para ${getPlanDisplayName(currentPlan)}.`,
            duration: 5000,
          });
        }
        
        // Invalidate related caches to reflect new plan permissions
        queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      }
    }
    
    // Update reference for next comparison
    if (userPlan?.planType) {
      previousPlanRef.current = userPlan.planType;
    }
  }, [userPlan?.planType, toast, queryClient]);

  // Fallback for when we can't fetch the plan
  const planType = userPlan?.planType || 'free';
  const hasPaidPlan = isPaidPlan(planType);
  
  return {
    planType,
    isAiEnabled: hasPaidPlan, // All paid plans have AI access
    hasUnlimitedTrades: hasPaidPlan, // All paid plans have unlimited trades
    daysRemaining: userPlan?.daysRemaining,
    expiresAt: userPlan?.expiresAt,
    isLoading,
    refresh: () => {
      // Invalidar cache e re-fetch
      queryClient.invalidateQueries({ queryKey: ['/api/user/plan'] });
      const token = localStorage.getItem('user-token');
      if (!token) {
        throw new Error('Usuário não autenticado');
      }
      return fetch('/api/user/plan', { 
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
    }
  };
}