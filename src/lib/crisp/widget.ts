export const CRISP_CHAT_SCRIPT_URL = "https://client.crisp.chat/l.js";

type CrispCommand = readonly [string, ...unknown[]];

type CrispQueue = {
  push: (...items: CrispCommand[]) => number;
};

function getCrispQueue(): CrispQueue | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  const value: unknown = Reflect.get(window, "$crisp");
  if (typeof value !== "object" || value === null) {
    return undefined;
  }
  if (typeof Reflect.get(value, "push") !== "function") {
    return undefined;
  }
  return value as CrispQueue;
}

function pushCrisp(command: CrispCommand): void {
  getCrispQueue()?.push(command);
}

/** Must run before the Crisp script so queued `do` commands survive load. */
export function bootCrisp(websiteId: string, locale: string): void {
  if (typeof window === "undefined") {
    return;
  }
  if (!getCrispQueue()) {
    Reflect.set(window, "$crisp", []);
  }
  Reflect.set(window, "CRISP_WEBSITE_ID", websiteId);
  Reflect.set(window, "CRISP_RUNTIME_CONFIG", { locale });
}

export function concealCrispLauncher(): void {
  pushCrisp(["do", "chat:hide"]);
}

export function openCrispChat(): void {
  pushCrisp(["do", "chat:show"]);
  pushCrisp(["do", "chat:open"]);
}

export function bindCrispLauncherConceal(): void {
  pushCrisp(["on", "session:loaded", concealCrispLauncher]);
  pushCrisp(["on", "chat:closed", concealCrispLauncher]);
}
