/** Safe iDram protocol errors (no secrets in messages). */
export class IdramProtocolError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "IdramProtocolError";
    this.code = code;
  }
}

export class IdramConfigError extends IdramProtocolError {
  constructor(message: string) {
    super("IDRAM_CONFIG", message);
    this.name = "IdramConfigError";
  }
}

export class IdramAmountError extends IdramProtocolError {
  constructor(message: string) {
    super("IDRAM_AMOUNT", message);
    this.name = "IdramAmountError";
  }
}

export class IdramChecksumError extends IdramProtocolError {
  constructor(message: string) {
    super("IDRAM_CHECKSUM", message);
    this.name = "IdramChecksumError";
  }
}

export class IdramFormUrlRejectedError extends IdramProtocolError {
  constructor() {
    super("IDRAM_FORM_URL_REJECTED", "iDram payment URL host is not allowlisted.");
    this.name = "IdramFormUrlRejectedError";
  }
}

export function isIdramProtocolError(
  error: unknown,
): error is IdramProtocolError {
  return error instanceof IdramProtocolError;
}
