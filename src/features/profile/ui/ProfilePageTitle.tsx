import type { ElementType, ReactNode } from "react";

type ProfilePageTitleProps = {
  children: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
  size?: "page" | "section";
};

const SIZE_CLASS: Record<NonNullable<ProfilePageTitleProps["size"]>, string> = {
  page: "text-2xl leading-tight",
  section: "text-xl leading-tight",
};

/**
 * Profile page/section title: Capital letters, first word brand-red,
 * any following words brand-yellow.
 */
export function ProfilePageTitle({
  children,
  as = "h1",
  className = "",
  size = "page",
}: ProfilePageTitleProps): ReactNode {
  const Tag = as as ElementType;
  const words = children.trim().split(/\s+/).filter(Boolean);

  return (
    <Tag
      className={`font-bold tracking-tight uppercase ${SIZE_CLASS[size]} ${className}`.trim()}
    >
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className={index === 0 ? "text-brand-red" : "text-brand-yellow"}
        >
          {index > 0 ? " " : null}
          {word}
        </span>
      ))}
    </Tag>
  );
}
