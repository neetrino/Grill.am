"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Card } from "@/components/ui/Card";
import {
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_SECTION_TITLE,
} from "@/features/admin/ui/admin-form-classes";
import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import {
  ADMIN_BTN_PRIMARY_CLASS,
  ADMIN_CARD_CLASS,
} from "@/features/admin/ui/admin-ui";
import { upsertStoreSettingAction } from "@/features/settings/application/upsert-settings";
import type {
  StoreFxRates,
  StoreIdentity,
} from "@/features/settings/domain/store-settings";

type StoreSettingsFormsProps = {
  locale: string;
  identity: StoreIdentity;
  fxRates: StoreFxRates;
};

export function StoreSettingsForms({
  locale,
  identity,
  fxRates,
}: StoreSettingsFormsProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.settings;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex w-full flex-col gap-6">
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <Card
          className={`overflow-visible !border-0 !shadow-none p-6 ${ADMIN_CARD_CLASS}`}
        >
          <form
            className="flex h-full flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              startTransition(async () => {
                setError(null);
                setMessage(null);
                const result = await upsertStoreSettingAction(locale, {
                  key: "store.identity",
                  value: {
                    name: String(data.get("name") ?? "").trim(),
                    supportEmail: String(data.get("supportEmail") ?? "").trim(),
                    phone: String(data.get("phone") ?? "").trim() || undefined,
                  },
                });
                if (!result.ok) {
                  setError(result.error.message);
                  return;
                }
                setMessage(
                  formatAdminMessage(copy.savedKey, { key: result.value.key }),
                );
                router.refresh();
              });
            }}
          >
            <h2 className={ADMIN_SECTION_TITLE}>{copy.identity.title}</h2>
            <label>
              <span className={ADMIN_LABEL}>{copy.identity.name}</span>
              <input
                name="name"
                defaultValue={identity.name}
                className={ADMIN_INPUT}
                disabled={isPending}
              />
            </label>
            <label>
              <span className={ADMIN_LABEL}>{copy.identity.supportEmail}</span>
              <input
                name="supportEmail"
                type="email"
                defaultValue={identity.supportEmail}
                className={ADMIN_INPUT}
                disabled={isPending}
              />
            </label>
            <label>
              <span className={ADMIN_LABEL}>{copy.identity.phone}</span>
              <input
                name="phone"
                defaultValue={identity.phone ?? ""}
                className={ADMIN_INPUT}
                disabled={isPending}
              />
            </label>
            <div className="mt-auto flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className={`${ADMIN_BTN_PRIMARY_CLASS} w-full sm:w-auto sm:min-w-[240px]`}
              >
                {copy.identity.save}
              </button>
            </div>
          </form>
        </Card>

        <Card
          className={`overflow-visible !border-0 !shadow-none p-6 ${ADMIN_CARD_CLASS}`}
        >
          <form
            className="flex h-full flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              startTransition(async () => {
                setError(null);
                setMessage(null);
                const result = await upsertStoreSettingAction(locale, {
                  key: "store.fxRates",
                  value: {
                    usd: String(data.get("usd") ?? "").trim(),
                    rub: String(data.get("rub") ?? "").trim(),
                  },
                });
                if (!result.ok) {
                  setError(result.error.message);
                  return;
                }
                setMessage(
                  formatAdminMessage(copy.savedKey, { key: result.value.key }),
                );
                router.refresh();
              });
            }}
          >
            <h2 className={ADMIN_SECTION_TITLE}>{copy.fx.title}</h2>
            <p className="text-sm text-[color:var(--color-muted-foreground)]">
              {copy.fx.help}
            </p>
            <label>
              <span className={ADMIN_LABEL}>{copy.fx.usd}</span>
              <input
                name="usd"
                type="text"
                inputMode="decimal"
                defaultValue={fxRates.usd}
                placeholder={copy.fx.usdPlaceholder}
                className={ADMIN_INPUT}
                disabled={isPending}
                required
              />
            </label>
            <label>
              <span className={ADMIN_LABEL}>{copy.fx.rub}</span>
              <input
                name="rub"
                type="text"
                inputMode="decimal"
                defaultValue={fxRates.rub}
                placeholder={copy.fx.rubPlaceholder}
                className={ADMIN_INPUT}
                disabled={isPending}
                required
              />
            </label>
            <div className="mt-auto flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className={`${ADMIN_BTN_PRIMARY_CLASS} w-full sm:w-auto sm:min-w-[240px]`}
              >
                {copy.fx.save}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
