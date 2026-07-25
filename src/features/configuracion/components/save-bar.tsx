import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SaveBarProps {
  pending: boolean;
  /** True while the form still matches what's saved. */
  unchanged: boolean;
  /** Extra reasons to block the save (invalid fields). */
  disabled?: boolean;
  label?: string;
  /** Replaces the default "hay cambios sin guardar" line. */
  note?: string;
  /** For editors that aren't a `<form>`: makes the button a plain button. */
  onSave?: () => void;
}

/**
 * Submit footer for the settings forms whose fields are spread across several cards: a
 * button tucked under one card would read as if it only saved that card. Sticks to the
 * bottom of the viewport so the action stays reachable on a long form — hence `.save-bar`
 * (globals.css), which makes it near-opaque so the fields it scrolls over don't show
 * through the label and the button.
 */
export function SaveBar({
  pending,
  unchanged,
  disabled = false,
  label = "Guardar cambios",
  note,
  onSave,
}: SaveBarProps) {
  return (
    <Card size="sm" className="save-bar sticky bottom-4 z-10 py-0 ring-foreground/15">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
        <p className="text-muted-foreground text-sm">
          {unchanged ? "No hay cambios sin guardar." : (note ?? "Tenés cambios sin guardar.")}
        </p>
        <Button
          type={onSave ? "button" : "submit"}
          onClick={onSave}
          disabled={pending || unchanged || disabled}
        >
          {pending ? "Guardando…" : label}
        </Button>
      </CardContent>
    </Card>
  );
}
