"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, ChevronDown, CircleHelp, Play, Search, SearchX, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { lumarsoftHelpSearch } from "@/lib/contact";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { HELP_ENTRIES } from "@/features/help/content/faq";
import { NEWS, unseenNews, type NewsEntry } from "@/features/help/content/news";
import type { TourId } from "@/features/help/content/tours";
import { normalize, searchHelp, type HelpItem } from "@/features/help/lib/search";
import { useTourStore } from "@/features/help/stores/tour-store";
import {
  useFirstDay,
  useHouseRules,
  useMarkNewsSeen,
  useNewsSeen,
  useRecordSearchMiss,
} from "@/features/help/hooks/use-help";
import { FirstDayList, FirstDayProgress } from "@/features/help/components/first-day-list";
import { useFixedConfirmation } from "@/features/configuracion/hooks/use-fixed-confirmation";

/** How long the search has to sit still before a no-result counts as a real miss. */
const MISS_DEBOUNCE_MS = 1200;

const BUILT_IN: HelpItem[] = HELP_ENTRIES.map((entry) => ({
  ...entry,
  keywords: "keywords" in entry ? entry.keywords : [],
  source: "gtp" as const,
}));

const NEWS_DATE = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: "UTC" });

/**
 * The "?" in the panel header: a searchable list of real questions ("qué hago si…"), answers
 * of three lines at most, a "Mostrame" when the answer happens on a screen, and the club's own
 * house rules mixed in. `?` on the keyboard opens it too.
 *
 * The staff sees the desk questions. The owner sees "Novedades" first, then their own questions
 * and the desk ones below; a dot on the "?" says there's news they haven't opened yet.
 */
export function HelpButton() {
  const [open, setOpen] = useState(false);
  // The news that were new when the help opened: they keep their "Nuevo" while it stays open,
  // even though opening it already marked them as seen.
  const [freshIds, setFreshIds] = useState<ReadonlySet<string>>(new Set());
  const startTour = useTourStore((state) => state.start);
  const isOwner = useAuthStore((state) => state.user?.role) === "owner";
  const newsSeen = useNewsSeen(isOwner);
  const markNewsSeen = useMarkNewsSeen();

  const latestNewsId = NEWS[0]?.id;
  const hasUnseenNews =
    isOwner && newsSeen.isSuccess && !!latestNewsId && newsSeen.data.seenId !== latestNewsId;

  function handleOpenChange(next: boolean) {
    if (next && isOwner && newsSeen.isSuccess) {
      setFreshIds(new Set(unseenNews(newsSeen.data.seenId).map((entry) => entry.id)));
      if (hasUnseenNews) markNewsSeen.mutate(latestNewsId);
    }
    setOpen(next);
  }

  // Latest value for the keyboard shortcut, which is wired once.
  const openRef = useRef(handleOpenChange);
  useEffect(() => {
    openRef.current = handleOpenChange;
  });

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "?" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")) {
        return;
      }
      event.preventDefault();
      openRef.current(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function show(tour: TourId) {
    setOpen(false);
    startTour(tour);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            data-help="ayuda"
            aria-label={hasUnseenNews ? "Ayuda (hay novedades)" : "Ayuda"}
            title={hasUnseenNews ? "Ayuda · hay novedades (tecla ?)" : "Ayuda (tecla ?)"}
            className="relative"
          />
        }
      >
        <CircleHelp />
        <span className="hidden sm:inline">Ayuda</span>
        {hasUnseenNews && (
          <span
            aria-hidden
            className="bg-brand ring-background absolute -top-1 -right-1 size-2.5 rounded-full ring-2"
          />
        )}
      </DialogTrigger>
      <DialogContent className="gap-3 sm:max-w-lg">
        <HelpPanel onShow={show} freshNewsIds={freshIds} />
      </DialogContent>
    </Dialog>
  );
}

function HelpPanel({
  onShow,
  freshNewsIds,
}: {
  onShow: (tour: TourId) => void;
  freshNewsIds: ReadonlySet<string>;
}) {
  const user = useAuthStore((state) => state.user);
  const role = user?.role;
  const isStaff = role === "staff";
  const isOwner = role === "owner";
  const [query, setQuery] = useState("");
  // undefined = automatic (first result open while searching); null = all closed on purpose.
  const [openId, setOpenId] = useState<string | null | undefined>(undefined);

  const houseRulesQuery = useHouseRules();
  const firstDayQuery = useFirstDay(isStaff);
  const recordMiss = useRecordSearchMiss();
  const loggedMisses = useRef(new Set<string>());

  // The owner's own questions, then the desk ones (the club's house rules first among them).
  // Until the session is known, nothing owner-only shows.
  const { ownerItems, deskItems } = useMemo(() => {
    const rules: HelpItem[] = (houseRulesQuery.data ?? []).map((rule, index) => ({
      id: `club-${index}`,
      question: rule.question,
      answer: rule.answer.split(/\n+/).filter(Boolean),
      keywords: [],
      source: "club",
      audience: "all",
    }));
    return {
      ownerItems: isOwner ? BUILT_IN.filter((item) => item.audience === "owner") : [],
      deskItems: [
        ...rules,
        ...BUILT_IN.filter((item) => item.audience === "all" || (!isOwner && item.audience === "staff")),
      ],
    };
  }, [houseRulesQuery.data, isOwner]);

  const searching = query.trim().length > 0;
  // Ties keep this order, so the owner's own answers win over the desk ones.
  const result = useMemo(
    () => searchHelp([...ownerItems, ...deskItems], query),
    [ownerItems, deskItems, query],
  );

  // A search that sits still with no exact answer is a question the help is missing.
  useEffect(() => {
    const normalized = normalize(query);
    if (result.exact || normalized.length < 3 || loggedMisses.current.has(normalized)) return;
    const timer = setTimeout(() => {
      loggedMisses.current.add(normalized);
      recordMiss.mutate(query.trim());
    }, MISS_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // recordMiss is a stable mutation object; re-running on its state would re-log.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, result.exact]);

  const firstDay = firstDayQuery.data;
  const showFirstDay = isStaff && !searching && firstDay && !firstDay.complete;
  const effectiveOpenId =
    openId === undefined ? (searching ? (result.items[0]?.id ?? null) : null) : openId;
  // What the owner searched without an exact answer goes straight to us, with their club.
  const askUs = isOwner && searching && !result.exact;
  const askUsHref = askUs ? lumarsoftHelpSearch(query.trim(), user?.clubName) : undefined;

  function handleQueryChange(value: string) {
    setQuery(value);
    setOpenId(undefined);
  }

  function renderQuestions(items: HelpItem[]) {
    return items.map((item) => (
      <HelpQuestion
        key={item.id}
        item={item}
        open={effectiveOpenId === item.id}
        onToggle={() => setOpenId(effectiveOpenId === item.id ? null : item.id)}
        onShow={onShow}
      />
    ));
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <CircleHelp className="text-brand size-5" />
          Ayuda
        </DialogTitle>
        <DialogDescription>Buscá lo que te pasa. Respuestas cortas.</DialogDescription>
      </DialogHeader>

      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          placeholder={
            isOwner
              ? "Ej: subir precios, alias, empleado nuevo, llueve…"
              : "Ej: pagó en efectivo, llueve, un fijo no viene…"
          }
          aria-label="Buscar en la ayuda"
          maxLength={120}
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 bg-foreground/[0.03] h-10 w-full rounded-lg border pr-9 pl-9 text-base outline-none focus-visible:ring-3 md:text-sm [&::-webkit-search-cancel-button]:hidden"
        />
        {searching && (
          <button
            type="button"
            onClick={() => handleQueryChange("")}
            aria-label="Borrar la búsqueda"
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="-mx-1 flex max-h-[min(60vh,32rem)] flex-col gap-4 overflow-y-auto px-1 pb-1">
        {showFirstDay && (
          <section className="bg-brand/[0.05] ring-brand/15 flex flex-col gap-2 rounded-xl p-3 ring-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Tu primer día</p>
              <span className="text-muted-foreground text-xs tabular-nums">
                {firstDay.doneCount} de {firstDay.total}
              </span>
            </div>
            <FirstDayProgress status={firstDay} />
            <FirstDayList status={firstDay} onShow={onShow} />
          </section>
        )}

        {isOwner && !searching && NEWS.length > 0 && (
          <NewsSection freshIds={freshNewsIds} onShow={onShow} />
        )}

        {searching ? (
          result.items.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 px-4 py-8 text-center">
              <SearchX className="text-muted-foreground/50 size-8" />
              <p className="text-sm font-medium">No encontré nada para «{query.trim()}».</p>
              {askUsHref ? (
                <>
                  <p className="text-muted-foreground text-xs text-pretty">
                    Escribinos y te respondemos por WhatsApp. Ya nos llegó para sumarla.
                  </p>
                  <WhatsAppLink href={askUsHref} className="mt-2">
                    Preguntarle a Lumarsoft
                  </WhatsAppLink>
                </>
              ) : (
                <p className="text-muted-foreground text-xs text-pretty">
                  Probá con otra palabra o preguntale al encargado. Ya nos llegó para sumarla.
                </p>
              )}
            </div>
          ) : (
            <section className="flex flex-col gap-1.5">
              {!result.exact && (
                <p className="text-muted-foreground px-1 text-xs">
                  No encontré exacto. Lo más parecido:
                </p>
              )}
              {renderQuestions(result.items)}
            </section>
          )
        ) : isOwner ? (
          <>
            <HelpSection title="Para el dueño">{renderQuestions(ownerItems)}</HelpSection>
            <HelpSection title="Recepción">{renderQuestions(deskItems)}</HelpSection>
          </>
        ) : (
          <section className="flex flex-col gap-1.5">{renderQuestions(deskItems)}</section>
        )}
      </div>

      <p className="text-muted-foreground border-border/60 -mx-4 -mb-4 rounded-b-2xl border-t px-4 py-3 text-xs">
        {isOwner ? (
          <>
            ¿No está? Cargá tus propias respuestas en Configuración → Equipo, o{" "}
            {askUsHref ? (
              <a
                href={askUsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2"
              >
                escribinos por WhatsApp
              </a>
            ) : (
              <Link href="/soporte" className="text-foreground underline underline-offset-2">
                escribinos
              </Link>
            )}
            .
          </>
        ) : (
          "¿No está tu pregunta? Preguntale al encargado."
        )}
      </p>
    </>
  );
}

function HelpSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-muted-foreground px-1 text-[11px] font-medium tracking-wide uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

/**
 * "Novedades" for the owner: open when something is new since they last looked, folded into
 * one line otherwise so their questions stay on top.
 */
function NewsSection({
  freshIds,
  onShow,
}: {
  freshIds: ReadonlySet<string>;
  onShow: (tour: TourId) => void;
}) {
  const [expanded, setExpanded] = useState(freshIds.size > 0);

  return (
    <section className="bg-brand/[0.05] ring-brand/15 flex flex-col gap-2 rounded-xl p-3 ring-1">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex items-center gap-2 text-left text-sm font-medium"
      >
        <Sparkles className="text-brand size-4 shrink-0" />
        <span className="flex-1">Novedades</span>
        {freshIds.size > 0 && (
          <span className="bg-brand rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums">
            {freshIds.size} {freshIds.size === 1 ? "nueva" : "nuevas"}
          </span>
        )}
        <ChevronDown
          className={cn(
            "text-muted-foreground size-4 shrink-0 transition-transform duration-200",
            expanded && "rotate-180",
          )}
        />
      </button>
      {expanded && (
        <ul className="animate-fade-up flex flex-col">
          {NEWS.map((entry) => (
            <NewsItem key={entry.id} entry={entry} fresh={freshIds.has(entry.id)} onShow={onShow} />
          ))}
        </ul>
      )}
    </section>
  );
}

function NewsItem({
  entry,
  fresh,
  onShow,
}: {
  entry: NewsEntry;
  fresh: boolean;
  onShow: (tour: TourId) => void;
}) {
  const fixedConfirmation = useFixedConfirmation();
  const alreadyOn = entry.activeWhen === "fixedConfirmation" && fixedConfirmation.data?.enabled === true;

  return (
    <li className="border-brand/10 flex flex-col gap-1.5 border-t py-2.5 first:border-t-0 first:pt-1 last:pb-0">
      <div className="flex items-baseline gap-2">
        <p className="min-w-0 flex-1 text-sm font-medium text-pretty">{entry.title}</p>
        {fresh && (
          <span className="bg-brand/15 text-brand shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium">
            Nuevo
          </span>
        )}
        <time dateTime={entry.date} className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
          {NEWS_DATE.format(new Date(entry.date))}
        </time>
      </div>
      <p className="text-muted-foreground text-xs text-pretty">{entry.line}</p>
      <div>
        {alreadyOn ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-500">
            <Check className="size-3.5" />
            Ya la tenés activada
          </span>
        ) : (
          <Button
            type="button"
            variant={entry.action.label === "Activar" ? "brand" : "outline"}
            size="xs"
            onClick={() => onShow(entry.action.tour)}
          >
            <Play />
            {entry.action.label}
          </Button>
        )}
      </div>
    </li>
  );
}

function HelpQuestion({
  item,
  open,
  onToggle,
  onShow,
}: {
  item: HelpItem;
  open: boolean;
  onToggle: () => void;
  onShow: (tour: TourId) => void;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border transition-colors duration-200",
        open ? "border-brand/30 bg-card" : "border-border/70 hover:border-border",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium"
      >
        <span className="min-w-0 flex-1">{item.question}</span>
        {item.source === "club" && (
          <span className="bg-brand/10 text-brand shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium">
            Del club
          </span>
        )}
        <ChevronDown
          className={cn(
            "text-muted-foreground size-4 shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="animate-fade-up flex flex-col gap-2.5 px-3 pb-3">
          <ul className="flex flex-col gap-1 text-sm">
            {item.answer.map((line) => (
              <li key={line} className="text-foreground/90 text-pretty">
                {line}
              </li>
            ))}
          </ul>
          {item.tour && (
            <div>
              <Button type="button" variant="brand" size="sm" onClick={() => onShow(item.tour!)}>
                <Play />
                Mostrame
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
