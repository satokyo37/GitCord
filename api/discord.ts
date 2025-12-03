import {
  verifyKey,
  InteractionType,
  InteractionResponseType,
} from "discord-interactions";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleMyIssuesCommand } from "../src/core/commands/myIssues";

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY!;

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

  const signature = req.headers["x-signature-ed25519"] as string | undefined;
  const timestamp = req.headers["x-signature-timestamp"] as string | undefined;

  if (!signature || !timestamp) {
    res.status(401).send("Missing request signature headers");
    return;
  }

  const rawBody = await readRawBody(req);

  const isValid = verifyKey(rawBody, signature, timestamp, DISCORD_PUBLIC_KEY);
  if (!isValid) {
    res.status(401).send("Bad request signature");
    return;
  }

  const body = JSON.parse(rawBody.toString("utf8"));

  if (body.type === InteractionType.PING) {
    res.status(200).json({ type: InteractionResponseType.PONG });
    return;
  }

  if (body.type === InteractionType.APPLICATION_COMMAND) {
    const commandName = body.data.name as string;

    if (commandName === "my-issues") {
      const discordUserId: string = body.member?.user?.id ?? body.user?.id;

      const content = await handleMyIssuesCommand(discordUserId).catch((e) => {
        console.error(e);
        return "⚠️ GitHub から issue を取得できませんでした。時間をおいて再度お試しください。";
      });

      res.status(200).json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content,
        },
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
