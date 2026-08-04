type DrawerCloseTabProps = {
  onClose: () => void;
  closeLabel: string;
};

/**
 * Side-tab close control that peeks from under the cart drawer’s left edge
 * (MaMarie-style).
 */
export function DrawerCloseTab({ onClose, closeLabel }: DrawerCloseTabProps) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label={closeLabel}
      className="absolute top-[22px] left-0 z-[1] flex h-[38px] w-20 -translate-x-1/2 items-center justify-center rounded-full bg-brand-red pr-10 text-white transition-transform duration-200 ease-out hover:scale-105 focus-visible:scale-105 motion-reduce:transition-none"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        aria-hidden
        className="translate-x-0.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
}
