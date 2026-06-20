/**
 * Minimal logging utility. Use this instead of `console.*` directly so logging
 * can be routed or silenced from a single place later.
 */

type LogMeta = Record<string, unknown>;

function format(scope: string, message: string): string {
  return `[padelbot:${scope}] ${message}`;
}

export const logger = {
  info(scope: string, message: string, meta?: LogMeta): void {
    console.info(format(scope, message), meta ?? "");
  },
  warn(scope: string, message: string, meta?: LogMeta): void {
    console.warn(format(scope, message), meta ?? "");
  },
  error(scope: string, message: string, meta?: LogMeta): void {
    console.error(format(scope, message), meta ?? "");
  },
};
