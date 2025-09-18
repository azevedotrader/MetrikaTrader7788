import { cn } from "@/lib/utils";
import metrikaLogo from "@assets/bb593927-43a1-4153-a7cb-c63e789ec7c3_1757781377777.png";
import metrikaIcon from "@assets/32062fc8-2d06-4d11-9a59-b963506c493d_1758220777366.png";

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

  const getIconSize = () => {
    switch (variant) {
      case "header":
        return "h-12 w-12 lg:h-14 lg:w-14 md:h-12 md:w-12 sm:h-10 sm:w-10";
      case "modal":
        return "h-14 w-14 md:h-12 md:w-12 sm:h-10 sm:w-10";
      case "sidebar":
        return expanded ? "h-12 w-12" : "h-10 w-10";
      default:
        return "h-8 w-8";
    }
  };

  return (
    <div className="flex items-center gap-0" data-testid={`logo-container-${variant}`}>
      <img 
        src={metrikaIcon} 
        alt="Métrika Icon" 
        className={cn("object-contain transition-all duration-300 flex-shrink-0", getIconSize())}
        data-testid={`img-icon-${variant}`}
      />
      {/* Show logo text only when not collapsed (sidebar variant) or always for other variants */}
      {(variant !== "sidebar" || expanded) && (
        <img 
          src={metrikaLogo} 
          alt="METRIKA" 
          className="object-contain transition-all duration-300 flex-shrink-0 h-32 lg:h-32 md:h-28 sm:h-24 !h-32 lg:!h-32 md:!h-28 sm:!h-24 max-w-fit pt-[0px] pb-[0px] mt-[-33px] mb-[-33px] pl-[0px] pr-[0px] ml-[-12px] mr-[22px]"
          data-testid={`img-logo-${variant}`}
        />
      )}
    </div>
  );
}