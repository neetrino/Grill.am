import { AppLink } from "@/components/ui/AppLink";

type MobileNavAuthButtonProps = {
  href: string;
  label: string;
};

const buttonClassName =
  "flex h-full w-full items-center justify-center rounded-full bg-brand-red px-4 text-sm font-semibold whitespace-nowrap text-white transition hover:bg-brand-red-hot focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red";

/** Account CTA matching the language switcher pill size in the burger footer. */
export function MobileNavAuthButton({ href, label }: MobileNavAuthButtonProps) {
  return (
    <AppLink href={href} prefetchPolicy="intent" className={buttonClassName}>
      {label}
    </AppLink>
  );
}

export function MobileNavAuthButtonFallback() {
  return (
    <div
      className="h-full w-full animate-pulse rounded-full bg-brand-surface"
      aria-hidden
    />
  );
}
