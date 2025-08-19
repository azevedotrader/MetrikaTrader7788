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
  LogOut,
  FileSpreadsheet,
  TrendingUp,
  X
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { CsvSelectionModal } from "@/components/modals/csv-selection-modal";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Novo Trade", href: "/novo-trade", icon: PlusCircle },
  { name: "Gráficos", href: "/graficos", icon: TrendingUp },
  { name: "Calendário", href: "/calendario", icon: Calendar },
  { name: "Diário do Trader", href: "/diario", icon: Book },
  { name: "Perfil", href: "/perfil", icon: User },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const isMobile = useIsMobile();
  
  // On mobile, sidebar is controlled by isOpen prop
  // On desktop, use hover behavior
  const sidebarExpanded = isMobile ? isOpen : isExpanded;

  const handleAnalyzeCsv = () => {
    setShowCsvModal(true);
  };

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    if (isMobile && isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && onClose) {
          onClose();
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isMobile, isOpen, onClose]);

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <div 
        className={cn(
          "fixed inset-y-0 left-0 bg-zinc-900/90 border-r border-zinc-800 transition-all duration-300 ease-in-out z-50",
          isMobile 
            ? cn("w-64 transform", isOpen ? "translate-x-0" : "-translate-x-full")
            : cn(isExpanded ? "w-64" : "w-16")
        )}
        onMouseEnter={() => !isMobile && setIsExpanded(true)}
        onMouseLeave={() => !isMobile && setIsExpanded(false)}
      >
        <div className="flex flex-col h-full">
          {/* Logo and Close Button */}
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span 
                  className={cn(
                    "text-xl font-bold gradient-text transition-all duration-300 whitespace-nowrap",
                    sidebarExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  )}
                >
                  Métrika
                </span>
              </div>
              
              {/* Close button for mobile */}
              {isMobile && isOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-zinc-400 hover:text-white lg:hidden"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
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
                        "w-full text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all duration-200",
                        location === item.href && "bg-zinc-800 text-white",
                        sidebarExpanded ? "justify-start px-3" : "justify-center px-0"
                      )}
                      title={!sidebarExpanded ? item.name : undefined}
                      onClick={handleLinkClick}
                    >
                      <item.icon className={cn("w-5 h-5 flex-shrink-0", sidebarExpanded && "mr-3")} />
                      <span 
                        className={cn(
                          "transition-all duration-300 whitespace-nowrap",
                          sidebarExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0"
                        )}
                      >
                        {item.name}
                      </span>
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Análise CSV com IA */}
            <div className="px-2 py-3 border-t border-zinc-800/50">
              <Button
                onClick={handleAnalyzeCsv}
                className={cn(
                  "w-full text-zinc-300 hover:bg-green-700 hover:text-white transition-all duration-200 bg-green-600/20 border border-green-600/30",
                  sidebarExpanded ? "justify-start px-3" : "justify-center px-0"
                )}
                title={!sidebarExpanded ? "Analisar CSV com IA" : undefined}
                data-testid="analyze-csv-sidebar-button"
              >
                <FileSpreadsheet className={cn(
                  "w-5 h-5 flex-shrink-0",
                  sidebarExpanded && "mr-3"
                )} />
                <span 
                  className={cn(
                    "transition-all duration-300 whitespace-nowrap",
                    sidebarExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0"
                  )}
                >
                  Analisar CSV com IA
                </span>
              </Button>
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-2 border-t border-zinc-800">
            <div className={cn("flex items-center transition-all duration-300", sidebarExpanded ? "space-x-3 px-2" : "justify-center")}>
              <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium text-sm">{user?.name?.charAt(0) || 'U'}</span>
              </div>
              <div 
                className={cn(
                  "flex-1 transition-all duration-300",
                  sidebarExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0"
                )}
              >
                <p className="text-sm font-medium text-white whitespace-nowrap">{user?.name}</p>
                <p className="text-xs text-zinc-400 whitespace-nowrap">Trader Pro</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout();
                  if (isMobile && onClose) {
                    onClose();
                  }
                }}
                className={cn(
                  "text-zinc-400 hover:text-white transition-all duration-300 flex-shrink-0",
                  sidebarExpanded ? "opacity-100" : "opacity-0 w-0 p-0"
                )}
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <CsvSelectionModal 
          open={showCsvModal} 
          onOpenChange={setShowCsvModal}
        />
      </div>
    </>
  );
}