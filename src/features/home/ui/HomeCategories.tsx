import Image from "next/image";

import { AppLink } from "@/components/ui/AppLink";

type CategoryItem = {
  id: string;
  href: string;
  title: string;
  imageUrl: string | null;
};

type HomeCategoriesProps = {
  title: string;
  emptyLabel: string;
  categories: readonly CategoryItem[];
};

export function HomeCategories({
  title,
  emptyLabel,
  categories,
}: HomeCategoriesProps) {
  return (
    <section className="bg-white py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-3xl font-bold text-gray-900 md:text-4xl">
          {title}
        </h2>

        {categories.length === 0 ? (
          <p className="text-gray-600">{emptyLabel}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {categories.map((category) => (
              <li key={category.id}>
                <AppLink
                  href={category.href}
                  prefetchPolicy="intent"
                  className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 transition hover:border-gray-300 hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    {category.imageUrl ? (
                      <Image
                        src={category.imageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <span className="px-4 py-3 text-center text-sm font-semibold text-gray-900 sm:text-base">
                    {category.title}
                  </span>
                </AppLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
