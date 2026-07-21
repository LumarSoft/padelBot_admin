"use client";

import { useState, type FormEvent } from "react";
import { Copy, KeyRound, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StepLayout } from "@/features/setup/components/step-layout";
import { StepFooter } from "@/features/setup/components/step-footer";
import { useCreateUser, useUsers } from "@/features/configuracion/hooks/use-users";
import type { StepProps } from "@/features/setup/components/setup-wizard";
import type { CreateUserResponse } from "@/types/api/users";

/**
 * The API returns the temporary password EXACTLY once, at creation. If the owner navigates
 * away without copying it the only way out is a reset, so it gets its own card that stays
 * put until they dismiss it.
 */
function TempPasswordCard({ created }: { created: CreateUserResponse }) {
  return (
    <Card className="animate-fade-up border-brand/40 bg-brand/[0.06]">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start gap-2.5">
          <KeyRound className="text-brand mt-0.5 size-4 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium">
              Contraseña temporal de {created.user.name}
            </p>
            <p className="text-muted-foreground text-xs text-pretty">
              Pasásela ahora: no se vuelve a mostrar. Cuando entre por primera vez, el panel
              le va a pedir que la cambie.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <code className="bg-background/70 border-border/60 flex-1 truncate rounded-lg border px-3 py-2 font-mono text-sm">
            {created.tempPassword}
          </code>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Copiar la contraseña"
            onClick={() => {
              void navigator.clipboard.writeText(created.tempPassword);
              toast.success("Contraseña copiada");
            }}
          >
            <Copy className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function EquipoStep({ nav }: StepProps) {
  const usersQuery = useUsers();
  const createUser = useCreateUser();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [created, setCreated] = useState<CreateUserResponse | null>(null);

  const users = usersQuery.data ?? [];
  const canAdd =
    name.trim().length > 0 && email.trim().includes("@") && !createUser.isPending;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!canAdd) return;
    createUser.mutate(
      { name: name.trim(), email: email.trim().toLowerCase(), role: "STAFF" },
      {
        onSuccess: (response) => {
          setCreated(response);
          setName("");
          setEmail("");
        },
      },
    );
  }

  return (
    <StepLayout
      id="equipo"
      footer={
        <StepFooter
          nav={nav}
          skipLabel={users.length > 1 ? "Omitir por ahora" : "Trabajo solo"}
        />
      }
    >
      <div className="border-border/60 bg-card/40 rounded-xl border p-4">
        <p className="text-sm text-pretty">
          Cada persona con su usuario. Así nadie comparte tu contraseña, y en cada reserva
          queda registrado quién la cargó.
        </p>
      </div>

      {usersQuery.isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Cargando el equipo…
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((user) => (
            <Card key={user.id} size="sm">
              <CardContent className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                </div>
                <Badge variant={user.role === "OWNER" ? "default" : "secondary"}>
                  {user.role === "OWNER" ? "Dueño" : "Staff"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {created && <TempPasswordCard created={created} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="setup-user-name">Nombre</Label>
            <Input
              id="setup-user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Carla Gómez"
              maxLength={100}
              disabled={createUser.isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="setup-user-email">Email</Label>
            <Input
              id="setup-user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="carla@tuclub.com"
              disabled={createUser.isPending}
            />
          </div>
        </div>

        <div>
          <Button type="submit" variant="outline" disabled={!canAdd}>
            {createUser.isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Creando…
              </>
            ) : (
              <>
                <Plus />
                Agregar al equipo
              </>
            )}
          </Button>
          <p className="text-muted-foreground mt-2 text-xs">
            Le generamos una contraseña temporal que tenés que pasarle vos.
          </p>
        </div>
      </form>
    </StepLayout>
  );
}
