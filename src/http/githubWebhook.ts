import crypto from "node:crypto";
import { handleIssuesEvent } from "../core/githubEventHandler";
import { getHeader, type HttpRequest, type HttpResponse } from "./types";

export async function handleGitHubWebhookHttpRequest(
  request: HttpRequest
): Promise<HttpResponse> {
  if (request.method !== "POST") {
    return { status: 405, body: "Method Not Allowed" };
  }

  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return {
      status: 500,
      body: "GITHUB_WEBHOOK_SECRET is not configured",
    };
  }

  const signature = getHeader(request.headers, "x-hub-signature-256");
  const event = getHeader(request.headers, "x-github-event");
  if (!signature || !event) {
    return { status: 400, body: "Missing headers" };
  }

  const expectedSignature =
    "sha256=" +
    crypto
      .createHmac("sha256", webhookSecret)
      .update(request.rawBody)
      .digest("hex");
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return { status: 401, body: "Invalid signature" };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(request.rawBody.toString("utf8"));
  } catch {
    return { status: 400, body: "Invalid JSON body" };
  }

  try {
    if (event === "issues") {
      await handleIssuesEvent(payload as Parameters<typeof handleIssuesEvent>[0]);
    }
    return { status: 200, body: "OK" };
  } catch (error) {
    console.error(error);
    return { status: 500, body: "Internal Server Error" };
  }
}
