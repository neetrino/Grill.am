type IconProps = {
  className?: string;
};

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function LinkedInIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

/** Figma footer WhatsApp glyph (`165:1771`). */
export function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M15.377 2.619C14.548 1.786 13.56 1.125 12.471.675 11.383.226 10.215-.004 9.036 0 4.098 0 .072 4.005.072 8.919c0 1.575.416 3.105 1.194 4.455L0 18l4.749-1.242C6.06 17.469 7.535 17.847 9.036 17.847 13.975 17.847 18 13.842 18 8.928c0-2.385-.932-4.626-2.623-6.309ZM9.036 16.335c-1.339 0-2.65-.36-3.799-1.035l-.271-.162-2.822.738.751-2.736-.181-.279c-.744-1.182-1.139-2.548-1.14-3.942C1.574 4.833 4.921 1.503 9.027 1.503c1.99 0 3.862.774 5.264 2.178.694.688 1.245 1.505 1.619 2.406.374.901.565 1.866.561 2.841.018 4.086-3.329 7.407-7.435 7.407Zm4.089-5.544c-.226-.108-1.33-.648-1.529-.729-.208-.072-.353-.108-.507.108-.154.225-.579.729-.705.873-.127.153-.262.171-.488.054-.226-.108-.95-.351-1.8-1.107-.67-.594-1.113-1.323-1.249-1.548-.126-.225-.018-.342.1-.459.099-.099.226-.261.334-.387.109-.126.154-.225.227-.369.072-.153.036-.279-.018-.387-.054-.108-.507-1.206-.688-1.656-.181-.432-.371-.378-.507-.369h-.434c-.154 0-.389.054-.597.279-.199.225-.778.765-.778 1.863s.805 2.16.914 2.304c.108.153 1.583 2.403 3.826 3.366.534.234.95.369 1.275.468.534.171 1.022.144 1.411.09.434-.063 1.33-.54 1.511-1.062.19-.522.19-.963.126-1.062-.063-.099-.199-.144-.425-.252Z" />
    </svg>
  );
}
