import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  LayoutDashboard, 
  PlusCircle, 
  BarChart, 
  Book, 
  Calendar,
  User,
  LogOut
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Novo Trade", href: "/novo-trade", icon: PlusCircle },
  { name: "Análises", href: "/analises", icon: BarChart },
  { name: "Calendário", href: "/calendario", icon: Calendar },
  { name: "Diário do Trader", href: "/diario", icon: Book },
  { name: "Perfil", href: "/perfil", icon: User },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className={cn(
        "fixed inset-y-0 left-0 bg-slate-800 border-r border-slate-700 z-50 transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-16"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 gradient-purple-blue rounded-lg flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span 
              className={cn(
                "text-xl font-bold gradient-text transition-all duration-300 whitespace-nowrap",
                isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
              )}
            >
              Métrika
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2">
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200",
                      location === item.href && "bg-slate-700 text-white",
                      isExpanded ? "justify-start px-3" : "justify-center px-0"
                    )}
                    title={!isExpanded ? item.name : undefined}
                  >
                    <item.icon className={cn("w-5 h-5 flex-shrink-0", isExpanded && "mr-3")} />
                    <span 
                      className={cn(
                        "transition-all duration-300 whitespace-nowrap",
                        isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0"
                      )}
                    >
                      {item.name}
                    </span>
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-2 border-t border-slate-700">
          <div className={cn("flex items-center transition-all duration-300", isExpanded ? "space-x-3 px-2" : "justify-center")}>
            <div className="w-10 h-10 gradient-purple-blue rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-medium text-sm">{user?.name?.charAt(0) || 'U'}</span>
            </div>
            <div 
              className={cn(
                "flex-1 transition-all duration-300",
                isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0"
              )}
            >
              <p className="text-sm font-medium text-white whitespace-nowrap">{user?.name}</p>
              <p className="text-xs text-slate-400 whitespace-nowrap">Trader Pro</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className={cn(
                "text-slate-400 hover:text-white transition-all duration-300 flex-shrink-0",
                isExpanded ? "opacity-100" : "opacity-0 w-0 p-0"
              )}
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
