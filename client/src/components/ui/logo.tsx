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
        return "h-32 lg:h-32 md:h-28 sm:h-24";
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
      className="object-contain transition-all duration-300 flex-shrink-0 h-32 lg:h-32 md:h-28 sm:h-24 !h-32 lg:!h-32 md:!h-28 sm:!h-24 max-w-fit pt-[0px] pb-[0px] mt-[-33px] mb-[-33px]"
      data-testid={`img-logo-${variant}`}
    />
  );
}