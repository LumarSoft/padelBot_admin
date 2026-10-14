import "server-only";

import { NextResponse } from "next/server";

interface LoginPages {
  /** Where a successful native submit lands. */
  home: string;
  /** The login page, which reads `?error=login` to say the attempt failed. */
  login: string;
}

/**
 * Lets a login BFF route serve the login form's native submit as well as its JSON fetch.
 *
 * The login forms carry `method="post"` and point `action` at their BFF route, so a submit
 * that lands before React hydrates (slow 3G, a blocked chunk, a JS error) posts the form here
 * instead of falling back to a GET that would put the email and password in the URL — and
 * from there in the browser history and every server and proxy log. Once hydrated, the form
 * handles the submit itself and calls the same route with JSON, which is passed straight
 * through.
 *
 * A native submit gets a 303 instead of JSON: to `home` once the session cookie is set, back
 * to the login page otherwise. The credentials never go into either URL.
 */
export async function withLoginFormPost(
  request: Request,
  pages: LoginPages,
  login: (body: unknown) => Promise<NextResponse>,
): Promise<NextResponse> {
  const contentType = request.headers.get("content-type") ?? "";
  const isFormPost =
    contentType.startsWith("application/x-www-form-urlencoded") ||
    contentType.startsWith("multipart/form-data");

  if (!isFormPost) {
    return login(await request.json().catch(() => null));
  }

  // Only our own login page may post here: a cross-site form must not be able to sign a
  // visitor into an account it picked.
  const site = request.headers.get("sec-fetch-site");
  if (site !== null && site !== "same-origin") {
    return NextResponse.json({ message: "Origen no permitido." }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  const response = await login({
    email: form?.get("email"),
    password: form?.get("password"),
  });

  // 303 so the browser follows with a GET and never re-posts the form. The Location stays
  // relative: a route handler's `request.url` carries the host Next bound to (localhost),
  // not the one the browser used, and the browser resolves a relative one against the latter.
  const target = response.ok ? pages.home : `${pages.login}?error=login`;
  return new NextResponse(null, { status: 303, headers: { Location: target } });
}
