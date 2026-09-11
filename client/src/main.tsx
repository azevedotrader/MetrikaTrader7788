// Deve vir antes de tudo: neutraliza localStorage bloqueado, que de outra
// forma derruba o app inteiro durante a renderização.
import "./lib/safe-storage";

import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
