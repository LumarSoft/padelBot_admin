"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUpdateLead } from "@/features/ops/hooks/use-ops";
import type { Lead } from "@/types/api/ops";

/** Our sales file on the lead — never shown to the prospect. */
export function LeadNotes({ lead }: { lead: Lead }) {
  const [notes, setNotes] = useState(lead.internalNotes ?? "");
  const updateLead = useUpdateLead();

  // The textarea is a local draft; "dirty" is just it differing from what the server has.
  // No effect syncing the two: saving refetches the lead, the prop comes back with the new
  // value, and the draft stops being dirty on its own.
  const dirty = notes !== (lead.internalNotes ?? "");

  return (
    <div className="space-y-2">
      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Notas internas: qué te dijo, cuándo volver a llamarlo…"
        rows={2}
        maxLength={4000}
        className="border-border/60 bg-card/50 focus-visible:ring-ring/50 w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
      />
      {dirty && (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() =>
              updateLead.mutate({
                id: lead.id,
                payload: { internalNotes: notes },
              })
            }
            disabled={updateLead.isPending}
          >
            {updateLead.isPending ? "Guardando…" : "Guardar nota"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setNotes(lead.internalNotes ?? "")}
            disabled={updateLead.isPending}
          >
            Descartar
          </Button>
        </div>
      )}
    </div>
  );
}
