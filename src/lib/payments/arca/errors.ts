/** Safe ARCA protocol / transport errors (no credentials in messages). */
export class ArcaProtocolError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ArcaProtocolError";
    this.code = code;
  }
}

export class ArcaConfigError extends ArcaProtocolError {
  constructor(message: string) {
    super("ARCA_CONFIG", message);
    this.name = "ArcaConfigError";
  }
}

export type ArcaHttpErrorDetails = {
  httpStatus: number;
  httpStatusText?: string;
  responseContentType?: string | null;
  /** Path suffix only (e.g. `/register.do`), never credentials. */
  endpointPath?: string;
};

export class ArcaHttpError extends ArcaProtocolError {
  readonly httpStatus: number;
  readonly httpStatusText: string | undefined;
  readonly responseContentType: string | null | undefined;
  readonly endpointPath: string | undefined;

  constructor(httpStatusOrDetails: number | ArcaHttpErrorDetails) {
    const details =
      typeof httpStatusOrDetails === "number"
        ? { httpStatus: httpStatusOrDetails }
        : httpStatusOrDetails;
    super(
      "ARCA_HTTP",
      `ARCA HTTP request failed with status ${details.httpStatus}.`,
    );
    this.name = "ArcaHttpError";
    this.httpStatus = details.httpStatus;
    this.httpStatusText = details.httpStatusText;
    this.responseContentType = details.responseContentType;
    this.endpointPath = details.endpointPath;
  }
}

export class ArcaTimeoutError extends ArcaProtocolError {
  constructor() {
    super("ARCA_TIMEOUT", "ARCA request timed out.");
    this.name = "ArcaTimeoutError";
  }
}

export class ArcaMalformedResponseError extends ArcaProtocolError {
  constructor() {
    super("ARCA_MALFORMED_RESPONSE", "ARCA response could not be validated.");
    this.name = "ArcaMalformedResponseError";
  }
}

export class ArcaBusinessError extends ArcaProtocolError {
  readonly providerErrorCode: string;
  /** Sanitized ARCA `errorMessage`, if the gateway sent one. */
  readonly providerErrorMessage: string | undefined;

  constructor(
    providerErrorCode: string,
    safeMessage?: string,
    providerErrorMessage?: string,
  ) {
    super(
      "ARCA_BUSINESS_ERROR",
      safeMessage ?? `ARCA business error code ${providerErrorCode}.`,
    );
    this.name = "ArcaBusinessError";
    this.providerErrorCode = providerErrorCode;
    this.providerErrorMessage = providerErrorMessage;
  }
}

export class ArcaFormUrlRejectedError extends ArcaProtocolError {
  constructor() {
    super(
      "ARCA_FORM_URL_REJECTED",
      "ARCA form URL host is not allowlisted.",
    );
    this.name = "ArcaFormUrlRejectedError";
  }
}

export class ArcaAmountError extends ArcaProtocolError {
  constructor(message: string) {
    super("ARCA_AMOUNT", message);
    this.name = "ArcaAmountError";
  }
}

export function isArcaProtocolError(
  error: unknown,
): error is ArcaProtocolError {
  return error instanceof ArcaProtocolError;
}
