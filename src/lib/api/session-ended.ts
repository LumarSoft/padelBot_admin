/**
 * Header the BFF puts on a `401` that means the panel session is over: the API rejected the
 * token (expired, or its user was deactivated or moved to another club) or there is no
 * session cookie left. The BFF has already dropped the cookie by then; the browser client
 * reads the header to send the user to /login. A `401` without it (a wrong password on the
 * login form) is just an error to show.
 */
export const SESSION_ENDED_HEADER = "x-session-ended";

/** Where the browser lands when the session ended; the login page explains why. */
export const SESSION_ENDED_LOGIN_PATH = "/login?error=session";
