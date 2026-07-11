"use client";

import { useState, type FormEvent } from "react";
import { Check, Copy, KeyRound, Loader2, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuthStore } from "@/stores/auth-store";
import {
  useCreateUser,
  useResetUserPassword,
  useUpdateUser,
  useUsers,
} from "@/features/configuracion/hooks/use-users";
import type { ClubUser } from "@/types/api/users";

/** One-time temp password reveal with a copy button (it is never shown again). */
function TempPasswordNotice({ email, password }: { email: string; password: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-amber-500/10 flex flex-col gap-2 rounded-lg border border-amber-500/40 p-3 text-sm">
      <p>
        Contraseña temporal para <span className="font-medium">{email}</span> — pasásela por
        WhatsApp o en persona. <span className="font-medium">No se vuelve a mostrar.</span>
      </p>
      <div className="flex items-center gap-2">
        <code className="bg-background rounded border px-2 py-1 font-mono text-sm">
          {password}
        </code>
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copiada" : "Copiar"}
        </Button>
      </div>
    </div>
  );
}

function InviteUserDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);
  const createUser = useCreateUser();

  const canSubmit = email.includes("@") && !!name.trim() && !createUser.isPending;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    createUser.mutate(
      { email: email.trim(), name: name.trim(), role: "STAFF" },
      {
        onSuccess: (result) => {
          setCreated({ email: result.user.email, tempPassword: result.tempPassword });
          setEmail("");
          setName("");
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setCreated(null);
          setEmail("");
          setName("");
        }
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <Plus className="size-4" />
        Agregar usuario
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar usuario del equipo</DialogTitle>
          <DialogDescription>
            Se crea con una contraseña temporal que le pasás vos; al entrar puede cambiarla.
          </DialogDescription>
        </DialogHeader>
        {created ? (
          <div className="flex flex-col gap-4">
            <TempPasswordNotice email={created.email} password={created.tempPassword} />
            <DialogFooter>
              <Button type="button" onClick={() => setOpen(false)}>
                Listo
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-name">Nombre</Label>
              <Input
                id="user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="María López"
                maxLength={100}
                autoFocus
                disabled={createUser.isPending}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maria@club.com"
                disabled={createUser.isPending}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!canSubmit}>
                {createUser.isPending ? "Creando…" : "Crear usuario"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function TeamManager() {
  const usersQuery = useUsers();
  const updateUser = useUpdateUser();
  const resetPassword = useResetUserPassword();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [resetResult, setResetResult] = useState<{ email: string; tempPassword: string } | null>(
    null,
  );

  const users = usersQuery.data ?? [];

  function handleReset(user: ClubUser) {
    if (!window.confirm(`¿Generar una nueva contraseña temporal para ${user.name}?`)) return;
    resetPassword.mutate(user.id, {
      onSuccess: ({ tempPassword }) => {
        setResetResult({ email: user.email, tempPassword });
        toast.success("Contraseña reseteada");
      },
    });
  }

  if (usersQuery.isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-10 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando equipo…
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Equipo</h2>
          <p className="text-muted-foreground text-sm">
            Cada empleado entra con su propio usuario — nunca compartas tu contraseña.
          </p>
        </div>
        <InviteUserDialog />
      </div>

      {resetResult && (
        <TempPasswordNotice email={resetResult.email} password={resetResult.tempPassword} />
      )}

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin usuarios"
          description="Agregá a tu equipo para que cada uno entre con su propio usuario."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-40" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const isSelf = String(user.id) === currentUserId;
                return (
                  <TableRow key={user.id} className={user.isActive ? "" : "opacity-60"}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">
                          {user.name}
                          {isSelf && <span className="text-muted-foreground text-xs"> (vos)</span>}
                        </span>
                        <span className="text-muted-foreground text-xs">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === "OWNER" ? "default" : "secondary"}>
                        {user.role === "OWNER" ? "Dueño" : "Staff"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.isActive ? "Activo" : "Desactivado"}
                      {user.mustChangePassword && user.isActive && (
                        <span className="text-muted-foreground block text-xs">
                          contraseña temporal
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {!isSelf && (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Resetear contraseña de ${user.name}`}
                            title="Resetear contraseña"
                            onClick={() => handleReset(user)}
                            disabled={resetPassword.isPending}
                            className="text-muted-foreground hover:text-foreground size-8"
                          >
                            <KeyRound className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              updateUser.mutate({
                                id: user.id,
                                body: { isActive: !user.isActive },
                              })
                            }
                            disabled={updateUser.isPending}
                            className="text-muted-foreground hover:text-foreground h-8 px-2 text-xs"
                          >
                            {user.isActive ? "Desactivar" : "Activar"}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
