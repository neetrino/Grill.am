type TidioChatApi = {
  show?: () => void;
  hide?: () => void;
  open?: () => void;
  close?: () => void;
  display?: (visible: boolean) => void;
  on?: (event: string, callback: () => void) => void;
};

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

export function setTidioChatLang(locale: string): void {
  Reflect.set(document, "tidioChatLang", locale);
}

/** Hide Tidio's own bubble so the Grill launcher stays the only icon. */
export function concealTidioLauncher(): void {
  const api = getTidioChatApi();
  api?.hide?.();
  api?.display?.(false);
}

export function hideTidioWidget(): void {
  concealTidioLauncher();
}

export function openTidioChat(): void {
  const api = getTidioChatApi();
  api?.show?.();
  api?.open?.();
}

/** After Tidio closes, hide its launcher again so only our icon remains. */
export function bindTidioLauncherConceal(): void {
  const api = getTidioChatApi();
  if (!api?.on) {
    return;
  }
  api.on("ready", concealTidioLauncher);
  api.on("close", concealTidioLauncher);
}

