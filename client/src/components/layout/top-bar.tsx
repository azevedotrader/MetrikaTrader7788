import { Button } from "@/components/ui/button";
import { Bell, Settings, Menu, ChevronDown } from "lucide-react";
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

interface TopBarProps {
  title: string;
  onMenuClick?: () => void;
  // Props for dashboard filter
  viewMode?: "all" | "broker" | "csv";
  onViewModeChange?: (mode: "all" | "broker" | "csv") => void;
  selectedBrokerFilter?: string | null;
  onSelectedBrokerFilterChange?: (broker: string | null) => void;
  selectedCsvIds?: string[];
  onSelectedCsvIdsChange?: (csvIds: string[]) => void;
  csvImports?: any[];
  onCsvToggle?: (csvId: string) => void;
  onSelectAllCsvs?: () => void;
  showDashboardFilter?: boolean;
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
  showDashboardFilter = false
}: TopBarProps) {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  
  return (
    <header className={`fixed top-0 right-0 z-40 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-4 lg:px-6 py-3 ${isMobile ? 'left-0' : 'left-16'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          {isMobile && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-zinc-400 hover:text-white lg:hidden"
              onClick={onMenuClick}
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <h1 className="text-xl lg:text-2xl font-bold text-white truncate">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Dashboard Filter - only show on dashboard */}
          {showDashboardFilter && (
            <div className="hidden md:flex items-center space-x-2">
              <Select
                value={viewMode}
                onValueChange={(value: "all" | "broker" | "csv") => {
                  onViewModeChange?.(value);
                  if (value !== "broker") onSelectedBrokerFilterChange?.(null);
                  if (value !== "csv") onSelectedCsvIdsChange?.([]);
                }}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm w-40">
                  <SelectValue placeholder="Filtrar visualização" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all" className="text-white hover:bg-zinc-700">
                    {t ? t('filter.consolidate_all_data') : 'Consolidar Todos os Dados'}
                  </SelectItem>
                  <SelectItem value="broker" className="text-white hover:bg-zinc-700">
                    {t ? t('filter.filter_by_market') : 'Filtrar por Mercado'}
                  </SelectItem>
                  <SelectItem value="csv" className="text-white hover:bg-zinc-700">
                    {t ? t('filter.filter_by_csv') : 'Filtrar por CSV'}
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {/* Broker Filter */}
              {viewMode === "broker" && (
                <Select
                  value={selectedBrokerFilter || ""}
                  onValueChange={onSelectedBrokerFilterChange}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm w-40">
                    <SelectValue placeholder="Selecionar mercado" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="b3" className="text-white hover:bg-zinc-700">
                      B3 - Ações Brasileiras
                    </SelectItem>
                    <SelectItem value="crypto" className="text-white hover:bg-zinc-700">
                      Crypto - Criptomoedas
                    </SelectItem>
                    <SelectItem value="forex" className="text-white hover:bg-zinc-700">
                      Forex - Câmbio
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              {/* CSV Filter */}
              {viewMode === "csv" && csvImports.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-between bg-zinc-800 border-zinc-700 text-white h-8 text-sm hover:bg-zinc-700 w-40"
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
                  <PopoverContent className="w-80 p-0 bg-zinc-900 border-zinc-700">
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
                            className="flex items-center space-x-2 p-2 hover:bg-zinc-800/50 transition-colors cursor-pointer"
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
          
          <PlanStatus />
          <LanguageSelector />
        </div>
      </div>
    </header>
  );
}
