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

/** Figma navbar currency banknote glyph (`165:1750`). */
export function HeaderCurrencyIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 22.427 14.25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      overflow="visible"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M1 5.08333V3.04167C1 2.50018 1.23912 1.98088 1.66477 1.59799C2.09041 1.2151 2.66771 1 3.26966 1H5.53933M1 5.08333C2.51273 5.08333 5.53933 4.26667 5.53933 1M1 5.08333V9.16667M5.53933 1H16.8876M1 9.16667V11.2083C1 11.7498 1.23912 12.2691 1.66477 12.652C2.09041 13.0349 2.66771 13.25 3.26966 13.25H5.53933M1 9.16667C2.51273 9.16667 5.53933 9.98333 5.53933 13.25M21.427 5.08333V3.04167C21.427 2.50018 21.1878 1.98088 20.7622 1.59799C20.3366 1.2151 19.7593 1 19.1573 1H16.8876M21.427 5.08333C19.9142 5.08333 16.8876 4.26667 16.8876 1M21.427 5.08333V9.16667M21.427 9.16667V11.2083C21.427 11.7498 21.1878 12.2691 20.7622 12.652C20.3366 13.0349 19.7593 13.25 19.1573 13.25H16.8876M21.427 9.16667C19.9142 9.16667 16.8876 9.98333 16.8876 13.25M16.8876 13.25H5.53933"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.215 9.16667C12.4685 9.16667 13.4846 8.25258 13.4846 7.125C13.4846 5.99742 12.4685 5.08333 11.215 5.08333C9.96148 5.08333 8.94531 5.99742 8.94531 7.125C8.94531 8.25258 9.96148 9.16667 11.215 9.16667Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
