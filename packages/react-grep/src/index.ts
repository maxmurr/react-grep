import { Inspector } from "./inspector";

let inspector: Inspector | null = null;

export const init = () => {
  if (inspector) return;
  inspector = new Inspector();
  inspector.start();
};

export const destroy = () => {
  if (!inspector) return;
  inspector.stop();
  inspector = null;
};

if (typeof window !== "undefined") {
  const bootstrap = () => init();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
}
