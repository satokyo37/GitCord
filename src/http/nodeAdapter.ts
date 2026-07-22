import type { IncomingMessage, ServerResponse } from "node:http";
import type { HttpResponse } from "./types";

export async function readRawBody(request: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export function sendHttpResponse(
  response: ServerResponse,
  result: HttpResponse
): void {
  response.statusCode = result.status;

  if (typeof result.body === "string") {
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.end(result.body);
    return;
  }

  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(result.body));
}
