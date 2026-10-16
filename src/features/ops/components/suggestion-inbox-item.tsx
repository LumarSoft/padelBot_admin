"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/features/improvements/components/status-pill";
import { SUGGESTION_STATUS, formatDate } from "@/features/improvements/lib/labels";
import { useUpdateImprovementSuggestion } from "@/features/ops/hooks/use-ops";
import type {
  ImprovementSuggestionStatus,
  OpsImprovement,
  OpsImprovementSuggestion,
} from "@/types/api/improvements";

const STATUSES: ImprovementSuggestionStatus[] = [
  "NEW",
  "UNDER_REVIEW",
  "PLANNED",
  "DONE",
  "DECLINED",
];

/** Ops-side names: what it means to us, not what the club reads. */
const OPS_STATUS_LABEL: Record<ImprovementSuggestionStatus, string> = {
  NEW: "Nueva",
  UNDER_REVIEW: "Viendo",
  PLANNED: "Planeada",
  DONE: "Hecha",
  DECLINED: "Descartada",
};

/** One club suggestion: change its status, answer it, link it to a posted improvement. */
export function SuggestionInboxItem({
  suggestion,
  improvements,
}: {
  suggestion: OpsImprovementSuggestion;
  improvements: OpsImprovement[];
}) {
  const update = useUpdateImprovementSuggestion();
  const [reply, setReply] = useState(suggestion.opsReply ?? "");
  const replyChanged = reply.trim() !== (suggestion.opsReply ?? "");
  const status = SUGGESTION_STATUS[suggestion.status];

  function save(payload: Parameters<typeof update.mutate>[0]["payload"]): void {
    update.mutate({ id: suggestion.id, payload });
  }

  return (
    <li className="border-border/70 flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{suggestion.title}</p>
          <p className="text-muted-foreground text-xs">
            {suggestion.clubName}
            {suggestion.authorName && ` · ${suggestion.authorName}`}
            {suggestion.authorEmail && ` (${suggestion.authorEmail})`} ·{" "}
            {formatDate(suggestion.createdAt)}
          </p>
        </div>
        <StatusPill label={`El club ve: ${status.label}`} tone={status.tone} />
      </div>

      <p className="text-sm whitespace-pre-line">{suggestion.body}</p>

      <div className="flex flex-wrap gap-1.5">
        {STATUSES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => save({ status: value })}
            disabled={update.isPending || value === suggestion.status}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              value === suggestion.status
                ? "border-brand bg-brand/10 text-foreground font-medium"
                : "border-border/70 text-muted-foreground hover:text-foreground hover:border-border",
            )}
          >
            {OPS_STATUS_LABEL[value]}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="Respuesta para el club (la ve en Mejoras)"
          disabled={update.isPending}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <select
            aria-label="Mejora relacionada"
            value={suggestion.improvement?.id ?? ""}
            onChange={(e) => save({ improvementId: e.target.value || null })}
            disabled={update.isPending}
            className="border-input bg-background h-8 max-w-full rounded-md border px-2 text-xs"
          >
            <option value="">Sin mejora relacionada</option>
            {improvements.map((improvement) => (
              <option key={improvement.id} value={improvement.id}>
                {improvement.title}
                {improvement.publishedAt ? "" : " (borrador)"}
              </option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => save({ opsReply: reply.trim() || null })}
            disabled={!replyChanged || update.isPending}
          >
            {suggestion.opsReply ? "Actualizar respuesta" : "Responder"}
          </Button>
        </div>
      </div>
    </li>
  );
}
