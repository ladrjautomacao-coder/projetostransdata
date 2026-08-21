import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Keep this cleanup in the application bootstrap while legacy PWA installations
// still exist. A previously cached app shell can otherwise restore an obsolete UI.
const LEGACY_WORKER_RELOAD_KEY = "transdata:legacy-worker-reloaded";

async function removeLegacyOfflineState() {
  if (!("serviceWorker" in navigator)) return;

  const wasControlled = Boolean(navigator.serviceWorker.controller);
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(registrations.map((registration) => registration.unregister()));

  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.allSettled(cacheNames.map((name) => caches.delete(name)));
  }

  if (wasControlled && sessionStorage.getItem(LEGACY_WORKER_RELOAD_KEY) !== "true") {
    sessionStorage.setItem(LEGACY_WORKER_RELOAD_KEY, "true");
    window.location.reload();
    return;
  }

  if (!wasControlled) {
    sessionStorage.removeItem(LEGACY_WORKER_RELOAD_KEY);
  }
}

void removeLegacyOfflineState().catch(() => {
  // Cache cleanup must never prevent the application from starting.
});

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Elemento raiz da aplicação não encontrado.");
}

createRoot(rootElement).render(<App />);
