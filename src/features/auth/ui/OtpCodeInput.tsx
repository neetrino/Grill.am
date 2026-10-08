"use client";

import { useRef } from "react";

const OTP_LENGTH = 6;

type OtpCodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  label: string;
};

/** Six single-digit boxes. Paste, arrows, and mobile numeric entry are supported. */
export function OtpCodeInput({
  value,
  onChange,
  disabled = false,
  invalid = false,
  label,
}: OtpCodeInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from(
    { length: OTP_LENGTH },
    (_, index) => value[index] ?? "",
  );

  function commit(next: string[]): void {
    onChange(next.join("").replace(/\D/g, "").slice(0, OTP_LENGTH));
  }

  function writeDigits(start: number, numeric: string): void {
    const chars = digits.slice();
    numeric
      .slice(0, OTP_LENGTH - start)
      .split("")
      .forEach((char, offset) => {
        chars[start + offset] = char;
      });
    commit(chars);
    const focusIndex = Math.min(start + numeric.length, OTP_LENGTH - 1);
    refs.current[focusIndex]?.focus();
  }

  return (
    <div
      role="group"
      aria-label={label}
      className="grid grid-cols-6 gap-2"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          value={digit}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`${label} ${index + 1}`}
          aria-invalid={invalid}
          maxLength={1}
          disabled={disabled}
          autoFocus={index === 0}
          className={`h-12 w-full min-w-0 rounded-[14px] border-2 bg-white text-center text-lg font-black text-brand-ink outline-none focus:border-brand-red ${
            invalid ? "border-brand-red" : "border-brand-ink/12"
          }`}
          onChange={(event) => {
            const numeric = event.target.value.replace(/\D/g, "");
            if (!numeric) {
              const chars = digits.slice();
              chars[index] = "";
              commit(chars);
              return;
            }
            writeDigits(index, numeric);
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digits[index] && index > 0) {
              const chars = digits.slice();
              chars[index - 1] = "";
              commit(chars);
              refs.current[index - 1]?.focus();
            }
            if (event.key === "ArrowLeft" && index > 0) {
              refs.current[index - 1]?.focus();
            }
            if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
              refs.current[index + 1]?.focus();
            }
          }}
          onPaste={(event) => {
            const text = event.clipboardData
              .getData("text")
              .replace(/\D/g, "")
              .slice(0, OTP_LENGTH);
            if (!text) {
              return;
            }
            event.preventDefault();
            writeDigits(0, text);
          }}
        />
      ))}
    </div>
  );
}
