"use client";

import Link from "next/link";
import { Info } from "lucide-react";

import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";

type DiscountInfoCardProps = {
  locale: string;
};

export function DiscountInfoCard({ locale }: DiscountInfoCardProps) {
  const copy = useAdminDictionary().discounts.info;

  return (
    <article className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
          <Info className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-semibold text-gray-900">{copy.title}</h2>
          <p className="text-sm text-gray-500">{copy.subtitle}</p>
        </div>
      </div>

      <ul className="flex-1 list-disc space-y-2 pl-5 text-sm text-gray-700">
        <li>{copy.point1}</li>
        <li>{copy.point2}</li>
        <li>{copy.point3}</li>
        <li>{copy.point4}</li>
      </ul>

      <div className="mt-4 flex justify-end">
        <Link
          href={`/${locale}/admin/settings`}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
        >
          {copy.moreSettings}
        </Link>
      </div>
    </article>
  );
}
