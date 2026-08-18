import { notFound } from "next/navigation";

import { AdminShell } from "@/features/admin/ui/AdminShell";
import { requireAdminPanel } from "@/lib/auth/policies";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type AdminLayoutProps = {
  children: React.ReactNode;
  params: Promise<unknown>;
};

/** Session-gated; child pages query the DB and must not prerender at build. */
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
  const { locale } = (await params) as { locale: string };
  if (!isLocale(locale)) notFound();
  const user = await requireAdminPanel(locale);

  const dictionary = getDictionary(locale);

  return (
    <AdminShell
      locale={locale}
      dictionary={dictionary.admin}
      role={user.role}
    >
      {children}
    </AdminShell>
  );
}
