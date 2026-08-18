import type { Locale } from "@/lib/i18n/config";

import enAbout from "@/locales/en/about.json";
import enAdmin from "@/locales/en/admin.json";
import enAuth from "@/locales/en/auth.json";
import enBlog from "@/locales/en/blog.json";
import enCareers from "@/locales/en/careers.json";
import enCart from "@/locales/en/cart.json";
import enCatalog from "@/locales/en/catalog.json";
import enCheckout from "@/locales/en/checkout.json";
import enCommon from "@/locales/en/common.json";
import enContact from "@/locales/en/contact.json";
import enHome from "@/locales/en/home.json";
import enLegal from "@/locales/en/legal.json";
import enProduct from "@/locales/en/product.json";
import enProfile from "@/locales/en/profile.json";
import enStores from "@/locales/en/stores.json";
import enWishlist from "@/locales/en/wishlist.json";

import hyAbout from "@/locales/hy/about.json";
import hyAdmin from "@/locales/hy/admin.json";
import hyAuth from "@/locales/hy/auth.json";
import hyBlog from "@/locales/hy/blog.json";
import hyCareers from "@/locales/hy/careers.json";
import hyCart from "@/locales/hy/cart.json";
import hyCatalog from "@/locales/hy/catalog.json";
import hyCheckout from "@/locales/hy/checkout.json";
import hyCommon from "@/locales/hy/common.json";
import hyContact from "@/locales/hy/contact.json";
import hyHome from "@/locales/hy/home.json";
import hyLegal from "@/locales/hy/legal.json";
import hyProduct from "@/locales/hy/product.json";
import hyProfile from "@/locales/hy/profile.json";
import hyStores from "@/locales/hy/stores.json";
import hyWishlist from "@/locales/hy/wishlist.json";

import ruAbout from "@/locales/ru/about.json";
import ruAdmin from "@/locales/ru/admin.json";
import ruAuth from "@/locales/ru/auth.json";
import ruBlog from "@/locales/ru/blog.json";
import ruCareers from "@/locales/ru/careers.json";
import ruCart from "@/locales/ru/cart.json";
import ruCatalog from "@/locales/ru/catalog.json";
import ruCheckout from "@/locales/ru/checkout.json";
import ruCommon from "@/locales/ru/common.json";
import ruContact from "@/locales/ru/contact.json";
import ruHome from "@/locales/ru/home.json";
import ruLegal from "@/locales/ru/legal.json";
import ruProduct from "@/locales/ru/product.json";
import ruProfile from "@/locales/ru/profile.json";
import ruStores from "@/locales/ru/stores.json";
import ruWishlist from "@/locales/ru/wishlist.json";

type LocaleNamespaces = {
  common: typeof hyCommon;
  admin: typeof hyAdmin;
  home: typeof hyHome;
  contact: typeof hyContact;
  about: typeof hyAbout;
  auth: typeof hyAuth;
  profile: typeof hyProfile;
  checkout: typeof hyCheckout;
  cart: typeof hyCart;
  product: typeof hyProduct;
  blog: typeof hyBlog;
  careers: typeof hyCareers;
  catalog: typeof hyCatalog;
  wishlist: typeof hyWishlist;
  legal: typeof hyLegal;
  stores: typeof hyStores;
};

function buildDictionary(namespaces: LocaleNamespaces) {
  return {
    brand: namespaces.common.brand,
    close: namespaces.common.close,
    buttons: namespaces.common.buttons,
    dialogs: namespaces.common.dialogs,
    nav: namespaces.common.nav,
    header: namespaces.common.header,
    footer: namespaces.common.footer,
    popup: namespaces.common.popup,
    chat: namespaces.common.chat,
    admin: namespaces.admin,
    home: namespaces.home,
    contact: namespaces.contact,
    about: namespaces.about,
    auth: namespaces.auth,
    profile: namespaces.profile,
    checkout: namespaces.checkout,
    cartDrawer: namespaces.cart,
    product: namespaces.product,
    blog: namespaces.blog,
    careers: namespaces.careers,
    catalog: namespaces.catalog,
    wishlist: namespaces.wishlist,
    legal: namespaces.legal,
    stores: namespaces.stores,
  } as const;
}

const dictionaries = {
  hy: buildDictionary({
    common: hyCommon,
    admin: hyAdmin,
    home: hyHome,
    contact: hyContact,
    about: hyAbout,
    auth: hyAuth,
    profile: hyProfile,
    checkout: hyCheckout,
    cart: hyCart,
    product: hyProduct,
    blog: hyBlog,
    careers: hyCareers,
    catalog: hyCatalog,
    wishlist: hyWishlist,
    legal: hyLegal,
    stores: hyStores,
  }),
  en: buildDictionary({
    common: enCommon,
    admin: enAdmin,
    home: enHome,
    contact: enContact,
    about: enAbout,
    auth: enAuth,
    profile: enProfile,
    checkout: enCheckout,
    cart: enCart,
    product: enProduct,
    blog: enBlog,
    careers: enCareers,
    catalog: enCatalog,
    wishlist: enWishlist,
    legal: enLegal,
    stores: enStores,
  }),
  ru: buildDictionary({
    common: ruCommon,
    admin: ruAdmin,
    home: ruHome,
    contact: ruContact,
    about: ruAbout,
    auth: ruAuth,
    profile: ruProfile,
    checkout: ruCheckout,
    cart: ruCart,
    product: ruProduct,
    blog: ruBlog,
    careers: ruCareers,
    catalog: ruCatalog,
    wishlist: ruWishlist,
    legal: ruLegal,
    stores: ruStores,
  }),
} as const;

export type Dictionary = (typeof dictionaries)[Locale];
export type AdminDictionary = Dictionary["admin"];
export type ProfileDictionary = Dictionary["profile"];

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
