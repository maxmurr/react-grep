import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { init } from "react-grep";

init();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
