import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CURRENCY_OPTIONS,
  useCurrencyPreference,
  type CurrencyCode,
} from "@/contexts/CurrencyContext";
import { useCurrency } from "@/hooks/useCurrency";

/**
 * Escolha da moeda de exibição, independente do idioma da interface —
 * quem opera forex em dólar não precisa deixar o app em inglês.
 */
export function CurrencySelector() {
  const { currency, setCurrency } = useCurrencyPreference();
  const { currencySymbol } = useCurrency();

  const select = (code: CurrencyCode | null) => setCurrency(code);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-zinc-400 hover:text-white hover:bg-[#13131a]/50 px-1.5 sm:px-3 py-1.5 sm:py-2 rounded-md transition-all duration-200 font-semibold"
          title="Moeda de exibição"
          data-testid="currency-selector"
        >
          <span className="text-sm sm:text-base">{currencySymbol}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#0a0a0f] border-zinc-700">
        {CURRENCY_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.code}
            onClick={() => select(option.code)}
            className={`text-zinc-300 hover:text-white hover:bg-[#13131a] cursor-pointer ${
              currency === option.code ? "bg-[#13131a] text-white" : ""
            }`}
            data-testid={`currency-option-${option.code}`}
          >
            <span className="mr-2 w-6 inline-block">{option.symbol}</span>
            {option.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-zinc-700" />
        <DropdownMenuItem
          onClick={() => select(null)}
          className={`text-zinc-400 hover:text-white hover:bg-[#13131a] cursor-pointer text-xs ${
            currency === null ? "bg-[#13131a] text-white" : ""
          }`}
          data-testid="currency-option-auto"
        >
          Seguir o idioma
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
