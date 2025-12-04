import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  verifyKey,
  InteractionType,
  InteractionResponseType,
} from "discord-interactions";
import { handleMyIssuesCommand } from "../src/core/commands/myIssues";

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY ?? "";

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (
    req.method === "HEAD" ||
    req.method === "OPTIONS" ||
    req.method === "GET"
  ) {
    res.status(200).send("OK");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const signature = req.headers["x-signature-ed25519"] as string | undefined;
  const timestamp = req.headers["x-signature-timestamp"] as string | undefined;

  if (!signature || !timestamp || !PUBLIC_KEY) {
    console.error("Missing signature or public key", {
      hasSignature: !!signature,
      hasTimestamp: !!timestamp,
      hasPublicKey: !!PUBLIC_KEY,
    });
    res.status(401).send("Missing signature");
    return;
  }

  const rawBody = await readRawBody(req);

  let isValid = false;
  try {
    isValid = await verifyKey(rawBody, signature, timestamp, PUBLIC_KEY);
  } catch (e) {
    console.error("verifyKey threw", e);
    res.status(401).send("Bad request signature");
    return;
  }

  if (!isValid) {
    console.error("Invalid Discord request signature");
    res.status(401).send("Bad request signature");
    return;
  }

  let body: any;
  try {
    body = JSON.parse(rawBody.toString("utf8"));
  } catch (e) {
    console.error("Failed to parse body", e);
    res.status(400).send("Bad Request");
    return;
  }

  if (body.type === InteractionType.PING) {
    res.status(200).json({ type: InteractionResponseType.PONG });
    return;
  }

  if (body.type === InteractionType.APPLICATION_COMMAND) {
    const commandName = body.data?.name as string;
    console.log("Received command:", commandName);

    if (commandName === "my-issues") {
      const discordUserId: string =
        body.member?.user?.id ?? body.user?.id ?? "unknown";

      const content = await handleMyIssuesCommand(discordUserId).catch((e) => {
        console.error("my-issues error:", e);
        return "⚠️ GitHub から issue を取得できませんでした。";
      });

      res.status(200).json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content },
      });
      return;
    }

    res.status(200).json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `🤖 未対応のコマンドです: \`${commandName}\``,
      },
    });
    return;
  }

  res.status(400).send("Unknown interaction type");
}
