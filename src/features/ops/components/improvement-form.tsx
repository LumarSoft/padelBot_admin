"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IMPROVEMENT_STATUS, IMPROVEMENT_STATUSES } from "@/features/improvements/lib/labels";
import type { ImprovementStatus, SaveImprovementPayload } from "@/types/api/improvements";

const TITLE_MAX = 120;
const BODY_MAX = 5000;

interface ImprovementFormProps {
  initial?: { title: string; body: string; status: ImprovementStatus };
  /** Whether it's already published: then there's one "Guardar" and no draft button. */
  published?: boolean;
  pending: boolean;
  onSubmit: (payload: SaveImprovementPayload) => void;
  onCancel?: () => void;
}

/** Title, text and status of an improvement we post. Creating offers "draft" or "publish". */
export function ImprovementForm({
  initial,
  published = false,
  pending,
  onSubmit,
  onCancel,
}: ImprovementFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [status, setStatus] = useState<ImprovementStatus>(initial?.status ?? "RELEASED");
  const valid = title.trim().length >= 3 && body.trim().length > 0;

  function submit(publish: boolean | undefined): void {
    if (!valid) return;
    onSubmit({ title: title.trim(), body: body.trim(), status, published: publish });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    submit(published ? undefined : true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="improvement-title">Título</Label>
          <Input
            id="improvement-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={TITLE_MAX}
            placeholder="Ej: Torneos y peñas"
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="improvement-status">Estado</Label>
          <select
            id="improvement-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ImprovementStatus)}
            disabled={pending}
            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
          >
            {IMPROVEMENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {IMPROVEMENT_STATUS[value].label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="improvement-body">Qué cambia para el club</Label>
        <Textarea
          id="improvement-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={BODY_MAX}
          placeholder="Lo que hace por el club, no cómo está hecho."
          disabled={pending}
        />
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
            Cancelar
          </Button>
        )}
        {!published && (
          <Button
            type="button"
            variant="outline"
            onClick={() => submit(initial ? undefined : false)}
            disabled={!valid || pending}
          >
            Guardar borrador
          </Button>
        )}
        <Button type="submit" variant="brand" disabled={!valid || pending}>
          {published ? "Guardar" : "Publicar"}
        </Button>
      </div>
    </form>
  );
}
