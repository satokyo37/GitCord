import crypto from "crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleIssuesEvent } from "../src/core/githubEventHandler";

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  if (!WEBHOOK_SECRET) {
    res.status(500).send("GITHUB_WEBHOOK_SECRET is not configured");
    return;
  }

  const signature = req.headers["x-hub-signature-256"] as string | undefined;
  const event = req.headers["x-github-event"] as string | undefined;

  if (!signature || !event) {
    res.status(400).send("Missing headers");
    return;
  }

  const rawBody = await readRawBody(req);

  const expectedSignature =
    "sha256=" +
    crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");

  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    res.status(401).send("Invalid signature");
    return;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    res.status(400).send("Invalid JSON body");
    return;
  }

  try {
    if (event === "issues") {
      await handleIssuesEvent(payload as any);
    }

    res.status(200).send("OK");
  } catch (e) {
    console.error(e);
    res.status(500).send("Internal Server Error");
  }
}
