import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { apiRequest } from "./queryClient";

interface User {
  id: string;
  name: string;
  email: string;
  capitalInicial?: string;
  metaMensal?: string;
  perfilRisco?: string;
  createdAt?: string;
  updatedAt?: string;
  initials?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
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
    } catch (error: any) {
      throw new Error(error.message || "Erro ao fazer login");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Load user from localStorage on app start
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      logout 
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
