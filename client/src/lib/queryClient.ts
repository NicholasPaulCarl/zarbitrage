import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  url: string,
  options: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
    csrfToken?: string;
  } = {}
): Promise<T> {
  const { method = "GET", body, headers = {}, csrfToken } = options;
  
  // Check for admin token in localStorage and add to headers
  const adminToken = localStorage.getItem('adminToken');
  if (adminToken) {
    headers['x-admin-token'] = adminToken;
  }
  
  // Add CSRF token for state-changing requests
  if (csrfToken && (method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH')) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Check for admin token in localStorage and add to headers
    const adminToken = localStorage.getItem('adminToken');
    const headers: Record<string, string> = {};
    if (adminToken) {
      headers['x-admin-token'] = adminToken;
    }
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers
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
