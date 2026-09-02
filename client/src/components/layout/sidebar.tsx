import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  PlusCircle, 
  BarChart, 
  Book, 
  Calendar,
  User,
  LogOut,
  FileSpreadsheet,
  TrendingUp,
  X,
  MessageCircle,
  Calculator,
  GraduationCap,
  Upload,
  Wallet
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { CsvSelectionModal } from "@/components/modals/csv-selection-modal";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserPlan } from "@/hooks/useUserPlan";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const navigation = [
  { nameKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
  { nameKey: "trades.add_new", href: "/novo-trade", icon: PlusCircle },
  { nameKey: "trade.import_csv", href: "/importar-csv", icon: Upload },
  { nameKey: "nav.wallets", href: "/carteiras", icon: Wallet },
  { nameKey: "whatsapp.title", href: "/whatsapp", icon: FaWhatsapp },
  { nameKey: "risk_management.title", href: "/gestao", icon: Calculator },
  { nameKey: "calendar.title", href: "/calendario", icon: Calendar },
  { nameKey: "journal.title", href: "/diario", icon: Book },
  { nameKey: "nav.learning", href: "/aprendizado", icon: GraduationCap },
  { nameKey: "Clube do Gráfico", href: "/clube-do-grafico", icon: TrendingUp },
  { nameKey: "support.title", href: "/suporte", icon: MessageCircle },
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const isMobile = useIsMobile();
  const { planType } = useUserPlan();
  
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
    // Verificar se é suporte e se o usuário tem acesso
    if (href === '/suporte') {
      if (planType === 'free') {
        e?.preventDefault();
        setShowUpgradeModal(true);
        return;
      }
    }
    
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
          "fixed inset-y-0 left-0 bg-gradient-to-b from-zinc-900 via-zinc-900/98 to-zinc-950 border-r border-zinc-800/50 transition-all duration-300 ease-in-out z-50 backdrop-blur-sm",
          isMobile 
            ? cn("w-72 transform shadow-2xl", isOpen ? "translate-x-0" : "-translate-x-full")
            : cn(isExpanded ? "w-72 shadow-xl" : "w-16")
        )}
        onMouseEnter={() => !isMobile && setIsExpanded(true)}
        onMouseLeave={() => !isMobile && setIsExpanded(false)}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo and Close Button */}
          <div className="p-3 border-b border-zinc-800/30 flex-shrink-0">
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
                  className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 lg:hidden rounded-lg"
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
                        "w-full text-zinc-400 hover:bg-zinc-800/60 hover:text-white transition-all duration-200 rounded-lg h-10",
                        location === item.href && "bg-zinc-800/80 text-white border-l-2 border-purple-500",
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
          <div className="px-2 py-2 border-t border-zinc-800/30 space-y-1.5 bg-zinc-900/50 flex-shrink-0">
            {/* Análise CSV com IA */}
            <Button
              onClick={handleAnalyzeCsv}
              className={cn(
                "w-full text-emerald-400 hover:bg-emerald-600/20 hover:text-emerald-300 transition-all duration-200 bg-emerald-600/10 border border-emerald-600/20 rounded-lg h-9",
                sidebarExpanded ? "justify-start px-3" : "justify-center px-0"
              )}
              title={!sidebarExpanded ? t('brokers.csv_import') : undefined}
              data-testid="analyze-csv-sidebar-button"
            >
              <FileSpreadsheet className={cn(
                "w-4 h-4 flex-shrink-0",
                sidebarExpanded && "mr-2"
              )} />
              <span 
                className={cn(
                  "transition-all duration-300 whitespace-nowrap text-sm",
                  sidebarExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0"
                )}
              >
                {t('brokers.csv_import')}
              </span>
            </Button>

            {/* Gerenciar Importações */}
            <Button
              onClick={handleManageImports}
              className={cn(
                "w-full text-blue-400 hover:bg-blue-600/20 hover:text-blue-300 transition-all duration-200 bg-blue-600/10 border border-blue-600/20 rounded-lg h-9",
                sidebarExpanded ? "justify-start px-3" : "justify-center px-0"
              )}
              title={!sidebarExpanded ? t('imports.manage_description') : undefined}
              data-testid="manage-imports-sidebar-button"
            >
              <Upload className={cn(
                "w-4 h-4 flex-shrink-0",
                sidebarExpanded && "mr-2"
              )} />
              <span 
                className={cn(
                  "transition-all duration-300 whitespace-nowrap text-sm",
                  sidebarExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0"
                )}
              >
                {t('tabs.imports')}
              </span>
            </Button>
          </div>

          {/* User Profile Footer */}
          <div className="p-2 border-t border-zinc-800/30 bg-zinc-950/50 flex-shrink-0">
            <div className={cn(
              "flex items-center transition-all duration-300 rounded-lg p-2",
              sidebarExpanded ? "space-x-3 hover:bg-zinc-800/30" : "flex-col gap-2"
            )}>
              <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
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
        
        {/* Modal de Upgrade para Suporte */}
        <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
          <DialogContent className="w-full max-w-[95vw] md:max-w-4xl bg-zinc-900 border-zinc-800 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2 text-lg md:text-xl">
                🚀 Upgrade para Acessar Recursos Premium
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 p-4">
              {/* Descrição */}
              <div className="text-center space-y-3">
                <p className="text-zinc-300 text-sm md:text-base leading-relaxed">
                  O <strong className="text-purple-600">suporte completo</strong> está disponível para usuários dos 
                  planos <strong className="text-purple-600">Starter</strong>, <strong className="text-purple-600">Pro</strong> e <strong className="text-purple-600">VIP</strong>.
                </p>
                <p className="text-zinc-400 text-sm">
                  Faça upgrade para ter acesso ao suporte especializado e recursos avançados da Métrika.
                </p>
              </div>

              {/* Planos */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Plano Pro */}
                <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-4 md:p-6">
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">★</span>
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-white">Pro</h3>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-purple-600">R$ 49,90</p>
                    <p className="text-zinc-400 text-xs md:text-sm">por mês</p>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <span className="text-green-600">✓</span>
                      <span>Suporte exclusivo prioritário</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <span className="text-green-600">✓</span>
                      <span>Análise com IA ilimitada</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <span className="text-green-600">✓</span>
                      <span>Trades ilimitados</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <span className="text-green-600">✓</span>
                      <span>Relatórios avançados</span>
                    </div>
                  </div>
                </div>

                {/* Plano VIP */}
                <div className="bg-gradient-to-br from-black/40 to-zinc-900/40 border border-yellow-500/50 rounded-lg p-4 md:p-6 relative">
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                      MAIS POPULAR
                    </span>
                  </div>
                  
                  <div className="text-center space-y-3 mt-2">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-8 h-8 bg-black border border-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-yellow-500 text-sm font-bold">♥</span>
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-white">VIP</h3>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-yellow-500">R$ 97,00</p>
                    <p className="text-zinc-400 text-xs md:text-sm">por mês</p>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <span className="text-green-600">✓</span>
                      <span>Suporte VIP 24/7</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <span className="text-green-600">✓</span>
                      <span>Tudo do Pro +</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <span className="text-green-600">✓</span>
                      <span>Consultoria personalizada</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <span className="text-green-600">✓</span>
                      <span>Acesso antecipado</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full sm:flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-800 text-sm md:text-base py-2 md:py-3"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    // Aqui seria redirecionado para a página de planos
                    window.open('/pricing', '_blank');
                  }}
                  className="w-full sm:flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold text-sm md:text-base py-2 md:py-3"
                >
                  🚀 Fazer Upgrade Agora
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}