type TidioChatApi = {
  show?: () => void;
  hide?: () => void;
  open?: () => void;
  close?: () => void;
  display?: (visible: boolean) => void;
  on?: (event: string, callback: () => void) => void;
};

const TIDIO_NATIVE_LAUNCHER_STYLE_ID = "grill-hide-tidio-launcher";

const TIDIO_NATIVE_LAUNCHER_CSS = `
#button,
#button-body {
  display: none !important;
  visibility: hidden !important;
  pointer-events: none !important;
}
`;

function getTidioChatApi(): TidioChatApi | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  const value: unknown = Reflect.get(window, "tidioChatApi");
  if (typeof value !== "object" || value === null) {
    return undefined;
  }
  return value;
}

function getTidioShadowRoot(): ShadowRoot | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }
  return document.getElementById("tidio-chat")?.shadowRoot ?? undefined;
}

/**
 * Tidio's default bubble lives in an open shadow root, so page CSS cannot
 * hide it. Inject a style tag so Grill's launcher stays the only icon.
 */
function hideTidioNativeLauncher(): void {
  const shadow = getTidioShadowRoot();
  if (!shadow || shadow.getElementById(TIDIO_NATIVE_LAUNCHER_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = TIDIO_NATIVE_LAUNCHER_STYLE_ID;
  style.textContent = TIDIO_NATIVE_LAUNCHER_CSS;
  shadow.appendChild(style);
}

export function setTidioChatLang(locale: string): void {
  Reflect.set(document, "tidioChatLang", locale);
}

/** Hide Tidio's own bubble so the Grill launcher stays the only icon. */
export function concealTidioLauncher(): void {
  const api = getTidioChatApi();
  api?.hide?.();
  api?.display?.(false);
  hideTidioNativeLauncher();
}

export function hideTidioWidget(): void {
  concealTidioLauncher();
}

export function openTidioChat(): void {
  const api = getTidioChatApi();
  api?.show?.();
  api?.open?.();
  hideTidioNativeLauncher();
}

/** After Tidio closes, hide its launcher again so only our icon remains. */
export function bindTidioLauncherConceal(onClose?: () => void): void {
  const api = getTidioChatApi();
  if (!api?.on) {
    return;
  }
  api.on("ready", concealTidioLauncher);
  api.on("open", hideTidioNativeLauncher);
  api.on("close", () => {
    concealTidioLauncher();
    onClose?.();
  });
}
