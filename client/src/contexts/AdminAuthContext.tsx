import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Admin-specific API request function
async function adminApiRequest(url: string, method: string = 'GET', data?: any, token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text}`);
  }
  
  return await response.json();
}

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  adminUser: any | null;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  adminLogout: () => void;
  isLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check admin authentication status on mount
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (token) {
          const response = await adminApiRequest('/api/admin/auth/verify', 'GET', undefined, token);
          setIsAdminAuthenticated(true);
          setAdminUser(response);
        }
      } catch (error) {
        localStorage.removeItem('adminToken');
        setIsAdminAuthenticated(false);
        setAdminUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAuth();
  }, []);

  const adminLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await adminApiRequest('/api/admin/auth/login', 'POST', {
        email,
        password
      });

      if (response?.token) {
        localStorage.setItem('adminToken', response.token);
        setIsAdminAuthenticated(true);
        setAdminUser(response.admin);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Admin login error:', error);
      return false;
    }
  };

  const adminLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAdminAuthenticated(false);
    setAdminUser(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAdminAuthenticated,
        adminUser,
        adminLogin,
        adminLogout,
        isLoading
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}