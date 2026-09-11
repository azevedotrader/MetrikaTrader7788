/**
 * Em navegadores com storage bloqueado (Safari em navegação privada, Firefox
 * com "cookies e dados de sites" bloqueados, políticas corporativas), ler ou
 * escrever em localStorage lança exceção. Como o app acessa localStorage
 * durante a renderização — tema, idioma, token —, essa exceção derruba o React
 * inteiro e o usuário vê uma tela em branco, sem nenhuma aba funcionando.
 *
 * Este módulo troca localStorage/sessionStorage por um substituto em memória
 * quando o original não é utilizável. A sessão passa a não persistir entre
 * recarregamentos, mas o app funciona.
 *
 * Deve ser importado antes de qualquer outro módulo do app.
 */

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    setItem(key: string, value: string) {
      map.set(key, String(value));
    },
    removeItem(key: string) {
      map.delete(key);
    },
    clear() {
      map.clear();
    },
  } as Storage;
}

function isUsable(storage: Storage | null): boolean {
  if (!storage) return false;
  try {
    const probe = "__metrika_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function harden(name: "localStorage" | "sessionStorage") {
  let usable = false;
  try {
    usable = isUsable(window[name]);
  } catch {
    // O próprio acesso à propriedade pode lançar
    usable = false;
  }

  if (usable) return;

  try {
    Object.defineProperty(window, name, {
      value: createMemoryStorage(),
      configurable: true,
      writable: false,
    });
    console.warn(
      `[Métrika] ${name} indisponível neste navegador; usando armazenamento em memória. ` +
        `Suas preferências não serão lembradas ao recarregar a página.`
    );
  } catch (error) {
    console.error(`[Métrika] Não foi possível substituir ${name}:`, error);
  }
}

harden("localStorage");
harden("sessionStorage");

export {};
