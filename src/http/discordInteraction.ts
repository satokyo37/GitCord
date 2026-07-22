import {
  verifyKey,
  InteractionType,
  InteractionResponseType,
} from "discord-interactions";
import { handleMyIssuesCommand } from "../core/commands/myIssues";
import { handleMyReviewsCommand } from "../core/commands/myReviews";
import { getHeader, type HttpRequest, type HttpResponse } from "./types";

type DiscordInteraction = {
  type?: number;
  data?: { name?: string };
  member?: { user?: { id?: string } };
  user?: { id?: string };
};

function interactionMessage(content: string): HttpResponse {
  return {
    status: 200,
    body: {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content, flags: 1 << 6 },
    },
  };
}

export async function handleDiscordHttpRequest(
  request: HttpRequest
): Promise<HttpResponse> {
  if (["HEAD", "OPTIONS", "GET"].includes(request.method)) {
    return { status: 200, body: "OK" };
  }

  if (request.method !== "POST") {
    return { status: 405, body: "Method Not Allowed" };
  }

  const publicKey = process.env.DISCORD_PUBLIC_KEY ?? "";
  const signature = getHeader(request.headers, "x-signature-ed25519");
  const timestamp = getHeader(request.headers, "x-signature-timestamp");

  if (!signature || !timestamp || !publicKey) {
    console.error("Missing signature or public key", {
      hasSignature: !!signature,
      hasTimestamp: !!timestamp,
      hasPublicKey: !!publicKey,
    });
    return { status: 401, body: "Missing signature" };
  }

  try {
    const isValid = await verifyKey(
      request.rawBody,
      signature,
      timestamp,
      publicKey
    );
    if (!isValid) {
      console.error("Invalid Discord request signature");
      return { status: 401, body: "Bad request signature" };
    }
  } catch (error) {
    console.error("verifyKey threw", error);
    return { status: 401, body: "Bad request signature" };
  }

  let body: DiscordInteraction;
  try {
    body = JSON.parse(request.rawBody.toString("utf8")) as DiscordInteraction;
  } catch (error) {
    console.error("Failed to parse body", error);
    return { status: 400, body: "Bad Request" };
  }

  if (body.type === InteractionType.PING) {
    return {
      status: 200,
      body: { type: InteractionResponseType.PONG },
    };
  }

  if (body.type !== InteractionType.APPLICATION_COMMAND) {
    return { status: 400, body: "Unknown interaction type" };
  }

  const commandName = body.data?.name ?? "unknown";
  const discordUserId = body.member?.user?.id ?? body.user?.id ?? "unknown";
  console.log("Received command:", commandName);

  if (commandName === "my-issues") {
    const content = await handleMyIssuesCommand(discordUserId).catch((error) => {
      console.error("my-issues error:", error);
      return "⚠️ GitHub から issue を取得できませんでした。";
    });
    return interactionMessage(content);
  }

  if (commandName === "my-reviews") {
    const content = await handleMyReviewsCommand(discordUserId).catch(
      (error) => {
        console.error("my-reviews error:", error);
        return "⚠️ GitHub からレビュー依頼中のPRを取得できませんでした。";
      }
    );
    return interactionMessage(content);
  }

  return interactionMessage(`🤖 未対応のコマンドです: \`${commandName}\``);
}
