type PasswordRequirementsDisclaimerProps = {
  title: string;
  rules: readonly string[];
};

/** Ordered password-rules disclaimer shown after a failed format check. */
export function PasswordRequirementsDisclaimer({
  title,
  rules,
}: PasswordRequirementsDisclaimerProps) {
  return (
    <div
      role="alert"
      className="rounded-[15px] border border-red-200 bg-red-50 p-3 text-sm text-red-700"
    >
      <p className="font-medium">{title}</p>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        {rules.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ol>
    </div>
  );
}
