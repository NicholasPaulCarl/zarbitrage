import { useState, useEffect } from 'react';

interface CSRFResponse {
  csrfToken: string;
}

export function useCSRF() {
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCSRFToken = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/csrf-token', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch CSRF token');
        }
        
        const data: CSRFResponse = await response.json();
        setCsrfToken(data.csrfToken);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching CSRF token:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCSRFToken();
  }, []);

  const refreshToken = async () => {
    const response = await fetch('/api/csrf-token', {
      credentials: 'include'
    });
    const data: CSRFResponse = await response.json();
    setCsrfToken(data.csrfToken);
    return data.csrfToken;
  };

  return { csrfToken, loading, error, refreshToken };
}

// Helper function to add CSRF token to request headers
export function addCSRFHeaders(headers: HeadersInit = {}, csrfToken: string): HeadersInit {
  return {
    ...headers,
    'X-CSRF-Token': csrfToken,
  };
}

// Helper function for fetch requests with CSRF protection
export async function csrfFetch(url: string, options: RequestInit = {}, csrfToken: string) {
  const headers = addCSRFHeaders(options.headers, csrfToken);
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}