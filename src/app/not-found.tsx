import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

/** Any URL that doesn't exist (a typo, an old bookmark): in Spanish, with a way back. */
export default function NotFound() {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center gap-6 px-6 text-center">
      <div aria-hidden className="ambient-bg" />
      <Logo className="mb-2" />
      <p className="text-brand text-sm font-semibold tracking-wide">404</p>
      <div className="max-w-sm space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Esta página no existe</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Puede que el link esté mal escrito o que la sección se haya movido.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link href="/panel" className={buttonVariants({ variant: "brand", size: "lg" })}>
          Ir al panel
        </Link>
        <Link href="/" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
