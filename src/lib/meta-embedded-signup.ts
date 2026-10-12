"use client";

import type {
  EmbeddedSignupConfig,
  EmbeddedSignupRequest,
} from "@/types/api/onboarding";

/**
 * Meta's WhatsApp Embedded Signup, driven from the browser with the Facebook JS SDK.
 *
 * The popup reports back through two independent channels that arrive in any order:
 *  - the FB.login callback → a one-time `code` (30 s TTL) the API exchanges for the token;
 *  - a `WA_EMBEDDED_SIGNUP` window message → which WABA / number the club picked and how
 *    the flow finished (Cloud API, or coexistence with the WhatsApp Business app).
 * We wait for both and hand them to the API in one call.
 */

interface FbLoginResponse {
  authResponse?: { code?: string } | null;
}

interface FacebookSdk {
  init(params: {
    appId: string;
    autoLogAppEvents: boolean;
    xfbml: boolean;
    version: string;
  }): void;
  login(
    callback: (response: FbLoginResponse) => void,
    options: Record<string, unknown>,
  ): void;
}

declare global {
  interface Window {
    FB?: FacebookSdk;
    fbAsyncInit?: () => void;
  }
}

const SDK_SRC = "https://connect.facebook.net/en_US/sdk.js";
/** How long to wait for the second channel once the first one arrived. */
const PAIRING_TIMEOUT_MS = 15_000;

/** Finish events that mean "a number is ready to be connected". */
const FINISH_EVENTS = new Set([
  "FINISH",
  "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING",
]);

export class EmbeddedSignupCancelled extends Error {
  constructor() {
    super("Conexión cancelada");
  }
}

let sdkPromise: Promise<FacebookSdk> | null = null;

function loadSdk(config: EmbeddedSignupConfig): Promise<FacebookSdk> {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<FacebookSdk>((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB!.init({
        appId: config.appId!,
        autoLogAppEvents: true,
        xfbml: false,
        version: config.apiVersion,
      });
      resolve(window.FB!);
    };
    const script = document.createElement("script");
    script.src = SDK_SRC;
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.onerror = () => {
      sdkPromise = null;
      reject(
        new Error(
          "No se pudo cargar Facebook. Revisá si un bloqueador de anuncios lo está frenando.",
        ),
      );
    };
    document.body.appendChild(script);
  });
  return sdkPromise;
}

interface SessionInfo {
  wabaId: string;
  phoneNumberId?: string;
  coexistence: boolean;
}

/** Parses a `WA_EMBEDDED_SIGNUP` message; null for anything else posted by facebook.com. */
function parseSessionMessage(
  event: MessageEvent,
): SessionInfo | "cancel" | Error | null {
  if (!/(^|\.)facebook\.com$/.test(new URL(event.origin).hostname)) return null;
  let data: { type?: string; event?: string; data?: Record<string, string> };
  try {
    data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
  } catch {
    return null;
  }
  if (data?.type !== "WA_EMBEDDED_SIGNUP") return null;
  if (data.event === "CANCEL") return "cancel";
  if (data.event === "ERROR") {
    return new Error(
      data.data?.error_message ?? "Meta reportó un error durante la conexión",
    );
  }
  if (!data.event || !FINISH_EVENTS.has(data.event) || !data.data?.waba_id)
    return null;
  return {
    wabaId: data.data.waba_id,
    phoneNumberId: data.data.phone_number_id || undefined,
    coexistence: data.event === "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING",
  };
}

/**
 * Opens the Embedded Signup popup and resolves with what the API needs to finish the
 * connection. Rejects with EmbeddedSignupCancelled when the owner closes the popup.
 */
export async function launchEmbeddedSignup(
  config: EmbeddedSignupConfig,
): Promise<EmbeddedSignupRequest> {
  if (!config.enabled || !config.appId || !config.configId) {
    throw new Error("La conexión con WhatsApp todavía no está habilitada");
  }
  const fb = await loadSdk(config);

  return new Promise<EmbeddedSignupRequest>((resolve, reject) => {
    let code: string | null = null;
    let session: SessionInfo | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      if (timer) clearTimeout(timer);
    };
    const fail = (error: Error) => {
      cleanup();
      reject(error);
    };
    const tryFinish = () => {
      if (code && session) {
        cleanup();
        resolve({ code, ...session });
        return;
      }
      // One channel arrived: give the other a moment, then fail loudly instead of hanging.
      if (!timer) {
        timer = setTimeout(
          () =>
            fail(
              new Error(
                "Meta no terminó de confirmar la conexión. Probá de nuevo.",
              ),
            ),
          PAIRING_TIMEOUT_MS,
        );
      }
    };

    function onMessage(event: MessageEvent) {
      let parsed: ReturnType<typeof parseSessionMessage>;
      try {
        parsed = parseSessionMessage(event);
      } catch {
        return;
      }
      if (parsed === null) return;
      if (parsed === "cancel") return fail(new EmbeddedSignupCancelled());
      if (parsed instanceof Error) return fail(parsed);
      session = parsed;
      tryFinish();
    }

    window.addEventListener("message", onMessage);

    // The SDK requires a plain (non-async) callback.
    fb.login(
      (response) => {
        const received = response.authResponse?.code;
        if (!received) return fail(new EmbeddedSignupCancelled());
        code = received;
        tryFinish();
      },
      {
        config_id: config.configId,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          // Offers "connect your WhatsApp Business app" (coexistence) in the flow.
          featureType: "whatsapp_business_app_onboarding",
          sessionInfoVersion: "3",
        },
      },
    );
  });
}
