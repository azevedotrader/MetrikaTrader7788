import { Button } from "@/components/ui/button";
import { Bell, Settings, Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface TopBarProps {
  title: string;
  onMenuClick?: () => void;
}

export function TopBar({ title, onMenuClick }: TopBarProps) {
  const isMobile = useIsMobile();
  
  return (
    <header className="bg-zinc-900/90 border-b border-zinc-800 px-4 lg:px-6 py-4">
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
          <h1 className="text-lg lg:text-2xl font-bold text-white truncate">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-2 lg:space-x-4">
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
            <Bell className="w-4 h-4 lg:w-5 lg:h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
            <Settings className="w-4 h-4 lg:w-5 lg:h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
