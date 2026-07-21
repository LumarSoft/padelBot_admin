/** Field-level validation errors keyed by form field name. */
export type FieldErrors = Record<string, string[]>;

/** Error thrown by both the browser BFF client and the server API client. */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors?: FieldErrors;

  constructor(status: number, message: string, fieldErrors?: FieldErrors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}
