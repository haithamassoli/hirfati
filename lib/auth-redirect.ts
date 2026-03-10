export const DEFAULT_AUTH_REDIRECT = "/dashboard";

export function sanitizeRedirectPath(
  redirect?: string | string[] | null
): string {
  const value = Array.isArray(redirect) ? redirect[0] : redirect;

  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT;
  }

  return value;
}

export function buildAuthHref(redirect?: string | string[] | null): string {
  const safeRedirect = sanitizeRedirectPath(redirect);

  if (safeRedirect === DEFAULT_AUTH_REDIRECT) {
    return "/auth";
  }

  const params = new URLSearchParams({ redirect: safeRedirect });
  return `/auth?${params.toString()}`;
}
