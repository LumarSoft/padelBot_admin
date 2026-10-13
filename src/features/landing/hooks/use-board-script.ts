import { useEffect, useState } from "react";

export type BoardStatus = "LIBRE" | "PEND. SEÑA" | "CONFIRMADO";

export interface BoardRow {
  time: string;
  court: string;
  player: string;
  status: BoardStatus;
}

export interface BoardEvent {
  /** Clock shown on the board when the message arrives. */
  clock: string;
  from: string;
  text: string;
  /** Row the bot updates in response, and the fields it changes. */
  row: number;
  patch: Partial<BoardRow>;
}

export interface BoardMessage {
  id: number;
  from: string;
  text: string;
}

interface BoardState {
  rows: BoardRow[];
  clock: string;
  message: BoardMessage | null;
}

const FIRST_EVENT_MS = 1400;
const STEP_MS = 3800;
/** The board reacts a beat after the WhatsApp message lands. */
const REPLY_DELAY_MS = 1200;
const RESET_PAUSE_MS = 2400;

/**
 * Plays a scripted night of WhatsApp messages against the board, in a loop:
 * each message shows up, then the bot updates its row. After the last event
 * the board flips back to its initial state and starts over.
 */
export function useBoardScript(
  initialRows: BoardRow[],
  script: BoardEvent[],
  initialClock: string,
): BoardState {
  const [state, setState] = useState<BoardState>({
    rows: initialRows,
    clock: initialClock,
    message: null,
  });

  useEffect(() => {
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms));
    };

    let step = 0;
    let messageId = 0;

    const play = () => {
      if (step === script.length) {
        step = 0;
        setState({ rows: initialRows, clock: initialClock, message: null });
        later(play, RESET_PAUSE_MS);
        return;
      }

      const event = script[step];
      messageId += 1;
      setState((prev) => ({
        ...prev,
        clock: event.clock,
        message: { id: messageId, from: event.from, text: event.text },
      }));
      later(() => {
        setState((prev) => ({
          ...prev,
          rows: prev.rows.map((row, i) =>
            i === event.row ? { ...row, ...event.patch } : row,
          ),
        }));
      }, REPLY_DELAY_MS);

      step += 1;
      later(play, STEP_MS);
    };

    later(play, FIRST_EVENT_MS);
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [initialRows, script, initialClock]);

  return state;
}
