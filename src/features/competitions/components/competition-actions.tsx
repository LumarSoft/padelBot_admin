"use client";

import { useRouter } from "next/navigation";
import { Ban, CheckCircle2, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  useCancelCompetition,
  useDeleteCompetition,
  useUpdateCompetition,
} from "@/features/competitions/hooks/use-competitions";
import { KIND_LABEL } from "@/features/competitions/lib/labels";
import type { CompetitionDetail } from "@/types/api/competitions";

/** Finish / reopen, cancel (frees the courts) and delete. */
export function CompetitionActions({ competition }: { competition: CompetitionDetail }) {
  const router = useRouter();
  const confirm = useConfirm();
  const update = useUpdateCompetition(competition.id);
  const cancel = useCancelCompetition(competition.id);
  const remove = useDeleteCompetition(competition.id);
  const label = KIND_LABEL[competition.kind];
  const article = competition.kind === "PENA" ? "la" : "el";

  async function handleCancel() {
    const ok = await confirm({
      title: `¿Cancelar ${article} ${label.one.toLowerCase()}?`,
      description: "Sus turnos vuelven a estar libres en la agenda. Las parejas y resultados quedan guardados.",
      confirmLabel: `Cancelar ${article} ${label.one.toLowerCase()}`,
      cancelLabel: "No, volver",
      tone: "destructive",
    });
    if (ok) cancel.mutate();
  }

  async function handleDelete() {
    const ok = await confirm({
      title: `¿Eliminar ${article} ${label.one.toLowerCase()}?`,
      description: "Se borra con sus parejas, pagos y resultados, y sus turnos quedan libres. No se puede deshacer.",
      confirmLabel: "Eliminar",
      cancelLabel: "No, volver",
      tone: "destructive",
    });
    if (ok) remove.mutate(undefined, { onSuccess: () => router.push(label.path) });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {competition.status === "FINISHED" ? (
        <Button variant="outline" onClick={() => update.mutate({ status: "IN_PROGRESS" })} disabled={update.isPending}>
          <RotateCcw className="size-4" />
          Reabrir
        </Button>
      ) : (
        competition.status !== "CANCELLED" && (
          <Button variant="outline" onClick={() => update.mutate({ status: "FINISHED" })} disabled={update.isPending}>
            <CheckCircle2 className="size-4" />
            Finalizar
          </Button>
        )
      )}
      {competition.status !== "CANCELLED" && (
        <Button variant="ghost" onClick={handleCancel} disabled={cancel.isPending}>
          <Ban className="size-4" />
          Cancelar
        </Button>
      )}
      <Button variant="ghost" onClick={handleDelete} disabled={remove.isPending} aria-label="Eliminar">
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
