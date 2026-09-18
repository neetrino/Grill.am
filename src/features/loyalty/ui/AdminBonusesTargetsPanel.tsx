"use client";

import { useState } from "react";

import { SegmentedControl } from "@/components/layout/SegmentedControl";
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

/** Category / product switcher for flat bonus rules. */
export function AdminBonusesTargetsPanel({
  locale,
  categories,
  products,
}: AdminBonusesTargetsPanelProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.bonuses;
  const [tab, setTab] = useState<BonusTargetTab>("products");

  return (
    <div className="space-y-4">
      <div className="w-full max-w-md">
        <SegmentedControl
          aria-label={copy.tabsAria}
          value={tab}
          options={[
            { value: "categories", label: copy.tabCategories },
            { value: "products", label: copy.tabProducts },
          ]}
          size="lg"
          tone="filled"
          onSelect={setTab}
        />
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
