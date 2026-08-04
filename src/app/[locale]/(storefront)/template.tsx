import { StorefrontPageEnter } from "@/components/ui/StorefrontPageEnter";

type StorefrontTemplateProps = {
  children: React.ReactNode;
};

/**
 * Remounts on navigation so page content replays a smooth enter animation.
 * Layout chrome (header/footer) stays mounted in `layout.tsx`.
 */
export default function StorefrontTemplate({
  children,
}: StorefrontTemplateProps) {
  return <StorefrontPageEnter>{children}</StorefrontPageEnter>;
}
