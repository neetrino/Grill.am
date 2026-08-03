type IconProps = {
  className?: string;
};

/** Figma navbar account glyph (`165:1737`). */
export function HeaderUserIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="-1 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      overflow="visible"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M15.0625 6C15.0625 7.32608 14.5291 8.59785 13.5797 9.53553C12.6303 10.4732 11.3427 11 10 11C8.65734 11 7.36968 10.4732 6.42027 9.53553C5.47087 8.59785 4.9375 7.32608 4.9375 6C4.9375 4.67392 5.47087 3.40215 6.42027 2.46447C7.36968 1.52678 8.65734 1 10 1C11.3427 1 12.6303 1.52678 13.5797 2.46447C14.5291 3.40215 15.0625 4.67392 15.0625 6ZM19 21V18.7778C19 17.599 18.5259 16.4686 17.682 15.6351C16.8381 14.8016 15.6935 14.3333 14.5 14.3333H5.5C4.30653 14.3333 3.16193 14.8016 2.31802 15.6351C1.47411 16.4686 1 17.599 1 18.7778V21H19Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
    </svg>
  );
}

/** Figma navbar wishlist glyph (`165:1738`). */
export function HeaderWishlistIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="-2 -1 28 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      overflow="visible"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6.6 1C2.955 1 0 3.86955 0 7.40914C0 13.8183 7.8 19.6448 12 21C16.2 19.6448 24 13.8183 24 7.40914C24 3.86955 21.045 1 17.4 1C15.168 1 13.194 2.07615 12 3.7233C11.3913 2.8816 10.5828 2.19467 9.6428 1.72064C8.7029 1.2466 7.6592 0.99942 6.6 1Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
