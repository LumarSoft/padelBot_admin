"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useClubProfile,
  useUpdateClubProfile,
} from "@/features/configuracion/hooks/use-transfer-config";

function ClubProfileForm({
  initialName,
  slug,
}: {
  initialName: string;
  slug: string;
}) {
  const updateProfile = useUpdateClubProfile();
  const [name, setName] = useState(initialName);

  const trimmed = name.trim();
  const valid = trimmed.length >= 2;
  const unchanged = trimmed === initialName;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!valid || unchanged) return;
    updateProfile.mutate({ name: trimmed });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border p-4 sm:max-w-md">
      <div className="flex flex-col gap-2">
        <Label htmlFor="club-name">Nombre del complejo</Label>
        <Input
          id="club-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          disabled={updateProfile.isPending}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="club-slug">Identificador</Label>
        <Input id="club-slug" value={slug} readOnly disabled className="opacity-70" />
        <p className="text-muted-foreground text-xs">
          El identificador no se modifica. Si lo necesitás cambiar, escribinos.
        </p>
      </div>
      <div>
        <Button type="submit" disabled={updateProfile.isPending || !valid || unchanged}>
          {updateProfile.isPending ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}

export function ClubProfileManager() {
  const profileQuery = useClubProfile();

  if (profileQuery.isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando datos del complejo…
      </div>
    );
  }

  const name = profileQuery.data?.name ?? "";
  const slug = profileQuery.data?.slug ?? "";

  return <ClubProfileForm key={`${name}|${slug}`} initialName={name} slug={slug} />;
}
