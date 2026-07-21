"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ConfirmOptions {
  title: string;
  /** What the owner is actually agreeing to — spell out anything irreversible. */
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "destructive" for anything that deletes, cancels or takes a court away from a player. */
  tone?: "default" | "destructive";
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * App-wide confirmation dialog. `window.confirm` blocks the main thread with an unstyled
 * browser modal that ignores the panel's design (and is silently suppressed in some
 * embedded webviews), so every "¿seguro?" in the panel goes through this instead: same
 * promise-shaped call site, real dialog.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [open, setOpen] = useState(false);
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((next) => {
    setOptions(next);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  // The options outlive the close so the dialog doesn't go blank mid exit-animation.
  function settle(confirmed: boolean) {
    resolverRef.current?.(confirmed);
    resolverRef.current = null;
    setOpen(false);
  }

  const destructive = options?.tone === "destructive";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          // Escape / backdrop / the X: same as saying no.
          if (!next) settle(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full",
                  destructive
                    ? "bg-destructive/10 text-destructive"
                    : "bg-brand/10 text-brand",
                )}
              >
                <AlertTriangle className="size-4" />
              </span>
              <div className="flex min-w-0 flex-col gap-1.5">
                <DialogTitle>{options?.title}</DialogTitle>
                {options?.description && (
                  <DialogDescription>{options.description}</DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => settle(false)}>
              {options?.cancelLabel ?? "Volver"}
            </Button>
            <Button
              variant={destructive ? "destructive" : "brand"}
              onClick={() => settle(true)}
              autoFocus
            >
              {options?.confirmLabel ?? "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

/**
 * Asks the user to confirm an action. Resolves true when they go ahead:
 *
 * ```ts
 * const confirm = useConfirm();
 * if (await confirm({ title: "¿Eliminar la cancha?", tone: "destructive" })) remove();
 * ```
 */
export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error("useConfirm debe usarse dentro de <ConfirmProvider>");
  }
  return confirm;
}
