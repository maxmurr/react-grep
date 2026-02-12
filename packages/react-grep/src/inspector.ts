import { isMac } from "./env";
import { getComponentInfo } from "./fiber";
import { OverlayManager } from "./overlay";
import type { ComponentInfo, DebugSource } from "./types";

export class Inspector {
  private overlay = new OverlayManager();
  private moveGeneration = 0;
  private clickGeneration = 0;
  private lastTarget: Element | null = null;
  private lastInfo: ComponentInfo | null = null;
  private sourceToggled = false;
  private shiftPressedClean = false;
  private savedCursor = "";
  private boundHandlers: {
    mousemove: (e: MouseEvent) => void;
    click: (e: MouseEvent) => void;
    keydown: (e: KeyboardEvent) => void;
    keyup: (e: KeyboardEvent) => void;
  };

  constructor() {
    this.boundHandlers = {
      mousemove: this.handleMouseMove.bind(this),
      click: this.handleClick.bind(this),
      keydown: this.handleKeyDown.bind(this),
      keyup: this.handleKeyUp.bind(this),
    };
  }

  start() {
    window.addEventListener("mousemove", this.boundHandlers.mousemove);
    window.addEventListener("click", this.boundHandlers.click, true);
    window.addEventListener("keydown", this.boundHandlers.keydown);
    window.addEventListener("keyup", this.boundHandlers.keyup);
  }

  stop() {
    window.removeEventListener("mousemove", this.boundHandlers.mousemove);
    window.removeEventListener("click", this.boundHandlers.click, true);
    window.removeEventListener("keydown", this.boundHandlers.keydown);
    window.removeEventListener("keyup", this.boundHandlers.keyup);
    this.overlay.destroy();
    this.restoreCursor();
    this.lastTarget = null;
    this.lastInfo = null;
    this.sourceToggled = false;
    this.shiftPressedClean = false;
  }

  private isModifierHeld(e: MouseEvent | KeyboardEvent): boolean {
    return isMac ? e.metaKey : e.ctrlKey;
  }

  private async handleMouseMove(e: MouseEvent) {
    if (!this.isModifierHeld(e)) {
      this.overlay.hide();
      this.restoreCursor();
      this.lastTarget = null;
      this.lastInfo = null;
      return;
    }

    this.overlay.init();
    this.setCrosshairCursor();

    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || target.closest("[data-react-grep]")) return;

    if (target !== this.lastTarget) {
      this.sourceToggled = false;
    }

    const gen = ++this.moveGeneration;
    const info = await getComponentInfo(target);
    if (gen !== this.moveGeneration) return;

    if (!info) {
      this.overlay.hide();
      this.lastTarget = null;
      this.lastInfo = null;
      return;
    }

    this.lastTarget = target;
    this.lastInfo = info;
    this.overlay.show(target, info, this.getActiveSource());
  }

  private async handleClick(e: MouseEvent) {
    if (!this.isModifierHeld(e) || !e.shiftKey) return;

    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || target.closest("[data-react-grep]")) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    this.shiftPressedClean = false;
    const gen = ++this.clickGeneration;
    const info = await getComponentInfo(target);
    if (gen !== this.clickGeneration || !info) return;

    const source = this.getActiveCopySource(info);
    if (!source) return;

    const { fileName, lineNumber, columnNumber } = source;
    const location =
      columnNumber != null
        ? `${fileName}:${lineNumber}:${columnNumber}`
        : `${fileName}:${lineNumber}`;

    await this.copyToClipboard(location);
    this.overlay.showCopied(location);
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Shift" && this.isModifierHeld(e)) {
      this.shiftPressedClean = true;
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    if ((isMac && e.key === "Meta") || (!isMac && e.key === "Control")) {
      this.overlay.hide();
      this.restoreCursor();
      this.lastTarget = null;
      this.lastInfo = null;
      return;
    }
    if (
      e.key === "Shift" &&
      this.shiftPressedClean &&
      this.lastTarget &&
      this.lastInfo &&
      this.lastInfo.callSite
    ) {
      this.sourceToggled = !this.sourceToggled;
      this.overlay.show(this.lastTarget, this.lastInfo, this.getActiveSource());
    }
    this.shiftPressedClean = false;
  }

  private getActiveSource(): "source" | "callSite" {
    return this.sourceToggled ? "callSite" : "source";
  }

  private getActiveCopySource(info: ComponentInfo): DebugSource | null {
    return this.sourceToggled && info.callSite ? info.callSite : info.source;
  }

  private setCrosshairCursor() {
    if (document.body.style.cursor !== "crosshair") {
      this.savedCursor = document.body.style.cursor;
      document.body.style.cursor = "crosshair";
    }
  }

  private restoreCursor() {
    if (document.body.style.cursor === "crosshair") {
      document.body.style.cursor = this.savedCursor;
    }
  }

  private async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API unavailable or denied — fail silently
    }
  }
}
