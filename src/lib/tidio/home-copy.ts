export type TidioHomeCopy = {
  hiThere: string;
  welcome: string;
  chatWithUs: string;
  replyImmediately: string;
  openOptions: string;
  send: string;
  messagePlaceholder: string;
};

type PhraseGroup = {
  key: keyof TidioHomeCopy;
  sources: readonly string[];
};

const PHRASE_GROUPS: readonly PhraseGroup[] = [
  {
    key: "hiThere",
    sources: ["Hi there", "Hi there 👋", "Բարև ձեզ", "Բարև ձեզ 👋", "Привет", "Привет 👋"],
  },
  {
    key: "welcome",
    sources: [
      "Welcome to our website. Ask us anything",
      "Welcome to our website. Ask us anything 🎉",
      "Բարի գալուստ մեր կայք։ Հարցրեք մեզ ինչ ուզեք",
      "Բարի գալուստ մեր կայք։ Հարցրեք մեզ ինչ ուզեք 🎉",
      "Добро пожаловать на наш сайт. Спросите нас о чём угодно",
      "Добро пожаловать на наш сайт. Спросите нас о чём угодно 🎉",
    ],
  },
  {
    key: "chatWithUs",
    sources: ["Chat with us", "Զրուցեք մեզ հետ", "Напишите нам"],
  },
  {
    key: "replyImmediately",
    sources: [
      "We reply immediately",
      "Պատասխանում ենք անմիջապես",
      "Отвечаем сразу",
    ],
  },
  {
    key: "openOptions",
    sources: ["Open options", "Բացել ընտրանքները", "Открыть настройки"],
  },
  {
    key: "send",
    sources: ["Send", "Ուղարկել", "Отправить"],
  },
  {
    key: "messagePlaceholder",
    sources: [
      "Enter your message...",
      "Enter your message",
      "Գրեք ձեր հաղորդագրությունը...",
      "Введите сообщение...",
    ],
  },
];

const COPY_ATTRIBUTES = ["aria-label", "placeholder", "title"] as const;

let currentCopy: TidioHomeCopy | undefined;
let homeCopyObserver: MutationObserver | undefined;

function getTidioShadowRoot(): ShadowRoot | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }
  return document.getElementById("tidio-chat")?.shadowRoot ?? undefined;
}

function normalizePhrase(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Maps Tidio built-in widget phrases to the active storefront locale.
 * Appearance → Content saves do not apply when the widget language is `hy`.
 */
export function resolveTidioHomeCopyText(
  text: string,
  copy: TidioHomeCopy,
): string | undefined {
  const normalized = normalizePhrase(text);
  if (!normalized) {
    return undefined;
  }

  for (const group of PHRASE_GROUPS) {
    const matches = group.sources.some(
      (source) => normalizePhrase(source) === normalized,
    );
    const target = copy[group.key];
    if (matches && text.trim() !== target) {
      return target;
    }
  }

  return undefined;
}

function replaceTidioHomeCopy(root: Node, copy: TidioHomeCopy): void {
  const iterator = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
  );
  let node = iterator.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const next = resolveTidioHomeCopyText(node.textContent ?? "", copy);
      if (next !== undefined) {
        node.textContent = next;
      }
    } else if (node instanceof Element) {
      for (const attribute of COPY_ATTRIBUTES) {
        const value = node.getAttribute(attribute);
        if (!value) {
          continue;
        }
        const next = resolveTidioHomeCopyText(value, copy);
        if (next !== undefined) {
          node.setAttribute(attribute, next);
        }
      }
    }
    node = iterator.nextNode();
  }
}

/** Replace Tidio chrome copy inside the widget shadow root. */
export function applyTidioHomeCopy(copy: TidioHomeCopy): void {
  currentCopy = copy;
  const shadow = getTidioShadowRoot();
  if (!shadow) {
    return;
  }

  replaceTidioHomeCopy(shadow, copy);

  if (!homeCopyObserver) {
    homeCopyObserver = new MutationObserver(() => {
      const root = getTidioShadowRoot();
      if (root && currentCopy) {
        replaceTidioHomeCopy(root, currentCopy);
      }
    });
  }

  homeCopyObserver.disconnect();
  homeCopyObserver.observe(shadow, { childList: true, subtree: true });
}
