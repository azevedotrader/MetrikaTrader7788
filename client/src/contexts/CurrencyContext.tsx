import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type CurrencyCode = "BRL" | "USD" | "EUR";

export interface CurrencyOption {
  code: CurrencyCode;
  symbol: string;
  locale: string;
  label: string;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "BRL", symbol: "R$", locale: "pt-BR", label: "Real (R$)" },
  { code: "USD", symbol: "$", locale: "en-US", label: "Dólar (US$)" },
  { code: "EUR", symbol: "€", locale: "de-DE", label: "Euro (€)" },
];

const STORAGE_KEY = "metrika-currency";

/**
 * Moeda de exibição escolhida pelo usuário. É independente do idioma da
 * interface: quem opera forex em dólar não precisa deixar o app em inglês.
 * `null` significa "seguir o idioma", que é o comportamento antigo.
 */
interface CurrencyContextValue {
  currency: CurrencyCode | null;
  setCurrency: (code: CurrencyCode | null) => void;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

function readStored(): CurrencyCode | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && CURRENCY_OPTIONS.some((o) => o.code === stored)) {
      return stored as CurrencyCode;
    }
  } catch {
    // localStorage indisponível (modo privado, cookies bloqueados)
  }
  return null;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode | null>(readStored);

  const setCurrency = (code: CurrencyCode | null) => {
    setCurrencyState(code);
    try {
      if (code) localStorage.setItem(STORAGE_KEY, code);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Preferência vale só para esta sessão se o storage estiver bloqueado
    }
  };

  // Mantém abas abertas em sincronia
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setCurrencyState(readStored());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrencyPreference(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  // Sem provider (ex.: páginas públicas), segue o idioma como antes.
  return ctx ?? { currency: null, setCurrency: () => {} };
}
