"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, RotateCw, TriangleAlert } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { LUMARSOFT } from "@/lib/contact";
import { logger } from "@/lib/logger";
import { waLink } from "@/lib/whatsapp";

/**
 * A panel screen that broke while rendering: the sidebar and header stay usable, and this
 * offers to try again (which re-fetches the screen), to go back to the Resumen, or to tell
 * Lumarsoft with the screen and the error's code already written.
 */
export default function PanelError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const pathname = usePathname();
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    logger.error("panel", error.message, { digest: error.digest, pathname });
  }, [error, pathname]);

  const report = waLink(
    LUMARSOFT.whatsapp,
    `Hola Lumarsoft, en el panel de GTP me aparece un error en ${pathname}${
      error.digest ? ` (código ${error.digest})` : ""
    }.`,
  );

  return (
    <div className="animate-fade-up flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400">
        <TriangleAlert className="size-7" />
      </div>
      <div className="max-w-md space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight">Algo falló al cargar esta pantalla</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Puede ser la conexión o un error nuestro. Probá de nuevo; si sigue pasando, avisanos y
          lo miramos.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="brand"
          size="lg"
          onClick={() => {
            setRetrying(true);
            unstable_retry();
          }}
          disabled={retrying}
        >
          {retrying ? <Loader2 className="animate-spin" /> : <RotateCw />}
          Reintentar
        </Button>
        <Link href="/panel" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Ir al resumen
        </Link>
        <WhatsAppLink href={report} className="h-9 py-0">
          Avisar a Lumarsoft
        </WhatsAppLink>
      </div>
      {error.digest && (
        <p className="text-muted-foreground font-mono text-[11px]">Código: {error.digest}</p>
      )}
    </div>
  );
}
