import { cn } from "@/lib/utils";
import metrikaLogo from "@assets/ChatGPT Image 12 de set. de 2025, 11_01_20_1757685845156.png";

interface LogoProps {
  variant: "header" | "modal" | "sidebar";
  expanded?: boolean;
  className?: string;
}

export function Logo({ variant, expanded = false, className }: LogoProps) {
  const getSize = () => {
    switch (variant) {
      case "header":
        return "h-48 lg:h-48 md:h-44 sm:h-40";
      case "modal":
        return "h-36 md:h-32 sm:h-28";
      case "sidebar":
        return expanded ? "h-28" : "h-20";
      default:
        return "h-20";
    }
  };

  return (
    <img 
      src={metrikaLogo} 
      alt="Métrika" 
      className={cn(
        "transition-all duration-300 block w-auto max-w-none",
        getSize(),
        className
      )}
      data-testid={`img-logo-${variant}`}
    />
  );
}