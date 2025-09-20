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
  // Obter o token JWT do localStorage
  const token = localStorage.getItem('user-token');
  
  // ISOLAMENTO CRÍTICO: Rejeitar requisições sem token válido
  if (!token || token === '' || token === 'null') {
    throw new Error('Usuário não autenticado - faça login para acessar os dados');
  }
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`, // Header JWT obrigatório
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
    // Obter o token JWT do localStorage
    const token = localStorage.getItem('user-token');
    
    // ISOLAMENTO CRÍTICO: Rejeitar queries sem token válido
    if (!token || token === '' || token === 'null') {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      throw new Error('Usuário não autenticado - faça login para acessar os dados');
    }
    
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers: {
        "Authorization": `Bearer ${token}`, // Header JWT obrigatório
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
