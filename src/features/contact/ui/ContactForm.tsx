"use client";

import { useState, useTransition } from "react";
import { Lock, Send } from "lucide-react";

import { submitContactMessageAction } from "@/features/contact/application/submit-contact";

type ContactFormCopy = {
  formTitle: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  submit: string;
  privacyNote: string;
  success: string;
  error: string;
};

type ContactFormProps = {
  copy: ContactFormCopy;
};

const fieldClassName =
  "h-11 w-full rounded-[15px] border border-gray-200 bg-white px-3 text-gray-900 outline-none transition focus:border-brand-red/40 focus:ring-2 focus:ring-brand-red/15 disabled:bg-gray-50 disabled:opacity-60";

const labelClassName = "mb-1.5 block text-sm font-medium text-gray-700";

export function ContactForm({ copy }: ContactFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (success) {
    return (
      <div className="rounded-[15px] border border-gray-100 bg-white p-6 shadow-[0_4px_15px_rgba(0,0,0,0.05)] sm:p-8">
        <p
          role="status"
          className="rounded-[15px] border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          {copy.success}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[15px] border border-gray-100 bg-white p-6 shadow-[0_4px_15px_rgba(0,0,0,0.05)] sm:p-8">
      <h2 className="mb-6 text-xl font-bold text-gray-900 sm:text-2xl">
        {copy.formTitle}
      </h2>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);

          startTransition(async () => {
            setError(null);
            const result = await submitContactMessageAction({
              name: String(formData.get("name") ?? ""),
              email: String(formData.get("email") ?? ""),
              phone: String(formData.get("phone") ?? "") || undefined,
              subject: String(formData.get("subject") ?? "") || undefined,
              message: String(formData.get("message") ?? ""),
              companyWebsite: String(formData.get("companyWebsite") ?? ""),
            });

            if (!result.ok) {
              setError(result.error.message || copy.error);
              return;
            }

            setSuccess(true);
          });
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClassName}>{copy.name}</span>
            <input
              name="name"
              required
              maxLength={120}
              autoComplete="name"
              className={fieldClassName}
              disabled={isPending}
            />
          </label>

          <label className="block">
            <span className={labelClassName}>{copy.email}</span>
            <input
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              className={fieldClassName}
              disabled={isPending}
            />
          </label>
        </div>

        <label className="block">
          <span className={labelClassName}>{copy.phone}</span>
          <input
            name="phone"
            type="tel"
            maxLength={40}
            autoComplete="tel"
            className={fieldClassName}
            disabled={isPending}
          />
        </label>

        <label className="block">
          <span className={labelClassName}>{copy.subject}</span>
          <input
            name="subject"
            maxLength={160}
            className={fieldClassName}
            disabled={isPending}
          />
        </label>

        <label className="block">
          <span className={labelClassName}>{copy.message}</span>
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={5000}
            rows={6}
            className="w-full rounded-[15px] border border-gray-200 bg-white px-3 py-2.5 text-gray-900 outline-none transition focus:border-brand-red/40 focus:ring-2 focus:ring-brand-red/15 disabled:bg-gray-50 disabled:opacity-60"
            disabled={isPending}
          />
        </label>

        {/* Honeypot — hidden from users */}
        <input
          type="text"
          name="companyWebsite"
          tabIndex={-1}
          autoComplete="off"
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
          aria-hidden
        />

        {error ? (
          <p
            role="alert"
            className="rounded-[15px] border border-red-200 bg-red-50 p-3 text-sm text-red-600"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[15px] bg-brand-red px-4 text-sm font-semibold text-white transition hover:bg-brand-red-hot focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isPending}
        >
          {isPending ? "…" : copy.submit}
          <Send className="size-4 shrink-0" aria-hidden />
        </button>

        <p className="flex items-start justify-center gap-2 pt-1 text-center text-xs text-gray-500">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>{copy.privacyNote}</span>
        </p>
      </form>
    </div>
  );
}
