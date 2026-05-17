import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  PlusCircle,
  BarChart,
  Calendar,
  User,
  LogOut,
  FileSpreadsheet,
  TrendingUp,
  X,
  Calculator,
  Upload,
  Wallet,
  Sun,
  Moon
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { CsvSelectionModal } from "@/components/modals/csv-selection-modal";
import { useLanguage } from "@/contexts/LanguageContext";

const navigation = [
  { nameKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
  { nameKey: "trades.add_new", href: "/novo-trade", icon: PlusCircle },
  { nameKey: "trade.import_csv", href: "/importar-csv", icon: Upload },
  { nameKey: "nav.wallets", href: "/carteiras", icon: Wallet },
  { nameKey: "risk_management.title", href: "/gestao", icon: Calculator },
  { nameKey: "calendar.title", href: "/calendario", icon: Calendar },
  { nameKey: "profile.title", href: "/perfil", icon: User },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showImportsModal, setShowImportsModal] = useState(false);
  const isMobile = useIsMobile();

  const [theme, setTheme] = useState<'dark'|'light'>(() => {
    return (localStorage.getItem('metrika-theme') as 'dark'|'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('metrika-theme', theme);
  }, [theme]);

  // On mobile, sidebar is controlled by isOpen prop
  // On desktop, use hover behavior
  const sidebarExpanded = isMobile ? isOpen : isExpanded;

  const handleAnalyzeCsv = () => {
    setShowCsvModal(true);
  };

  const handleManageImports = () => {
    // Navegar para a página dedicada de importações
    if (isMobile && onClose) {
      onClose();
    }
    window.location.href = '/importacoes';
  };

  const handleLinkClick = (href: string, e?: React.MouseEvent) => {
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
        data-testid="sidebar"
        className={cn(
          "fixed inset-y-0 left-0 bg-[var(--sidebar-background)] border-r border-[var(--sidebar-border)] transition-all duration-300 ease-in-out z-50 backdrop-blur-sm",
          isMobile 
            ? cn("w-72 transform shadow-2xl", isOpen ? "translate-x-0" : "-translate-x-full")
            : cn(isExpanded ? "w-72 shadow-xl" : "w-16")
        )}
        onMouseEnter={() => !isMobile && setIsExpanded(true)}
        onMouseLeave={() => !isMobile && setIsExpanded(false)}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo and Close Button */}
          <div className="p-3 border-b border-[#1e1e2e]/30 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center">
                <Logo variant="sidebar" expanded={sidebarExpanded} />
              </div>
              
              {/* Close button for mobile */}
              {isMobile && isOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-zinc-400 hover:text-white hover:bg-[#13131a]/50 lg:hidden rounded-lg"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Navigation - scrollbar hidden by default */}
          <nav className="flex-1 min-h-0 px-2 py-3 overflow-y-auto scrollbar-hidden hover:scrollbar-thin">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full text-zinc-400 hover:bg-[#13131a]/60 hover:text-white transition-all duration-200 rounded-lg h-10",
                        location === item.href && "bg-[#13131a]/80 text-white border-l-2 border-[#6EE000]",
                        sidebarExpanded ? "justify-start px-3" : "justify-center px-0"
                      )}
                      title={!sidebarExpanded ? t(item.nameKey) : undefined}
                      onClick={(e) => handleLinkClick(item.href, e)}
                    >
                      <item.icon className={cn("w-5 h-5 flex-shrink-0", sidebarExpanded && "mr-3")} />
                      <span 
                        className={cn(
                          "transition-all duration-300 whitespace-nowrap text-sm",
                          sidebarExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0"
                        )}
                      >
                        {t(item.nameKey)}
                      </span>
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Action Buttons - Fixed at bottom above footer */}
          <div className="px-2 py-2 border-t border-[#1e1e2e]/30 space-y-1.5 bg-[#0a0a0f]/50 flex-shrink-0">
            {/* Theme Toggle */}
            <Button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className={cn(
                "w-full transition-all duration-200 rounded-lg h-9 border",
                theme === 'dark'
                  ? "text-[#ffa000] hover:bg-[#ffa000]/10 bg-transparent border-[#ffa000]/20 hover:border-[#ffa000]/40"
                  : "text-[#1a6fd4] hover:bg-[#1a6fd4]/10 bg-transparent border-[#1a6fd4]/20 hover:border-[#1a6fd4]/40",
                sidebarExpanded ? "justify-start px-3" : "justify-center px-0"
              )}
              title={!sidebarExpanded ? (theme === 'dark' ? 'Modo Claro' : 'Modo Escuro') : undefined}
            >
              {theme === 'dark'
                ? <Sun className={cn("w-4 h-4 flex-shrink-0", sidebarExpanded && "mr-2")} />
                : <Moon className={cn("w-4 h-4 flex-shrink-0", sidebarExpanded && "mr-2")} />
              }
              <span className={cn("transition-all duration-300 whitespace-nowrap text-sm", sidebarExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0")}>
                {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              </span>
            </Button>

          </div>

          {/* User Profile Footer */}
          <div className="p-2 border-t border-[#1e1e2e]/30 bg-[#0a0a0f]/50 flex-shrink-0">
            <div className={cn(
              "flex items-center transition-all duration-300 rounded-lg p-2",
              sidebarExpanded ? "space-x-3 hover:bg-[#13131a]/30" : "flex-col gap-2"
            )}>
              <div className="w-9 h-9 bg-[#1e1e2e] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-white font-semibold text-sm">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
              </div>
              <div 
                className={cn(
                  "flex-1 min-w-0 transition-all duration-300",
                  sidebarExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0 hidden"
                )}
              >
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
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
                  "text-zinc-500 hover:text-red-400 hover:bg-red-900/20 transition-all duration-200 flex-shrink-0 rounded-lg",
                  sidebarExpanded ? "h-8 w-8 p-0" : "h-8 w-8 p-0"
                )}
                title={t('nav.logout')}
                data-testid="sidebar-logout-button"
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