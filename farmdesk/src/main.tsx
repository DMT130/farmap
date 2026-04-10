import "@/styles/index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Show root once mounted
requestAnimationFrame(() => {
  document.getElementById("root")?.classList.add("ready");
});
