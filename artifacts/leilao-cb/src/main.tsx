import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

function mount() {
  if ((window as any).__DESKTOP_BLOCKED__) return;
  const root = document.getElementById("root");
  if (root) createRoot(root).render(<App />);
}

const ready = (window as any).__ACCESS_READY__;
if (ready && typeof ready.then === "function") {
  ready.then(mount);
} else {
  mount();
}
