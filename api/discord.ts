import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleDiscordHttpRequest } from "../src/http/discordInteraction";

async function readRawBody(request: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  const result = await handleDiscordHttpRequest({
    method: request.method ?? "GET",
    headers: request.headers,
    rawBody: await readRawBody(request),
  });

  if (typeof result.body === "string") {
    response.status(result.status).send(result.body);
  } else {
    response.status(result.status).json(result.body);
  }
}
