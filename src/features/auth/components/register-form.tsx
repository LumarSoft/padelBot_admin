"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/api-error";
import { lumarsoftWhatsApp, LUMARSOFT } from "@/lib/contact";

const requestSchema = z.object({
  clubName: z.string().min(2, "El nombre del club es muy corto.").max(80),
  ownerName: z.string().min(1, "Ingresá tu nombre.").max(100),
  email: z.email("Ingresá un email válido."),
  phone: z.string().min(6, "Ingresá un teléfono/WhatsApp válido.").max(30),
});

type Field = "clubName" | "ownerName" | "email" | "phone";
type FieldErrors = Partial<Record<Field, string>>;

/**
 * Managed signup: the club is provisioned by Lumarsoft (we configure MercadoPago
 * and the WhatsApp line), so this form captures the request instead of creating
 * the club directly.
 */
export function RegisterForm() {
  const [clubName, setClubName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sent, setSent] = useState(false);

  const requestClub = useMutation({
    mutationFn: (body: {
      clubName: string;
      ownerName: string;
      email: string;
      phone: string;
      message?: string;
    }) => apiClient.post<{ received: boolean }>("/api/onboarding/request", body),
    onSuccess: () => setSent(true),
    onError: (error: Error) =>
      toast.error(
        error instanceof ApiError ? error.message : "No pudimos enviar la solicitud. Intentá de nuevo.",
      ),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const result = requestSchema.safeParse({ clubName, ownerName, email, phone });

    if (!result.success) {
      const flattened = z.flattenError(result.error).fieldErrors;
      setErrors({
        clubName: flattened.clubName?.[0],
        ownerName: flattened.ownerName?.[0],
        email: flattened.email?.[0],
        phone: flattened.phone?.[0],
      });
      return;
    }

    setErrors({});
    requestClub.mutate({ ...result.data, ...(message.trim() ? { message: message.trim() } : {}) });
  }

  if (sent) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-6 duration-500 ease-out">
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="size-10 text-emerald-600" />
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">¡Solicitud recibida!</h1>
            <p className="text-muted-foreground text-sm">
              Te escribimos en el día para dejar tu club funcionando: nosotros configuramos
              MercadoPago y la línea de WhatsApp por vos, y arrancás con 14 días gratis.
            </p>
          </div>
        </div>
        <WhatsAppLink
          href={lumarsoftWhatsApp("hire")}
          className="px-4 py-2.5"
        >
          ¿Apurado? Escribinos ya por WhatsApp
        </WhatsAppLink>
        <p className="text-muted-foreground text-center text-xs">{LUMARSOFT.whatsappDisplay}</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-6 duration-500 ease-out">
      <div className="flex flex-col items-center gap-3 text-center">
        <Logo showWordmark={false} className="[&>span]:size-9" />
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Pedí tu club en PadelBot</h1>
          <p className="text-muted-foreground text-sm">
            Dejanos tus datos y lo dejamos andando nosotros: configuramos MercadoPago y el
            WhatsApp por vos. 14 días de prueba gratis, sin tarjeta.
          </p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-2">
              <Label htmlFor="req-club">Nombre del complejo</Label>
              <Input
                id="req-club"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="Pádel Center Rosario"
                maxLength={80}
                aria-invalid={Boolean(errors.clubName)}
                disabled={requestClub.isPending}
                autoFocus
              />
              {errors.clubName && <p className="text-destructive text-sm">{errors.clubName}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="req-name">Tu nombre</Label>
              <Input
                id="req-name"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Juan Pérez"
                maxLength={100}
                aria-invalid={Boolean(errors.ownerName)}
                disabled={requestClub.isPending}
              />
              {errors.ownerName && <p className="text-destructive text-sm">{errors.ownerName}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="req-email">Email</Label>
                <Input
                  id="req-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vos@tuclub.com"
                  aria-invalid={Boolean(errors.email)}
                  disabled={requestClub.isPending}
                />
                {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="req-phone">WhatsApp</Label>
                <Input
                  id="req-phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 9 341 555-5555"
                  aria-invalid={Boolean(errors.phone)}
                  disabled={requestClub.isPending}
                />
                {errors.phone && <p className="text-destructive text-sm">{errors.phone}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="req-message">Contanos de tu complejo (opcional)</Label>
              <textarea
                id="req-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                maxLength={1000}
                placeholder="Cuántas canchas tenés, horarios, si ya cobrás señas…"
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                disabled={requestClub.isPending}
              />
            </div>

            <Button type="submit" className="mt-2" disabled={requestClub.isPending}>
              {requestClub.isPending ? "Enviando…" : "Quiero mi club gratis"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-center text-sm">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-foreground font-medium underline underline-offset-2">
          Ingresá
        </Link>
      </p>
    </div>
  );
}
