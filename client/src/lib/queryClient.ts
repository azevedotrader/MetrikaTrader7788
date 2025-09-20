import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Obter o userId do localStorage
  const userId = localStorage.getItem('user-id');
  
  // ISOLAMENTO CRÍTICO: Rejeitar requisições sem userId válido
  if (!userId || userId === '' || userId === 'null') {
    throw new Error('Usuário não autenticado - faça login para acessar os dados');
  }
  
  const headers: Record<string, string> = {
    'user-id': userId, // Header usado pelo servidor
    'X-User-ID': userId, // Header alternativo
  };
  
  let body: string | FormData | undefined = undefined;
  
  if (data) {
    if (data instanceof FormData) {
      // For FormData, don't set Content-Type (browser will set it with boundary)
      body = data;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(data);
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Obter o userId do localStorage
    const userId = localStorage.getItem('user-id');
    
    // ISOLAMENTO CRÍTICO: Rejeitar queries sem userId válido
    if (!userId || userId === '' || userId === 'null') {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      throw new Error('Usuário não autenticado - faça login para acessar os dados');
    }
    
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers: {
        "user-id": userId, // Header usado pelo servidor
        "X-User-ID": userId, // Header alternativo
      },
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Função para limpar cache e garantir isolamento total de dados
export function clearUserDataCache() {
  console.log('🧹 Limpando cache para garantir isolamento de dados');
  queryClient.clear();
  queryClient.resetQueries();
  queryClient.invalidateQueries();
}
