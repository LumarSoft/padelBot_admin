/**
 * Guided account setup ("puesta a punto") — mirrors the API's `/onboarding/status`.
 * Every step is skippable and stays editable from Configuración afterwards.
 */
export const SETUP_STEP_IDS = [
  "complejo",
  "canchas",
  "pagos",
  "whatsapp",
  "fijos",
  "equipo",
  "kiosco",
] as const;

export type SetupStepId = (typeof SETUP_STEP_IDS)[number];

export interface SetupStepStatus {
  id: SetupStepId;
  /** Derived from the club's real data — true when it actually has what the step configures. */
  done: boolean;
  /** The owner moved past this step (they may have skipped it on purpose). */
  acknowledged: boolean;
  /** The bot can't operate without it. Skippable anyway; it just won't take bookings. */
  required: boolean;
}

export interface SetupStatus {
  clubName: string;
  /** Null while the setup is pending. */
  setupCompletedAt: string | null;
  currentStep: SetupStepId | null;
  steps: SetupStepStatus[];
  counts: {
    courts: number;
    recurringBookings: number;
    staff: number;
    products: number;
    whatsappLines: number;
  };
  /** True once every required step is done: the bot can take a booking end to end. */
  ready: boolean;
}

export interface SetupProgress {
  currentStep: SetupStepId | null;
  doneSteps: SetupStepId[];
}

export interface SaveSetupProgressRequest {
  currentStep?: SetupStepId | null;
  doneSteps?: SetupStepId[];
}

/** Public ids to open Meta's Embedded Signup popup; `enabled` is false until the API is set up. */
export interface EmbeddedSignupConfig {
  enabled: boolean;
  appId: string | null;
  configId: string | null;
  apiVersion: string;
}

/** What the Embedded Signup popup hands back, forwarded to the API to finish the connection. */
export interface EmbeddedSignupRequest {
  code: string;
  wabaId: string;
  /** Absent on coexistence finishes (Meta only reports the WABA); the API looks it up. */
  phoneNumberId?: string;
  coexistence: boolean;
}

export interface CreateWhatsAppLineRequest {
  /** Meta's phone_number_id from the WhatsApp Business account. */
  phoneNumberId: string;
  /** Human-readable number shown in the panel (e.g. "+54 9 341 555-5555"). */
  displayPhone: string;
}
