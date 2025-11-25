import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";

interface ExchangeRate {
  rate: number;
  base: string;
  target: string;
  timestamp: string;
}

interface CurrencyConfig {
  code: string;
  symbol: string;
  locale: string;
}

const currencyByLanguage: Record<string, CurrencyConfig> = {
  pt: { code: 'BRL', symbol: 'R$', locale: 'pt-BR' },
  en: { code: 'USD', symbol: '$', locale: 'en-US' },
  es: { code: 'USD', symbol: '$', locale: 'es-ES' },
};

export function useCurrency() {
  const { language } = useLanguage();
  
  const { data: exchangeRate, isLoading: isLoadingRate } = useQuery<ExchangeRate>({
    queryKey: ['/api/exchange-rate'],
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    refetchInterval: 10 * 60 * 1000, // Atualiza a cada 10 minutos
  });

  const currencyConfig = currencyByLanguage[language] || currencyByLanguage.pt;
  const rate = exchangeRate?.rate || 5.80; // Fallback rate

  const formatCurrency = (valueInBRL: number): string => {
    if (currencyConfig.code === 'BRL') {
      return new Intl.NumberFormat(currencyConfig.locale, {
        style: 'currency',
        currency: currencyConfig.code,
        minimumFractionDigits: 2,
      }).format(valueInBRL);
    }
    
    // Converter de BRL para USD
    const valueInUSD = valueInBRL / rate;
    return new Intl.NumberFormat(currencyConfig.locale, {
      style: 'currency',
      currency: currencyConfig.code,
      minimumFractionDigits: 2,
    }).format(valueInUSD);
  };

  const formatCurrencyCompact = (valueInBRL: number): string => {
    if (currencyConfig.code === 'BRL') {
      if (Math.abs(valueInBRL) >= 1000) {
        return `R$ ${(valueInBRL / 1000).toFixed(1)}k`;
      }
      return `R$ ${valueInBRL.toFixed(0)}`;
    }
    
    const valueInUSD = valueInBRL / rate;
    if (Math.abs(valueInUSD) >= 1000) {
      return `$${(valueInUSD / 1000).toFixed(1)}k`;
    }
    return `$${valueInUSD.toFixed(0)}`;
  };

  const getCurrencySymbol = (): string => {
    return currencyConfig.symbol;
  };

  const convertFromBRL = (valueInBRL: number): number => {
    if (currencyConfig.code === 'BRL') {
      return valueInBRL;
    }
    return valueInBRL / rate;
  };

  return {
    formatCurrency,
    formatCurrencyCompact,
    getCurrencySymbol,
    convertFromBRL,
    currencyCode: currencyConfig.code,
    currencySymbol: currencyConfig.symbol,
    exchangeRate: rate,
    isLoadingRate,
    language,
  };
}
