"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateImprovementSuggestion } from "@/features/improvements/hooks/use-improvements";

const TITLE_MIN = 3;
const TITLE_MAX = 120;
const BODY_MIN = 10;
const BODY_MAX = 2000;

/** "Proponé una mejora": goes straight to Lumarsoft. */
export function SuggestionForm() {
  const create = useCreateImprovementSuggestion();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const valid = title.trim().length >= TITLE_MIN && body.trim().length >= BODY_MIN;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!valid) return;
    create.mutate(
      { title: title.trim(), body: body.trim() },
      {
        onSuccess: () => {
          setTitle("");
          setBody("");
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="suggestion-title">¿Qué te gustaría que haga GTP?</Label>
        <Input
          id="suggestion-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={TITLE_MAX}
          placeholder="Ej: Exportar las reservas a Excel"
          disabled={create.isPending}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="suggestion-body">Contanos un poco más</Label>
        <Textarea
          id="suggestion-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={BODY_MAX}
          placeholder="Para qué lo usarías, qué hacés hoy en su lugar…"
          disabled={create.isPending}
        />
      </div>
      <Button type="submit" variant="brand" disabled={!valid || create.isPending} className="self-end">
        {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Enviar propuesta
      </Button>
    </form>
  );
}
