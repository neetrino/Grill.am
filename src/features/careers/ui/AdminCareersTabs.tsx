import Link from "next/link";

type AdminCareersTabsProps = {
  locale: string;
  active: "postings" | "applications";
  postingsLabel: string;
  applicationsLabel: string;
};

/** Careers admin segment tabs: postings vs applications inbox. */
export function AdminCareersTabs({
  locale,
  active,
  postingsLabel,
  applicationsLabel,
}: AdminCareersTabsProps) {
  const base = `/${locale}/admin/careers`;
  const tabClass = (isActive: boolean) =>
    [
      "rounded-[12px] px-3 py-2 text-sm font-medium transition",
      isActive
        ? "bg-brand-red text-white"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200",
    ].join(" ");

  return (
    <nav
      className="mb-6 flex flex-wrap gap-2"
      aria-label={postingsLabel}
    >
      <Link
        href={base}
        className={tabClass(active === "postings")}
        aria-current={active === "postings" ? "page" : undefined}
      >
        {postingsLabel}
      </Link>
      <Link
        href={`${base}/applications`}
        className={tabClass(active === "applications")}
        aria-current={active === "applications" ? "page" : undefined}
      >
        {applicationsLabel}
      </Link>
    </nav>
  );
}
