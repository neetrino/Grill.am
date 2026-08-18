import { describe, expect, it } from "vitest";

import { resolveTidioHomeCopyText } from "@/lib/tidio/home-copy";

const hyCopy = {
  hiThere: "Բարև ձեզ 👋",
  welcome: "Բարի գալուստ մեր կայք։ Հարցրեք մեզ ինչ ուզեք 🎉",
  chatWithUs: "Զրուցեք մեզ հետ",
  replyImmediately: "Պատասխանում ենք անմիջապես",
  openOptions: "Բացել ընտրանքները",
  send: "Ուղարկել",
  messagePlaceholder: "Գրեք ձեր հաղորդագրությունը...",
};

describe("resolveTidioHomeCopyText", () => {
  it("replaces Tidio's English widget phrases", () => {
    expect(resolveTidioHomeCopyText("Chat with us", hyCopy)).toBe(
      "Զրուցեք մեզ հետ",
    );
    expect(resolveTidioHomeCopyText("We reply immediately", hyCopy)).toBe(
      "Պատասխանում ենք անմիջապես",
    );
    expect(resolveTidioHomeCopyText("Hi there 👋", hyCopy)).toBe("Բարև ձեզ 👋");
    expect(
      resolveTidioHomeCopyText("Welcome to our website. Ask us anything", hyCopy),
    ).toBe("Բարի գալուստ մեր կայք։ Հարցրեք մեզ ինչ ուզեք 🎉");
  });

  it("does not rewrite already-localized text", () => {
    expect(resolveTidioHomeCopyText("Զրուցեք մեզ հետ", hyCopy)).toBeUndefined();
    expect(resolveTidioHomeCopyText("Բարև ձեզ 👋", hyCopy)).toBeUndefined();
  });

  it("leaves unrelated copy unchanged", () => {
    expect(
      resolveTidioHomeCopyText("If you need any assistance, I'm always here.", hyCopy),
    ).toBeUndefined();
  });
});
