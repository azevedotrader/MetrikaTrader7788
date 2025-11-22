import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface UserPlan {
  planType: 'free' | 'starter' | 'pro' | 'black';
  isAiEnabled: boolean;
  hasUnlimitedTrades: boolean;
  daysRemaining?: number;
  expiresAt?: string;
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
  
  return {
    planType,
    isAiEnabled: planType === 'pro' || planType === 'black',
    hasUnlimitedTrades: planType !== 'free',
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