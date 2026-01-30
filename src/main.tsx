import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Initialize i18n
import "./lib/i18n";

// Initialize Sentry for error monitoring
import { initSentry } from "./lib/sentry";
initSentry();

createRoot(document.getElementById("root")!).render(<App />);
