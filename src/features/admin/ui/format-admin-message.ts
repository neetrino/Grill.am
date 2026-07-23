/**
 * Replaces `{name}` placeholders in admin message templates.
 * Safe for both server and client modules.
 */
export function formatAdminMessage(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    return values[key] ?? "";
  });
}
