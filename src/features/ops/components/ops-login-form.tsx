"use client";

import { useState, type FormEvent } from "react";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useOpsLogin } from "@/features/ops/hooks/use-ops";

const loginSchema = z.object({
  email: z.email("Ingresá un email válido."),
  password: z.string().min(1, "La contraseña es obligatoria."),
});

type FieldErrors = Partial<Record<"email" | "password", string>>;

/** `failed` comes from `/ops/login?error=login` — see `LoginForm`. */
export function OpsLoginForm({ failed = false }: { failed?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showFailed, setShowFailed] = useState(failed);
  const login = useOpsLogin();

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setShowFailed(false);
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
    <div className="animate-in fade-in slide-in-from-bottom-4 flex w-full max-w-sm flex-col gap-6 duration-500 ease-out">
      <div className="space-y-1 text-center">
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Consola de operaciones
        </h1>
        <p className="text-muted-foreground text-sm">
          Uso interno de Lumarsoft.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-6">
          {/* Never a GET before hydration — see LoginForm. */}
          <form
            method="post"
            action="/api/ops/auth/login"
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
            noValidate
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="ops-email">Email</Label>
              <Input
                id="ops-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(errors.email)}
                disabled={login.isPending}
                autoFocus
              />
              {errors.email && (
                <p className="text-destructive text-sm">{errors.email}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="ops-password">Contraseña</Label>
              <PasswordInput
                id="ops-password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(errors.password)}
                disabled={login.isPending}
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

            <Button type="submit" className="mt-2" disabled={login.isPending}>
              {login.isPending ? "Ingresando…" : "Ingresar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
