// Sign-in uses only a name + password. Auth needs an email, so we derive a
// deterministic private address from the normalized name. It never receives mail.
export function normalizeName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/^[.]+|[.]+$/g, "");
}

export function nameToEmail(raw: string): string {
  return `${normalizeName(raw)}@peacekeeper.app`;
}
