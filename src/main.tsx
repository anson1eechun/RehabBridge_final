
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  // 開發：解除先前誤註冊的 SW，避免快取 Vite 模組導致白屏
  if (import.meta.env.DEV && "serviceWorker" in navigator) {
    void navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const r of regs) void r.unregister();
    });
  }
  if (import.meta.env.PROD && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service worker registration failed:", error);
      });
    });
  }

  createRoot(document.getElementById("root")!).render(<App />);
  