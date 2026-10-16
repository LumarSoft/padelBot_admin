import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { PadelBall } from "@/components/ui/padel-ball";
import { waLink } from "@/lib/whatsapp";
import { formatPhone } from "../lib/chat-format";

/**
 * The right pane with no chat open — WhatsApp Web's welcome screen. When a deep link asked for
 * a number that has no chat yet (e.g. from Pagos), it says so and offers WhatsApp itself.
 */
export function ChatIntro({
  missingWaId,
  onBack,
}: {
  missingWaId?: string | null;
  /** Back to the list — only shown on a phone, where this pane replaces it. */
  onBack: () => void;
}) {
  return (
    <div className="bg-wa-bar border-wa-green relative flex flex-1 flex-col items-center justify-center gap-5 border-b-[6px] px-8 pb-16 text-center">
      {missingWaId && (
        <button
          type="button"
          onClick={onBack}
          className="text-wa-icon hover:bg-wa-hover absolute top-3 left-2 flex h-9 items-center gap-1.5 rounded-full px-3 text-sm transition-colors md:hidden"
        >
          <ArrowLeft className="size-5" />
          Chats
        </button>
      )}
      <div className="relative">
        <div className="bg-wa-green/12 flex size-32 items-center justify-center rounded-full">
          <WhatsAppIcon className="text-wa-green size-16" />
        </div>
        <PadelBall className="absolute -right-1 -bottom-1 size-11 drop-shadow-md" />
      </div>

      {missingWaId ? (
        <>
          <div className="max-w-md space-y-2">
            <h2 className="text-wa-text text-2xl font-light">
              Todavía no hay un chat con{" "}
              <span className="whitespace-nowrap">{formatPhone(missingWaId)}</span>
            </h2>
            <p className="text-wa-muted text-sm text-balance">
              Aparece acá cuando le escriba al WhatsApp del club. Si querés, escribile vos desde
              WhatsApp.
            </p>
          </div>
          <a
            href={waLink(missingWaId)}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-wa-green flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-95"
          >
            <ExternalLink className="size-4" />
            Abrir en WhatsApp
          </a>
        </>
      ) : (
        <div className="max-w-md space-y-2">
          <h2 className="text-wa-text text-[28px] font-light">WhatsApp del club</h2>
          <p className="text-wa-muted text-sm text-balance">
            Acá ves en vivo lo que el bot habla con los jugadores. Abrí un chat para leerlo, o tomá
            el control para responder vos.
          </p>
        </div>
      )}

      <p className="text-wa-muted absolute bottom-8 flex items-center gap-1.5 text-xs">
        <RefreshCw className="size-3" />
        Los chats se actualizan solos, no hace falta recargar.
      </p>
    </div>
  );
}
