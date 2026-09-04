const NEETRINO_URL = "https://neetrino.com";

type SiteCopyrightProps = {
  className?: string;
  linkClassName?: string;
};

/** Shared copyright line (desktop footer + mobile home). */
export function SiteCopyright({ className, linkClassName }: SiteCopyrightProps) {
  const year = new Date().getFullYear();

  return (
    <p className={className}>
      {`Copyright © ${year} | All Rights Reserved | Created by `}
      <a
        href={NEETRINO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        Neetrino IT Company
      </a>
    </p>
  );
}
