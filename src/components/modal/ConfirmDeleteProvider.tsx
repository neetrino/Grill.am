"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  ConfirmDeleteModal,
  type ConfirmModalTone,
} from "@/components/modal/ConfirmDeleteModal";

export type ConfirmDeleteOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmTone?: ConfirmModalTone;
};

export type ConfirmDeleteDefaultLabels = {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
};

type ActiveConfirmDelete = {
  options: ConfirmDeleteOptions;
  resolve: (accepted: boolean) => void;
};

type ConfirmDeleteContextValue = {
  /** Opens the shared delete confirmation modal. Resolves `true` if confirmed. */
  confirmDelete: (options: ConfirmDeleteOptions | string) => Promise<boolean>;
};

const ConfirmDeleteContext = createContext<ConfirmDeleteContextValue | null>(
  null,
);

function toOptions(options: ConfirmDeleteOptions | string): ConfirmDeleteOptions {
  if (typeof options === "string") {
    return { message: options };
  }
  return { ...options };
}

type ConfirmDeleteProviderProps = {
  children: ReactNode;
  labels: ConfirmDeleteDefaultLabels;
};

export function ConfirmDeleteProvider({
  children,
  labels,
}: ConfirmDeleteProviderProps) {
  const [active, setActive] = useState<ActiveConfirmDelete | null>(null);
  const queueRef = useRef<ActiveConfirmDelete[]>([]);

  const openConfirm = useCallback(
    (rawOptions: ConfirmDeleteOptions | string) => {
      return new Promise<boolean>((resolve) => {
        const request: ActiveConfirmDelete = {
          options: toOptions(rawOptions),
          resolve,
        };
        setActive((current) => {
          if (current) {
            queueRef.current.push(request);
            return current;
          }
          return request;
        });
      });
    },
    [],
  );

  const finish = useCallback(
    (accepted: boolean) => {
      if (!active) {
        return;
      }
      active.resolve(accepted);
      const next = queueRef.current.shift() ?? null;
      setActive(next);
    },
    [active],
  );

  const contextValue = useMemo(
    () => ({
      confirmDelete: openConfirm,
    }),
    [openConfirm],
  );

  return (
    <ConfirmDeleteContext.Provider value={contextValue}>
      {children}
      <ConfirmDeleteModal
        isOpen={Boolean(active)}
        title={active?.options.title ?? labels.title}
        message={active?.options.message ?? labels.message}
        confirmText={active?.options.confirmText ?? labels.confirmText}
        cancelText={active?.options.cancelText ?? labels.cancelText}
        confirmTone={active?.options.confirmTone ?? "danger"}
        onCancel={() => finish(false)}
        onConfirm={() => finish(true)}
      />
    </ConfirmDeleteContext.Provider>
  );
}

/** Global delete confirmation — use anywhere under LocaleClientProviders. */
export function useConfirmDelete(): ConfirmDeleteContextValue {
  const context = useContext(ConfirmDeleteContext);
  if (!context) {
    throw new Error("useConfirmDelete must be used within ConfirmDeleteProvider");
  }
  return context;
}
