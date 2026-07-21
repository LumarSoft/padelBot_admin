import type { ChapterId } from "@/features/signup/lib/questions";

/**
 * Each act of the signup gets its own light. The backdrop's glows drift to new positions
 * and cross-fade to a new palette as the prospect moves through the flow, so the room
 * visibly changes around them instead of being a static wallpaper behind a form.
 *
 * Positions are percentages of the viewport; the colours stay inside the brand's family
 * (indigo → court teal → money green → violet → warm close) so it reads as one journey.
 */
export interface ChapterMood {
  /** Shown next to the progress bar so they always know where they are. */
  label: string;
  glows: { color: string; x: number; y: number; scale: number }[];
}

export const CHAPTER_MOODS: Record<ChapterId, ChapterMood> = {
  complejo: {
    label: "Tu complejo",
    glows: [
      { color: "oklch(0.55 0.20 264)", x: 12, y: 8, scale: 1 },
      { color: "oklch(0.72 0.13 200)", x: 88, y: 22, scale: 0.85 },
      { color: "oklch(0.60 0.16 280)", x: 50, y: 96, scale: 1.1 },
    ],
  },
  canchas: {
    label: "Tus canchas",
    glows: [
      { color: "oklch(0.62 0.15 195)", x: 82, y: 10, scale: 1.15 },
      { color: "oklch(0.60 0.16 165)", x: 8, y: 40, scale: 0.9 },
      { color: "oklch(0.55 0.18 250)", x: 60, y: 100, scale: 1 },
    ],
  },
  cobros: {
    label: "Cobros",
    glows: [
      { color: "oklch(0.63 0.17 155)", x: 20, y: 18, scale: 1.1 },
      { color: "oklch(0.70 0.14 130)", x: 90, y: 55, scale: 0.95 },
      { color: "oklch(0.58 0.17 200)", x: 40, y: 98, scale: 1.05 },
    ],
  },
  contexto: {
    label: "Cómo trabajás hoy",
    glows: [
      { color: "oklch(0.56 0.19 300)", x: 78, y: 14, scale: 1 },
      { color: "oklch(0.62 0.17 330)", x: 14, y: 62, scale: 1.1 },
      { color: "oklch(0.55 0.19 268)", x: 55, y: 100, scale: 0.9 },
    ],
  },
  cierre: {
    label: "Casi terminamos",
    glows: [
      { color: "oklch(0.74 0.15 70)", x: 50, y: 6, scale: 1.2 },
      { color: "oklch(0.55 0.20 264)", x: 10, y: 50, scale: 1 },
      { color: "oklch(0.66 0.16 150)", x: 92, y: 92, scale: 1 },
    ],
  },
};

/** The review and the confirmation land on the closing mood. */
export const CLOSING_CHAPTER: ChapterId = "cierre";
