import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";

export interface UserPlan {
  planType: 'free' | 'starter' | 'pro' | 'black';
  isAiEnabled: boolean;
  hasUnlimitedTrades: boolean;
}

export function useUserPlan() {
  const { user } = useAuth();

  const { data: userPlan, isLoading } = useQuery({
    queryKey: ['/api/user/plan', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/user/plan');
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
    isAiEnabled: planType !== 'free',
    hasUnlimitedTrades: planType !== 'free',
    isLoading,
    refresh: () => {
      // Re-fetch the user plan
      return fetch('/api/user/plan', { method: 'GET' });
    }
  };
}