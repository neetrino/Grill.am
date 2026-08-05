/**
 * Deterministic Eastern Armenian → Latin transliteration for product slugs.
 * Output is lowercase ASCII letters/digits only; callers normalize hyphens.
 */
const HY_MAP: Record<string, string> = {
  ա: "a",
  բ: "b",
  գ: "g",
  դ: "d",
  ե: "e",
  զ: "z",
  է: "e",
  ը: "e",
  թ: "t",
  ժ: "zh",
  ի: "i",
  լ: "l",
  խ: "kh",
  ծ: "ts",
  կ: "k",
  հ: "h",
  ձ: "dz",
  ղ: "gh",
  ճ: "ch",
  մ: "m",
  յ: "y",
  ն: "n",
  շ: "sh",
  ո: "o",
  չ: "ch",
  պ: "p",
  ջ: "j",
  ռ: "r",
  ս: "s",
  վ: "v",
  տ: "t",
  ր: "r",
  ց: "ts",
  ու: "u",
  փ: "p",
  ք: "k",
  և: "ev",
  օ: "o",
  ֆ: "f",
  Ա: "a",
  Բ: "b",
  Գ: "g",
  Դ: "d",
  Ե: "e",
  Զ: "z",
  Է: "e",
  Ը: "e",
  Թ: "t",
  Ժ: "zh",
  Ի: "i",
  Լ: "l",
  Խ: "kh",
  Ծ: "ts",
  Կ: "k",
  Հ: "h",
  Ձ: "dz",
  Ղ: "gh",
  Ճ: "ch",
  Մ: "m",
  Յ: "y",
  Ն: "n",
  Շ: "sh",
  Ո: "o",
  Չ: "ch",
  Պ: "p",
  Ջ: "j",
  Ռ: "r",
  Ս: "s",
  Վ: "v",
  Տ: "t",
  Ր: "r",
  Ց: "ts",
  ՈՒ: "u",
  Ու: "u",
  Փ: "p",
  Ք: "k",
  Եվ: "ev",
  ԵՎ: "ev",
  Օ: "o",
  Ֆ: "f",
};

/** Transliterates Armenian text to lowercase Latin letters/digits/spaces. */
export function transliterateArmenianToLatin(input: string): string {
  let result = "";
  let index = 0;

  while (index < input.length) {
    const two = input.slice(index, index + 2);
    if (two === "ու" || two === "Ու" || two === "ՈՒ" || two === "և" || two === "Եվ" || two === "ԵՎ") {
      result += HY_MAP[two] ?? "";
      index += 2;
      continue;
    }

    const ch = input[index] ?? "";
    if (HY_MAP[ch]) {
      result += HY_MAP[ch];
    } else if (/[a-zA-Z0-9]/.test(ch)) {
      result += ch.toLowerCase();
    } else if (/\s|[_\-./\\]/.test(ch)) {
      result += " ";
    } else {
      result += " ";
    }
    index += 1;
  }

  return result.replace(/\s+/g, " ").trim();
}
