/**
 * The product's password policy, mirrored from the API (`api/src/common/password.ts`).
 * The panel checks it live so the user is told what's missing *while they type* — the API
 * still re-validates, but a rejected save should never be the first time they hear the rule.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

export interface PasswordRule {
  /** Shown as a checklist item under the field. */
  label: string;
  test: (value: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    label: `Al menos ${PASSWORD_MIN_LENGTH} caracteres`,
    test: (value) => value.length >= PASSWORD_MIN_LENGTH,
  },
  { label: "Al menos una letra", test: (value) => /[A-Za-z]/.test(value) },
  { label: "Al menos un número", test: (value) => /\d/.test(value) },
];

/** True when the password satisfies every rule (and isn't longer than bcrypt can hash). */
export function isPasswordValid(value: string): boolean {
  return value.length <= PASSWORD_MAX_LENGTH && PASSWORD_RULES.every((rule) => rule.test(value));
}
