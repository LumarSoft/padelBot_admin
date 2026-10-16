/**
 * The campaign a prospect arrived by: the UTM parameters of the link they clicked. They can land
 * on the landing (and reach `/register` through one of its buttons) or on `/register` directly.
 * The landing keeps them for the tab in `sessionStorage` — gone when the tab closes, no cookie —
 * and the signup sends them along with the answers.
 */
export interface Utm {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

const KEY = "gtp.utm";
const PARAMS: [keyof Utm, string][] = [
  ["utmSource", "utm_source"],
  ["utmMedium", "utm_medium"],
  ["utmCampaign", "utm_campaign"],
];

/** The UTM parameters of a query string (trimmed, capped), or null when it has none. */
export function utmFrom(search: URLSearchParams | Record<string, string | string[] | undefined>): Utm | null {
  const read = (name: string): string | undefined => {
    const raw = search instanceof URLSearchParams ? search.get(name) : search[name];
    const value = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 100);
    return value || undefined;
  };
  const utm: Utm = {};
  for (const [key, param] of PARAMS) {
    const value = read(param);
    if (value) utm[key] = value;
  }
  return Object.keys(utm).length > 0 ? utm : null;
}

export function rememberUtm(utm: Utm): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(utm));
  } catch {
    // Storage blocked (private mode): the campaign just isn't recorded.
  }
}

export function rememberedUtm(): Utm | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Utm;
    return utmFrom(
      Object.fromEntries(PARAMS.map(([key, param]) => [param, typeof parsed[key] === "string" ? parsed[key] : undefined])),
    );
  } catch {
    return null;
  }
}
