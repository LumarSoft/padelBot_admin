import type { HelpAudience } from "@/features/help/content/faq";
import type { TourId } from "@/features/help/content/tours";

/** One answer the help can show: built-in (content/faq.ts) or the club's own house rule. */
export interface HelpItem {
  id: string;
  question: string;
  answer: readonly string[];
  keywords: readonly string[];
  tour?: TourId;
  /** "club" = a house rule the owner wrote. */
  source: "gtp" | "club";
  /** Who sees it (house rules are for everyone). */
  audience: HelpAudience;
}

/** Words that say nothing about what the person is looking for. */
const STOPWORDS = new Set([
  "a", "al", "como", "con", "cual", "cuales", "de", "del", "donde", "el", "en", "es", "hago",
  "hay", "la", "las", "le", "lo", "los", "me", "mi", "no", "o", "para", "por", "que", "se",
  "si", "su", "un", "una", "y", "ya",
]);

/**
 * Same folding as the API's (`api/src/help/lib/search-query.ts`), so a miss logged there reads
 * exactly like what was searched here: lowercase, no accents or punctuation, single spaces.
 */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(query: string): string[] {
  return normalize(query)
    .split(" ")
    .filter((word) => word && !STOPWORDS.has(word));
}

/**
 * A query word matches a text word that starts with it, that shares its stem ("cobro" finds
 * "cobrar", "transferencia" finds "transferi"), or that is the start of it ("fiar" finds "fía").
 * Stems need four letters and text words three, so "pa" or "con" don't match everything.
 */
function matchesWord(token: string, words: string[]): boolean {
  const stem = token.length > 5 ? token.slice(0, Math.max(4, token.length - 3)) : token;
  return words.some(
    (word) =>
      word.startsWith(token) ||
      (stem.length >= 4 && word.startsWith(stem)) ||
      (word.length >= 3 && !STOPWORDS.has(word) && token.startsWith(word)),
  );
}

interface Indexed {
  item: HelpItem;
  question: string[];
  keywords: string[];
  answer: string[];
}

function index(item: HelpItem): Indexed {
  return {
    item,
    question: normalize(item.question).split(" "),
    keywords: normalize(item.keywords.join(" ")).split(" "),
    answer: normalize(item.answer.join(" ")).split(" "),
  };
}

export interface HelpSearchResult {
  items: HelpItem[];
  /** True when every searched word matched — false means "lo más parecido" (or nothing). */
  exact: boolean;
}

/**
 * Ranks the help for a query. Every word must match somewhere for an exact hit (question
 * weighs most, then keywords, then the answer). When nothing matches every word, it falls back
 * to the entries that match most of them, so the person still gets something to try.
 */
export function searchHelp(items: HelpItem[], query: string): HelpSearchResult {
  const words = tokens(query);
  if (words.length === 0) return { items, exact: true };

  const scored = items.map(index).map((entry) => {
    let matched = 0;
    let score = 0;
    for (const word of words) {
      const inQuestion = matchesWord(word, entry.question);
      const inKeywords = matchesWord(word, entry.keywords);
      const inAnswer = matchesWord(word, entry.answer);
      if (inQuestion || inKeywords || inAnswer) matched += 1;
      score += (inQuestion ? 3 : 0) + (inKeywords ? 2 : 0) + (inAnswer ? 1 : 0);
    }
    return { item: entry.item, matched, score };
  });

  const byScore = (a: { score: number }, b: { score: number }) => b.score - a.score;
  const exact = scored.filter((s) => s.matched === words.length).sort(byScore);
  if (exact.length > 0) return { items: exact.map((s) => s.item), exact: true };

  const needed = Math.ceil(words.length / 2);
  const partial = scored
    .filter((s) => s.matched >= needed)
    .sort((a, b) => b.matched - a.matched || byScore(a, b))
    .slice(0, 5);
  return { items: partial.map((s) => s.item), exact: false };
}
