"use client";

import { useId, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { ADMIN_INPUT } from "@/features/admin/ui/admin-form-classes";
import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import type { CouponUserOption } from "@/features/promotions/application/queries";

type CouponUserPickerProps = {
  users: CouponUserOption[];
  selectedIds: string[];
  disabled?: boolean;
  onChange: (ids: string[]) => void;
};

function userLabel(user: CouponUserOption): string {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name || user.email;
}

export function CouponUserPicker({
  users,
  selectedIds,
  disabled = false,
  onChange,
}: CouponUserPickerProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.coupons.drawer;
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedCount = selectedIds.length;
  const hint =
    selectedCount === 0
      ? copy.allUsersHint
      : formatAdminMessage(copy.selectedUsersHint, {
          count: String(selectedCount),
        });

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return users;
    }
    return users.filter((user) => {
      const haystack =
        `${user.firstName} ${user.lastName} ${user.email} ${user.phone ?? ""}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [query, users]);

  function toggleUser(id: string): void {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((value) => value !== id));
      return;
    }
    onChange([...selectedIds, id]);
  }

  return (
    <div className="rounded-xl border border-gray-300">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-50"
      >
        <div>
          <p className="text-sm font-medium text-gray-900">{copy.selectUsers}</p>
          <p className="mt-0.5 text-sm text-gray-500">{hint}</p>
        </div>
        <ChevronDown
          className={`mt-1 h-4 w-4 shrink-0 text-gray-400 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      {open ? (
        <div id={listId} className="border-t border-gray-200 px-4 py-3">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.searchUsers}
            className={ADMIN_INPUT}
            disabled={disabled}
          />

          <div className="mt-3 max-h-48 space-y-1 overflow-y-auto">
            {users.length === 0 ? (
              <p className="text-sm text-gray-500">{copy.noUsers}</p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-sm text-gray-500">{copy.noUsersMatch}</p>
            ) : (
              filteredUsers.map((user) => (
                <label
                  key={user.id}
                  className="flex cursor-pointer items-start gap-2 rounded-lg px-1 py-1.5 text-sm text-gray-800 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(user.id)}
                    disabled={disabled}
                    onChange={() => toggleUser(user.id)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-brand-yellow text-brand-yellow focus:ring-brand-yellow"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-gray-900">
                      {userLabel(user)}
                    </span>
                    <span className="block truncate text-xs text-gray-500">
                      {user.email}
                    </span>
                  </span>
                </label>
              ))
            )}
          </div>

          {selectedCount > 0 ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange([])}
              className="mt-3 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              {copy.clearUsers}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
