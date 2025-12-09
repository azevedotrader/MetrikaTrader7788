import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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

export function useUserPlan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: userPlan, isLoading } = useQuery<UserPlan>({
    queryKey: ['/api/user/plan'],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

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