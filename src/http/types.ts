export type HttpHeaders = Record<string, string | string[] | undefined>;

export type HttpRequest = {
  method: string;
  headers: HttpHeaders;
  rawBody: Buffer;
};

export type HttpResponse = {
  status: number;
  body: string | Record<string, unknown>;
};

export function getHeader(
  headers: HttpHeaders,
  name: string
): string | undefined {
  const value = headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}
