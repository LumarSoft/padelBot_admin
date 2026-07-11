import type { SignupAnswers } from "@/features/signup/lib/questions";

/**
 * The signup is long enough that an accidental reload (or a phone killing the tab) would
 * otherwise throw away a lead we already earned. So it's kept as a draft on the visitor's
 * own device — never sent anywhere until they hit Enviar — and wiped the moment it is.
 *
 * `localStorage`, not `sessionStorage`: the point is to survive a closed tab, not just a
 * reload. The key is versioned so a change to the questions can't resurrect a draft whose
 * shape no longer matches.
 */
const KEY = "padelbot.signup.draft.v1";

/**
 * Drafts go stale. Somebody who abandoned this two weeks ago should meet a clean form, not
 * their half-forgotten answers — and their phone and email shouldn't sit in storage forever.
 */
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface Draft {
  answers: SignupAnswers;
  /** Screen they were on, so they land where they left. */
  index: number;
  savedAt: number;
}

export function loadDraft(): Draft | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;

    const draft = JSON.parse(raw) as Partial<Draft>;
    if (
      !draft.answers ||
      typeof draft.answers !== "object" ||
      typeof draft.index !== "number" ||
      typeof draft.savedAt !== "number"
    ) {
      clearDraft();
      return null;
    }

    if (Date.now() - draft.savedAt > TTL_MS) {
      clearDraft();
      return null;
    }

    return { answers: draft.answers, index: draft.index, savedAt: draft.savedAt };
  } catch {
    // Private mode, quota, corrupted JSON — a draft is a nicety, never a hard dependency.
    return null;
  }
}

export function saveDraft(answers: SignupAnswers, index: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ answers, index, savedAt: Date.now() } satisfies Draft),
    );
  } catch {
    // Ignore: storage full or blocked. The flow keeps working, it just won't survive a reload.
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing we can do, and nothing that should break the flow.
  }
}
