import { cn } from "@/lib/utils";
import metrikaLogo from "@assets/ChatGPT Image 12 de set. de 2025, 10_39_06_1757684975641.png";

interface LogoProps {
  variant: "header" | "modal" | "sidebar";
  expanded?: boolean;
  className?: string;
}

export function Logo({ variant, expanded = false, className }: LogoProps) {
  const getSize = () => {
    switch (variant) {
      case "header":
        return "h-24 lg:h-24 md:h-20 sm:h-16";
      case "modal":
        return "h-28 md:h-24 sm:h-20";
      case "sidebar":
        return expanded ? "h-24" : "h-16";
      default:
        return "h-16";
    }
  };

  return (
    <img 
      src={metrikaLogo} 
      alt="Métrika" 
      className={cn(
        "object-contain transition-all duration-300 flex-shrink-0",
        getSize(),
        className
      )}
      data-testid={`img-logo-${variant}`}
    />
  );
}