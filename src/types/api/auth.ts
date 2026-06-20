/** Roles a club staff member can have within the panel. */
export type UserRole = "owner" | "staff";

/**
 * Non-sensitive session user. Always scoped to a single club (tenant).
 * This is the only auth data that reaches the browser — never the JWT.
 */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  clubId: string;
  clubName: string;
  role: UserRole;
}

/** Credentials submitted from the login form. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Response shape of the internal BFF login route. */
export interface LoginResponse {
  user: SessionUser;
}

/**
 * Shape padelbot_api is expected to return from `POST /auth/login`.
 * `token` is a JWT whose claims include the user's `clubId`.
 */
export interface ApiLoginResponse {
  token: string;
  user: SessionUser;
}
