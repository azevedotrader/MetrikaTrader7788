import { Button } from "@/components/ui/button";
import { Bell, Settings, Menu, ChevronDown, Eye, EyeOff, Wallet, LogOut, User } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { LanguageSelector } from "@/components/ui/language-selector";
import { PlanStatus } from "@/components/ui/plan-status";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/LanguageContext";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Wallet as WalletType } from "@shared/schema";

interface TopBarProps {
  title: string;
  onMenuClick?: () => void;
  // Props for dashboard filter
  viewMode?: "all" | "broker" | "csv" | "wallet";
  onViewModeChange?: (mode: "all" | "broker" | "csv" | "wallet") => void;
  selectedBrokerFilter?: string | null;
  onSelectedBrokerFilterChange?: (broker: string | null) => void;
  selectedCsvIds?: string[];
  onSelectedCsvIdsChange?: (csvIds: string[]) => void;
  csvImports?: any[];
  onCsvToggle?: (csvId: string) => void;
  onSelectAllCsvs?: () => void;
  showDashboardFilter?: boolean;
  // Custom wallets for filter
  wallets?: WalletType[];
  // Privacy toggle
  hideData?: boolean;
  onHideDataChange?: (hide: boolean) => void;
}

export function TopBar({
  title,
  onMenuClick,
  viewMode = "all",
  onViewModeChange,
  selectedBrokerFilter,
  onSelectedBrokerFilterChange,
  selectedCsvIds = [],
  onSelectedCsvIdsChange,
  csvImports = [],
  onCsvToggle,
  onSelectAllCsvs,
  showDashboardFilter = false,
  wallets = [],
  hideData = false,
  onHideDataChange
}: TopBarProps) {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  
  return (
    <header className={`fixed top-0 right-0 z-40 bg-[#0a0a0f]/95 backdrop-blur border-b border-[#1e1e2e] px-2 sm:px-4 lg:px-6 py-2 sm:py-3 ${isMobile ? 'left-0' : 'left-16'}`}>
      <div className="flex items-center justify-between gap-2">
        {/* Left Section - Menu button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Mobile menu button */}
          {isMobile && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-zinc-400 hover:text-white p-1.5"
              onClick={onMenuClick}
              data-testid="mobile-menu-button"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          
          {/* Dashboard Filter - only show on desktop */}
          {showDashboardFilter && (
            <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
              <Select
                value={viewMode}
                onValueChange={(value: "all" | "broker" | "csv" | "wallet") => {
                  onViewModeChange?.(value);
                  if (value !== "broker" && value !== "wallet") onSelectedBrokerFilterChange?.(null);
                  if (value !== "csv") onSelectedCsvIdsChange?.([]);
                }}
              >
                <SelectTrigger className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)] h-8 text-sm w-44 lg:w-48">
                  <SelectValue placeholder="Filtrar visualização" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--card)] border-[var(--brd)]">
                  <SelectItem value="all" className="text-[var(--text)] hover:bg-[var(--surf)]">
                    {t ? t('filter.consolidate_all_data') : 'Consolidar Todos os Dados'}
                  </SelectItem>
                  <SelectItem value="broker" className="text-[var(--text)] hover:bg-[var(--surf)]">
                    {t ? t('filter.filter_by_market') : 'Filtrar por Mercado'}
                  </SelectItem>
                  <SelectItem value="wallet" className="text-[var(--text)] hover:bg-[var(--surf)]">
                    <span className="flex items-center gap-1.5">
                      <Wallet className="h-3.5 w-3.5" />
                      Filtrar por Carteira
                    </span>
                  </SelectItem>
                  <SelectItem value="csv" className="text-[var(--text)] hover:bg-[var(--surf)]">
                    {t ? t('filter.filter_by_csv') : 'Filtrar por CSV'}
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Broker/Market Filter */}
              {viewMode === "broker" && (
                <Select
                  value={selectedBrokerFilter || ""}
                  onValueChange={onSelectedBrokerFilterChange}
                >
                  <SelectTrigger className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)] h-8 text-sm w-36 lg:w-40">
                    <SelectValue placeholder="Selecionar mercado" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--card)] border-[var(--brd)] max-h-80">
                    <SelectItem value="b3" className="text-[var(--text)] hover:bg-[var(--surf)]">
                      B3 - Ações Brasileiras
                    </SelectItem>
                    <SelectItem value="crypto" className="text-[var(--text)] hover:bg-[var(--surf)]">
                      Crypto - Criptomoedas
                    </SelectItem>
                    <SelectItem value="forex" className="text-[var(--text)] hover:bg-[var(--surf)]">
                      Forex - Câmbio
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Wallet Filter */}
              {viewMode === "wallet" && (
                <Select
                  value={selectedBrokerFilter || ""}
                  onValueChange={onSelectedBrokerFilterChange}
                >
                  <SelectTrigger className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)] h-8 text-sm w-36 lg:w-44">
                    <SelectValue placeholder="Selecionar carteira" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--card)] border-[var(--brd)] max-h-80">
                    {wallets.length === 0 ? (
                      <div className="px-3 py-4 text-center text-xs text-[var(--dim)]">
                        Nenhuma carteira criada ainda
                      </div>
                    ) : (
                      wallets.map((wallet) => (
                        <SelectItem
                          key={wallet.id}
                          value={`wallet:${wallet.id}`}
                          className="text-[var(--text)] hover:bg-[var(--surf)]"
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: wallet.color || '#8B5CF6' }}
                            />
                            {wallet.name}
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
              
              {/* CSV Filter */}
              {viewMode === "csv" && csvImports.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-between bg-[#13131a] border-zinc-700 text-white h-8 text-sm hover:bg-zinc-700 w-36 lg:w-40"
                    >
                      <span className="text-xs truncate">
                        {selectedCsvIds.length === 0
                          ? "Selecionar CSVs"
                          : selectedCsvIds.length === csvImports.length
                          ? "Todos os CSVs"
                          : `${selectedCsvIds.length} CSV${selectedCsvIds.length > 1 ? "s" : ""}`}
                      </span>
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 bg-[#0a0a0f] border-zinc-700">
                    <div className="p-2">
                      <div className="flex items-center justify-between p-2 border-b border-zinc-700">
                        <span className="text-sm font-medium text-white">
                          Selecionar CSVs
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onSelectAllCsvs}
                          className="text-zinc-400 hover:text-white text-xs h-6 px-2"
                        >
                          {selectedCsvIds.length === csvImports.length
                            ? "Desmarcar Todos"
                            : "Selecionar Todos"}
                        </Button>
                      </div>
                      <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800">
                        {csvImports.map((csv: any) => (
                          <div
                            key={csv.id}
                            className="flex items-center space-x-2 p-2 hover:bg-[#13131a]/50 transition-colors cursor-pointer"
                            onClick={() => onCsvToggle?.(csv.id)}
                          >
                            <Checkbox
                              checked={selectedCsvIds.includes(csv.id)}
                              onCheckedChange={() => onCsvToggle?.(csv.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="border-zinc-600 h-3 w-3"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-xs truncate">
                                {csv.displayName || csv.fileName}
                              </p>
                              <p className="text-zinc-400 text-xs">
                                {csv.tradesImported} trades
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          )}
        </div>
        
        {/* Center Section - Title (responsive) */}
        <div className="flex items-center justify-center gap-2 flex-1 min-w-0 px-2">
          <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-white truncate">
            {title}
          </h1>
          {onHideDataChange && (
            <button
              onClick={() => onHideDataChange(!hideData)}
              className="text-zinc-400 hover:text-white transition-colors p-1 rounded hover:bg-zinc-700/50"
              data-testid="toggle-hide-data"
              title={hideData ? (t ? t('dashboard.show_data') : 'Mostrar dados') : (t ? t('dashboard.hide_data') : 'Ocultar dados')}
            >
              {hideData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        
        {/* Right Section - Plan + Language + User Menu */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          <PlanStatus compact={isMobile} />
          <LanguageSelector />
          
          {/* User Menu with Logout - Always visible */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative h-8 w-8 rounded-full bg-[#13131a] hover:bg-zinc-700 p-0"
                data-testid="user-menu-button"
              >
                <span className="text-white font-medium text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-[#0a0a0f] border-zinc-700" align="end">
              <div className="flex items-center gap-2 p-2">
                <div className="w-8 h-8 bg-[#13131a] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-medium text-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.name || 'Usuário'}</p>
                  <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator className="bg-zinc-700" />
              <DropdownMenuItem 
                className="text-zinc-300 hover:text-white hover:bg-[#13131a] cursor-pointer"
                onClick={() => window.location.href = '/perfil'}
              >
                <User className="mr-2 h-4 w-4" />
                <span>{t ? t('profile.title') : 'Perfil'}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-700" />
              <DropdownMenuItem 
                className="text-red-400 hover:text-red-300 hover:bg-[#13131a] cursor-pointer"
                onClick={logout}
                data-testid="logout-button"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t ? t('nav.logout') : 'Sair'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
