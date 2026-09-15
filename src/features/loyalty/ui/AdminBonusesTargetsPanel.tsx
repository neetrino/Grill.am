"use client";

import { useState } from "react";

import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import type {
  CategoryBonusBoardRow,
  ProductBonusBoardRow,
} from "@/features/loyalty/application/product-bonus-board";
import { AdminCategoryBonusesSection } from "@/features/loyalty/ui/AdminCategoryBonusesSection";
import { AdminProductBonusesSection } from "@/features/loyalty/ui/AdminProductBonusesSection";

type BonusTargetTab = "categories" | "products";

type AdminBonusesTargetsPanelProps = {
  locale: string;
  categories: CategoryBonusBoardRow[];
  products: ProductBonusBoardRow[];
};

/** Category / product switch for flat bonus rules (screenshot-style tabs). */
export function AdminBonusesTargetsPanel({
  locale,
  categories,
  products,
}: AdminBonusesTargetsPanelProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.bonuses;
  const [tab, setTab] = useState<BonusTargetTab>("products");

  const tabs: Array<{ id: BonusTargetTab; label: string }> = [
    { id: "categories", label: copy.tabCategories },
    { id: "products", label: copy.tabProducts },
  ];

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label={copy.tabsAria}
        className="inline-flex flex-wrap gap-1.5 rounded-[18px] border border-gray-200 bg-white p-1.5 shadow-sm"
      >
        {tabs.map((item) => {
          const selected = item.id === tab;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(item.id)}
              className={`min-w-[9.5rem] rounded-[14px] px-6 py-3 text-base font-semibold transition-colors sm:min-w-[11rem] sm:px-8 sm:py-3.5 sm:text-lg ${
                selected
                  ? "bg-brand-red text-white"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "categories" ? (
        <AdminCategoryBonusesSection
          locale={locale}
          categories={categories}
        />
      ) : (
        <AdminProductBonusesSection locale={locale} products={products} />
      )}
    </div>
  );
}
