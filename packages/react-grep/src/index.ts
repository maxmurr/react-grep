import { Inspector } from "./inspector";

let inspector: Inspector | null = null;

export const init = (): void => {
  if (inspector) return;
  inspector = new Inspector();
  inspector.start();
};

export const destroy = (): void => {
  if (!inspector) return;
  inspector.stop();
  inspector = null;
};

/* v8 ignore start */
if (typeof window !== "undefined") {
  /* v8 ignore stop */
  const bootstrap = () => init();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
}
