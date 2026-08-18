import { describe, expect, it } from "vitest";

import { getDictionary } from "@/lib/i18n/get-dictionary";

describe("getDictionary", () => {
  it("merges namespace files into the storefront dictionary shape", () => {
    const dictionary = getDictionary("en");

    expect(dictionary.brand).toBe("Grill.am");
    expect(dictionary.nav.home).toBe("Home");
    expect(dictionary.home.title).toBe("Grill.am");
    expect(dictionary.contact.title).toBe("Contact us");
    expect(dictionary.cartDrawer.title).toBe("Shopping Cart");
    expect(dictionary.checkout.title).toBe("Checkout");
    expect(dictionary.stores.titleLead).toBe("Our");
    expect(dictionary.nav.shop).toBe("Branches");
    expect(dictionary.chat.open).toBe("Open chat");
    expect(dictionary.chat.greeting).toBe("How can we help you?");
    expect(dictionary.chat.withUs).toBe("Chat with us");
    expect(dictionary.chat.hiThere).toBe("Hi there 👋");
  });

  it("loads Armenian and Russian namespaces", () => {
    expect(getDictionary("hy").nav.home).toBe("Գլխավոր");
    expect(getDictionary("hy").nav.shop).toBe("Մասնաճյուղեր");
    expect(getDictionary("hy").stores.titleLead).toBe("Մեր");
    expect(getDictionary("hy").admin.menu.products).toBe("Ապրանքներ");
    expect(getDictionary("ru").nav.home).toBe("Главная");
    expect(getDictionary("ru").nav.shop).toBe("Филиалы");
    expect(getDictionary("ru").admin.menu.products).toBe("Товары");
  });
});
