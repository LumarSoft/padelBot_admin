import type { ReactNode } from "react";

/**
 * WhatsApp's own formatting, which the bot uses all the time: *bold*, _italic_, ~strike~,
 * ```monospace``` — plus clickable links. A marker only counts when it hugs a word (no space
 * right inside it, no letter right outside), the way WhatsApp reads it, so "5 * 3" or a
 * snake_case name stay as typed. Built from React nodes, never HTML.
 */
const TOKEN = new RegExp(
  [
    "```([\\s\\S]+?)```",
    "(?<![\\p{L}\\p{N}*])\\*(?=\\S)([^*\\n]+?)(?<=\\S)\\*(?![\\p{L}\\p{N}*])",
    "(?<![\\p{L}\\p{N}_])_(?=\\S)([^_\\n]+?)(?<=\\S)_(?![\\p{L}\\p{N}_])",
    "(?<![\\p{L}\\p{N}~])~(?=\\S)([^~\\n]+?)(?<=\\S)~(?![\\p{L}\\p{N}~])",
    "(https?:\\/\\/[^\\s<]*[^\\s<.,:;\"')\\]!?¡¿])",
  ].join("|"),
  "gu",
);

/** Nesting depth we bother with (*_bold italic_* is the most WhatsApp allows in practice). */
const MAX_DEPTH = 3;

function format(text: string, depth: number, keyPrefix: string): ReactNode[] {
  if (depth > MAX_DEPTH) return [text];
  const nodes: ReactNode[] = [];
  let last = 0;
  let index = 0;

  for (const match of text.matchAll(TOKEN)) {
    const start = match.index ?? 0;
    if (start > last) nodes.push(text.slice(last, start));
    const key = `${keyPrefix}${index++}`;
    const [, mono, bold, italic, strike, url] = match;

    if (mono !== undefined) {
      nodes.push(
        <code key={key} className="font-mono text-[0.93em]">
          {mono}
        </code>,
      );
    } else if (bold !== undefined) {
      nodes.push(
        <strong key={key} className="font-semibold">
          {format(bold, depth + 1, `${key}.`)}
        </strong>,
      );
    } else if (italic !== undefined) {
      nodes.push(<em key={key}>{format(italic, depth + 1, `${key}.`)}</em>);
    } else if (strike !== undefined) {
      nodes.push(<del key={key}>{format(strike, depth + 1, `${key}.`)}</del>);
    } else if (url !== undefined) {
      nodes.push(
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-[#027eb5] hover:underline dark:text-[#53bdeb]"
        >
          {url}
        </a>,
      );
    }
    last = start + match[0].length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function WaText({ text }: { text: string }) {
  return <>{format(text, 0, "f")}</>;
}

/** The same text with the markers removed, for one-line previews (the chat list). */
export function stripWaMarkup(text: string): string {
  return text
    .replace(/```([\s\S]+?)```/g, "$1")
    .replace(TOKEN, (whole, mono, bold, italic, strike) => mono ?? bold ?? italic ?? strike ?? whole)
    .replace(/\s+/g, " ")
    .trim();
}
