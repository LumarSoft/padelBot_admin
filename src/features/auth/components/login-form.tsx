"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import * as z from "zod";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Eyebrow } from "@/features/landing/components/landing-ui";
import { useLogin } from "@/features/auth/hooks/use-login";

const loginSchema = z.object({
  email: z.email("Ingresá un email válido."),
  password: z.string().min(1, "La contraseña es obligatoria."),
});

type FieldErrors = Partial<Record<"email" | "password", string>>;

/**
 * The paper card pins the theme tokens the shared inputs read, so the form
 * looks the same whether the visitor's panel theme is light or dark.
 */
const PAPER_TOKENS =
  "[--foreground:var(--color-ink)] [--muted-foreground:oklch(0.45_0.03_262)] [--input:oklch(0.84_0.02_90)] [--ring:var(--color-court)] [--card:white] [--destructive:oklch(0.55_0.2_27)]";

/** 16px text keeps iOS from zooming in when a field gets focus. */
const FIELD_CLASS =
  "h-12 rounded-xl border-ink/15 bg-white px-4 text-base shadow-none md:text-base dark:bg-white dark:focus-visible:bg-white";

/**
 * `failed` comes from `/login?error=login`: a native submit (one made before React hydrated)
 * that the BFF bounced back. See `withLoginFormPost`. `sessionEnded` comes from
 * `/login?error=session`: the panel was signed out because its session expired or the owner
 * deactivated the user (see `lib/api/session-ended`).
 */
export function LoginForm({
  failed = false,
  sessionEnded = false,
}: {
  failed?: boolean;
  sessionEnded?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showFailed, setShowFailed] = useState(failed);
  const [showSessionEnded, setShowSessionEnded] = useState(sessionEnded);
  const login = useLogin();

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setShowFailed(false);
    setShowSessionEnded(false);
    const result = loginSchema.safeParse({ email, password });

    if (!result.success) {
      const flattened = z.flattenError(result.error).fieldErrors;
      setErrors({
        email: flattened.email?.[0],
        password: flattened.password?.[0],
      });
      return;
    }

    setErrors({});
    login.mutate(result.data);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 lg:max-w-none">
      <div className="flex flex-col gap-3">
        <Eyebrow className="text-ball">Panel del club</Eyebrow>
        <h1 className="font-display text-chalk text-[clamp(2.75rem,12vw,3.75rem)] leading-[0.88] font-black uppercase">
          Entrá a tu club.
        </h1>
        <p className="text-fog text-pretty">
          Agenda, señas y conversaciones del bot, en un solo lugar.
        </p>
      </div>

      {/* method + action keep a submit made before hydration a POST to the BFF: never a GET
          that would put the email and password in the URL. */}
      <form
        method="post"
        action="/api/auth/login"
        onSubmit={handleSubmit}
        noValidate
        className={`${PAPER_TOKENS} bg-paper text-ink flex flex-col gap-5 rounded-3xl p-5 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.8)] sm:p-7`}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-[15px]">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="vos@tuclub.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(errors.email)}
            disabled={login.isPending}
            className={FIELD_CLASS}
          />
          {errors.email && (
            <p className="text-destructive text-sm">{errors.email}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="text-[15px]">
            Contraseña
          </Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(errors.password)}
            disabled={login.isPending}
            className={`${FIELD_CLASS} pr-11`}
          />
          {errors.password && (
            <p className="text-destructive text-sm">{errors.password}</p>
          )}
        </div>

        {showFailed && (
          <p role="alert" className="text-destructive text-sm">
            No pudimos iniciar sesión. Revisá el email y la contraseña.
          </p>
        )}

        {showSessionEnded && (
          <p role="status" className="text-muted-foreground text-sm">
            Tu sesión se cerró. Ingresá de nuevo para seguir.
          </p>
        )}

        <Button
          type="submit"
          disabled={login.isPending}
          className="bg-ball text-ink mt-1 h-13 w-full gap-2 rounded-full bg-none text-base font-semibold shadow-[0_10px_30px_-12px_var(--color-ball)] hover:brightness-105"
        >
          {login.isPending ? "Ingresando…" : "Ingresar"}
          {!login.isPending && <ArrowRight className="size-4.5" />}
        </Button>
      </form>

      <div className="flex flex-col gap-4 text-center">
        <p className="text-fog flex flex-col gap-1 text-[15px] sm:block">
          ¿Todavía no tenés cuenta?{" "}
          <Link
            href="/register"
            className="text-ball py-1 font-semibold underline-offset-4 hover:underline"
          >
            Probá GTP 15 días gratis
          </Link>
        </p>
        <Link
          href="/"
          className="text-fog hover:text-chalk inline-flex items-center justify-center gap-1.5 self-center rounded-full px-3 py-2 text-sm transition-colors lg:hidden"
        >
          <ArrowLeft className="size-4" />
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
