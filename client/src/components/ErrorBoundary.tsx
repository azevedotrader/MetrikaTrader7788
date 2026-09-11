import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Sem isto, qualquer erro de renderização (um ícone não importado, um campo
 * inesperado vindo da API) desmonta a árvore inteira e o usuário vê uma página
 * totalmente em branco, sem nenhuma pista do que aconteceu.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Métrika] Erro não tratado na interface:", error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // storage bloqueado; recarregar mesmo assim
    }
    window.location.href = "/";
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#0a0a0f",
          color: "#e4e4e7",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ maxWidth: "520px", width: "100%" }}>
          <h1 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>
            Algo deu errado ao carregar a página
          </h1>
          <p style={{ color: "#a1a1aa", fontSize: "14px", margin: "0 0 20px" }}>
            Seus dados estão salvos. Tente recarregar; se o problema continuar,
            limpe os dados locais do navegador pelo botão abaixo.
          </p>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={this.handleReload}
              style={{
                background: "#6EE000",
                color: "#0a0a0f",
                border: "none",
                borderRadius: "8px",
                padding: "10px 18px",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Recarregar
            </button>
            <button
              onClick={this.handleReset}
              style={{
                background: "transparent",
                color: "#a1a1aa",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
                padding: "10px 18px",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Limpar dados locais e voltar ao início
            </button>
          </div>

          <details style={{ marginTop: "24px" }}>
            <summary
              style={{ cursor: "pointer", color: "#71717a", fontSize: "13px" }}
            >
              Detalhes técnicos
            </summary>
            <pre
              style={{
                marginTop: "10px",
                padding: "12px",
                background: "#13131a",
                border: "1px solid #27272a",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#a1a1aa",
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {error.message}
              {error.stack ? `\n\n${error.stack}` : ""}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}
