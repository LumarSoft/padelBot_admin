"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { useLogin } from "@/features/auth/hooks/use-login";

const loginSchema = z.object({
  email: z.email("Ingresá un email válido."),
  password: z.string().min(1, "La contraseña es obligatoria."),
});

type FieldErrors = Partial<Record<"email" | "password", string>>;

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const login = useLogin();

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
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
    <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-6 duration-500 ease-out">
      <div className="flex flex-col items-center gap-3 text-center">
        <Logo showWordmark={false} className="[&>span]:size-9" />
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">
            Ingresá a PadelBot
          </h1>
          <p className="text-muted-foreground text-sm">
            Panel de administración de tu club.
          </p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
            noValidate
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="staff@club.com"
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
              <Label htmlFor="password">Contraseña</Label>
              <PasswordInput
                id="password"
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

            <Button type="submit" className="mt-2" disabled={login.isPending}>
              {login.isPending ? "Ingresando…" : "Ingresar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-center text-sm">
        ¿Todavía no tenés cuenta?{" "}
        <Link href="/register" className="text-foreground font-medium underline underline-offset-2">
          Creá tu club gratis
        </Link>
      </p>
    </div>
  );
}
