/** Query keys that must never remain in the browser URL (history / Referer / logs). */
const SENSITIVE_QUERY_KEYS = [
  "password",
  "password_confirmation",
  "confirmPassword",
  "token",
  "access_token",
  "refresh_token",
] as const;

/**
 * Strip sensitive query params from the current URL without a navigation.
 * Call on auth pages in case a native GET form submit leaked credentials into the address bar.
 */
export function scrubSensitiveQueryParams(): void {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    let changed = false;
    for (const key of SENSITIVE_QUERY_KEYS) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }
    // Also drop email if it arrived alongside a password leak (common GET form dump)
    if (changed && url.searchParams.has("email")) {
      url.searchParams.delete("email");
    }
    if (!changed) return;
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, "", next);
  } catch {
    // ignore
  }
}
