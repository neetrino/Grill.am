export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export type LegalDocumentCopy = {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
};

type LegalDocumentViewProps = {
  copy: LegalDocumentCopy;
  lastUpdatedLabel: string;
  /** Compact layout for side sheets. */
  variant?: "page" | "sheet";
};

export function LegalDocumentView({
  copy,
  lastUpdatedLabel,
  variant = "page",
}: LegalDocumentViewProps) {
  const isSheet = variant === "sheet";

  return (
    <article
      className={
        isSheet
          ? "flex flex-col gap-6"
          : "mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8"
      }
    >
      <header className="flex flex-col gap-3">
        {isSheet ? null : (
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            {copy.title}
          </h1>
        )}
        <p className="text-sm text-[var(--muted)]">
          {lastUpdatedLabel} {copy.lastUpdated}
        </p>
        <p className="text-base leading-relaxed text-[var(--foreground)]">
          {copy.intro}
        </p>
      </header>

      <div className={isSheet ? "flex flex-col gap-6" : "flex flex-col gap-8"}>
        {copy.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-3">
            <h2
              className={
                isSheet
                  ? "text-lg font-semibold text-[var(--foreground)]"
                  : "text-xl font-semibold text-[var(--foreground)]"
              }
            >
              {section.heading}
            </h2>
            {section.paragraphs.map((paragraph, index) => (
              <p
                key={`${section.heading}-${index}`}
                className="text-base leading-relaxed text-[var(--foreground)]"
              >
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
