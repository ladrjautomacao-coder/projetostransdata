import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Offline app-shell caching was removed because it could restore an obsolete UI.
// Existing installations receive /sw.js as a one-release cleanup worker.

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Elemento raiz da aplicação não encontrado.");
}

createRoot(rootElement).render(<App />);
