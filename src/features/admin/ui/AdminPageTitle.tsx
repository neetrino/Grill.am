import { ADMIN_PAGE_TITLE } from "@/features/admin/ui/admin-form-classes";

type AdminPageTitleProps = {
  /** Full title; split into red / yellow halves when lead/accent are omitted. */
  children?: string;
  lead?: string;
  accent?: string;
  className?: string;
};

/** Split a page title into lead (red) and accent (yellow) word groups. */
export function splitAdminTitle(title: string): {
  lead: string;
  accent: string;
} {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return { lead: "", accent: "" };
  }
  if (words.length === 1) {
    return { lead: words[0] ?? "", accent: "" };
  }
  const mid = Math.ceil(words.length / 2);
  return {
    lead: words.slice(0, mid).join(" "),
    accent: words.slice(mid).join(" "),
  };
}

/** Dashboard-style admin H1: uppercase, red lead + yellow accent. */
export function AdminPageTitle({
  children,
  lead,
  accent,
  className = "",
}: AdminPageTitleProps) {
  const parts =
    lead !== undefined || accent !== undefined
      ? { lead: lead ?? "", accent: accent ?? "" }
      : splitAdminTitle(children ?? "");

  return (
    <h1 className={`${ADMIN_PAGE_TITLE} ${className}`.trim()}>
      {parts.lead ? (
        <span className="text-brand-red">{parts.lead}</span>
      ) : null}
      {parts.lead && parts.accent ? " " : null}
      {parts.accent ? (
        <span className="text-brand-yellow">{parts.accent}</span>
      ) : null}
    </h1>
  );
}
