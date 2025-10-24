import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { apiRequest, clearUserDataCache } from "./queryClient";

interface User {
  id: string;
  name: string;
  email: string;
  capitalInicial?: string;
  metaMensal?: string;
  perfilRisco?: string;
  whatsappNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  initials?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Get initials from user name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao fazer login");
      }
      
      const userData = await response.json();
      
      // Add initials to user data
      const userWithInitials = {
        ...userData,
        initials: getInitials(userData.name)
      };
      
      setUser(userWithInitials);
      
      // Store user in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(userWithInitials));
      localStorage.setItem('user-id', userData.id);
      
      // Store JWT token for authentication
      if (userData.token) {
        localStorage.setItem('user-token', userData.token);
      }
      
      // Store first login flag for tour triggering
      if (userData.isFirstLogin) {
        localStorage.setItem('should-start-tour', 'true');
      }
      
      // Limpar cache anterior para garantir isolamento
      clearUserDataCache();
    } catch (error: any) {
      throw new Error(error.message || "Erro ao fazer login");
    }
  };

  const updateUser = (updatedData: Partial<User>) => {
    if (user) {
      const updatedUser = {
        ...user,
        ...updatedData,
        initials: getInitials(updatedData.name || user.name)
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('user-id');
    localStorage.removeItem('user-token');
    // Limpar todo o cache para garantir isolamento total
    clearUserDataCache();
  };

  // Load user from localStorage on app start
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Ensure user-id is also in localStorage
        if (parsedUser.id && !localStorage.getItem('user-id')) {
          localStorage.setItem('user-id', parsedUser.id);
        }
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem('user');
        localStorage.removeItem('user-id');
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
