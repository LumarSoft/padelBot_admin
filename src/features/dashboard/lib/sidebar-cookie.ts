/**
 * Remembers whether the panel's sidebar is collapsed, per browser. A cookie and not
 * localStorage: the server layout reads it, so the first paint already has the right width
 * instead of jumping after hydration.
 */
export const SIDEBAR_COOKIE = "gtp-sidebar";

export const SIDEBAR_COLLAPSED = "collapsed";

/** Client-only: persists the choice for a year. */
export function saveSidebarCollapsed(collapsed: boolean): void {
  document.cookie = `${SIDEBAR_COOKIE}=${collapsed ? SIDEBAR_COLLAPSED : "expanded"}; path=/; max-age=31536000; samesite=lax`;
}
