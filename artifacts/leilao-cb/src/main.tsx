import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if (!(window as any).__DESKTOP_BLOCKED__) {
  createRoot(document.getElementById("root")!).render(<App />);
}
