import "dotenv/config";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { handleDiscordHttpRequest } from "./http/discordInteraction";
import { handleGitHubWebhookHttpRequest } from "./http/githubWebhook";
import { readRawBody, sendHttpResponse } from "./http/nodeAdapter";
import type { HttpResponse } from "./http/types";

async function route(request: IncomingMessage): Promise<HttpResponse> {
  const url = new URL(request.url ?? "/", "http://localhost");
  const method = request.method ?? "GET";
  const rawBody = await readRawBody(request);
  const httpRequest = { method, headers: request.headers, rawBody };

  if (url.pathname === "/api/discord") {
    return handleDiscordHttpRequest(httpRequest);
  }

  if (url.pathname === "/api/githubWebhook") {
    return handleGitHubWebhookHttpRequest(httpRequest);
  }

  return { status: 404, body: "Not Found" };
}

export function createGitCordServer() {
  return createServer(async (request: IncomingMessage, response: ServerResponse) => {
    try {
      sendHttpResponse(response, await route(request));
    } catch (error) {
      console.error("Unhandled HTTP server error", error);
      sendHttpResponse(response, {
        status: 500,
        body: "Internal Server Error",
      });
    }
  });
}

export function startServer(): void {
  const port = Number.parseInt(process.env.PORT ?? "3000", 10);
  const host = process.env.HOST ?? "0.0.0.0";

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT is invalid: ${process.env.PORT ?? ""}`);
  }

  createGitCordServer().listen(port, host, () => {
    console.log(`GitCord is listening on http://${host}:${port}`);
  });
}

if (require.main === module) {
  startServer();
}
