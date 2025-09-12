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

  const { data: userPlan, isLoading } = useQuery({
    queryKey: ['/api/user/plan', user?.id],
    queryFn: async () => {
      const userId = localStorage.getItem('user-id');
      
      if (!userId || userId === '' || userId === 'null') {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch('/api/user/plan', {
        headers: {
          'user-id': userId,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user plan');
      }
      const data = await response.json();
      return data as UserPlan;
    },
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
      return fetch('/api/user/plan', { 
        method: 'GET',
        headers: {
          'user-id': localStorage.getItem('user-id') || '',
          'Content-Type': 'application/json'
        }
      });
    }
  };
}