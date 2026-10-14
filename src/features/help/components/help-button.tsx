"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, CircleHelp, Play, Search, SearchX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { HELP_ENTRIES } from "@/features/help/content/faq";
import type { TourId } from "@/features/help/content/tours";
import { normalize, searchHelp, type HelpItem } from "@/features/help/lib/search";
import { useTourStore } from "@/features/help/stores/tour-store";
import {
  useFirstDay,
  useHouseRules,
  useRecordSearchMiss,
} from "@/features/help/hooks/use-help";
import { FirstDayList, FirstDayProgress } from "@/features/help/components/first-day-list";

/** How long the search has to sit still before a no-result counts as a real miss. */
const MISS_DEBOUNCE_MS = 1200;

const BUILT_IN: HelpItem[] = HELP_ENTRIES.map((entry) => ({
  ...entry,
  keywords: entry.keywords ?? [],
  source: "gtp" as const,
}));

/**
 * The "?" in the panel header: a searchable list of real desk questions ("qué hago si…"),
 * answers of three lines at most, a "Mostrame" when the answer happens on a screen, and the
 * club's own house rules mixed in. `?` on the keyboard opens it too.
 */
export function HelpButton() {
  const [open, setOpen] = useState(false);
  const startTour = useTourStore((state) => state.start);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "?" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")) {
        return;
      }
      event.preventDefault();
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function show(tour: TourId) {
    setOpen(false);
    startTour(tour);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            data-help="ayuda"
            aria-label="Ayuda"
            title="Ayuda (tecla ?)"
          />
        }
      >
        <CircleHelp />
        <span className="hidden sm:inline">Ayuda</span>
      </DialogTrigger>
      <DialogContent className="gap-3 sm:max-w-lg">
        <HelpPanel onShow={show} />
      </DialogContent>
    </Dialog>
  );
}

function HelpPanel({ onShow }: { onShow: (tour: TourId) => void }) {
  const role = useAuthStore((state) => state.user?.role);
  const isStaff = role === "staff";
  const [query, setQuery] = useState("");
  // undefined = automatic (first result open while searching); null = all closed on purpose.
  const [openId, setOpenId] = useState<string | null | undefined>(undefined);

  const houseRulesQuery = useHouseRules();
  const firstDayQuery = useFirstDay(isStaff);
  const recordMiss = useRecordSearchMiss();
  const loggedMisses = useRef(new Set<string>());

  const items = useMemo<HelpItem[]>(() => {
    const rules: HelpItem[] = (houseRulesQuery.data ?? []).map((rule, index) => ({
      id: `club-${index}`,
      question: rule.question,
      answer: rule.answer.split(/\n+/).filter(Boolean),
      keywords: [],
      source: "club",
    }));
    return [...rules, ...BUILT_IN];
  }, [houseRulesQuery.data]);

  const searching = query.trim().length > 0;
  const result = useMemo(() => searchHelp(items, query), [items, query]);

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

  function handleQueryChange(value: string) {
    setQuery(value);
    setOpenId(undefined);
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
          placeholder="Ej: pagó en efectivo, llueve, un fijo no viene…"
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

        {searching && result.items.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 px-4 py-8 text-center">
            <SearchX className="text-muted-foreground/50 size-8" />
            <p className="text-sm font-medium">No encontré nada para «{query.trim()}».</p>
            <p className="text-muted-foreground text-xs text-pretty">
              Probá con otra palabra o preguntale al encargado. Ya nos llegó para sumarla.
            </p>
          </div>
        ) : (
          <section className="flex flex-col gap-1.5">
            {searching && !result.exact && (
              <p className="text-muted-foreground px-1 text-xs">
                No encontré exacto. Lo más parecido:
              </p>
            )}
            {result.items.map((item) => (
              <HelpQuestion
                key={item.id}
                item={item}
                open={effectiveOpenId === item.id}
                onToggle={() => setOpenId(effectiveOpenId === item.id ? null : item.id)}
                onShow={onShow}
              />
            ))}
          </section>
        )}
      </div>

      <p className="text-muted-foreground border-border/60 -mx-4 -mb-4 rounded-b-2xl border-t px-4 py-3 text-xs">
        {role === "owner" ? (
          <>
            ¿No está? Cargá tus propias respuestas en Configuración → Equipo, o{" "}
            <Link href="/soporte" className="text-foreground underline underline-offset-2">
              escribinos
            </Link>
            .
          </>
        ) : (
          "¿No está tu pregunta? Preguntale al encargado."
        )}
      </p>
    </>
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
