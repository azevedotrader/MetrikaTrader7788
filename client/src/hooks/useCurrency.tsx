import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CURRENCY_OPTIONS,
  useCurrencyPreference,
  type CurrencyCode,
} from "@/contexts/CurrencyContext";

interface ExchangeRate {
  rate: number;
  base: string;
  target: string;
  timestamp: string;
}

interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  locale: string;
}

// Moeda usada quando o usuário não escolheu nenhuma explicitamente.
const currencyByLanguage: Record<string, CurrencyConfig> = {
  pt: { code: "BRL", symbol: "R$", locale: "pt-BR" },
  en: { code: "USD", symbol: "$", locale: "en-US" },
  es: { code: "USD", symbol: "$", locale: "es-ES" },
};

// Cotações relativas ao dólar, usadas só como fallback quando a API de câmbio
// não responde. A API devolve BRL por USD.
const EUR_PER_USD = 0.92;

export function useCurrency() {
  const { language } = useLanguage();
  const { currency: preferred } = useCurrencyPreference();

  const { data: exchangeRate, isLoading: isLoadingRate } = useQuery<ExchangeRate>({
    queryKey: ["/api/exchange-rate"],
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    refetchInterval: 10 * 60 * 1000, // Atualiza a cada 10 minutos
  });

  const fromLanguage = currencyByLanguage[language] || currencyByLanguage.pt;
  const option = preferred
    ? CURRENCY_OPTIONS.find((o) => o.code === preferred)
    : undefined;
  const currencyConfig: CurrencyConfig = option
    ? { code: option.code, symbol: option.symbol, locale: option.locale }
    : fromLanguage;

  const brlPerUsd = exchangeRate?.rate || 5.8; // Fallback

  // Valores são armazenados em BRL; converte para a moeda de exibição.
  const convertFromBRL = (valueInBRL: number): number => {
    switch (currencyConfig.code) {
      case "BRL":
        return valueInBRL;
      case "USD":
        return valueInBRL / brlPerUsd;
      case "EUR":
        return (valueInBRL / brlPerUsd) * EUR_PER_USD;
      default:
        return valueInBRL;
    }
  };

  const formatCurrency = (valueInBRL: number): string =>
    new Intl.NumberFormat(currencyConfig.locale, {
      style: "currency",
      currency: currencyConfig.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4, // não arredonda 0,125 para 0,13
    }).format(convertFromBRL(valueInBRL));

  const formatCurrencyCompact = (valueInBRL: number): string => {
    const value = convertFromBRL(valueInBRL);
    const symbol = currencyConfig.symbol;
    const sep = currencyConfig.code === "BRL" ? " " : "";
    const fmt = (n: number) =>
      new Intl.NumberFormat(currencyConfig.locale, { maximumFractionDigits: 4 }).format(n);
    if (Math.abs(value) >= 1000) {
      return `${symbol}${sep}${fmt(value / 1000)}k`;
    }
    return `${symbol}${sep}${fmt(value)}`;
  };

  const getCurrencySymbol = (): string => currencyConfig.symbol;

  return {
    formatCurrency,
    formatCurrencyCompact,
    getCurrencySymbol,
    convertFromBRL,
    currencyCode: currencyConfig.code,
    currencySymbol: currencyConfig.symbol,
    exchangeRate: brlPerUsd,
    isLoadingRate,
    language,
  };
}
