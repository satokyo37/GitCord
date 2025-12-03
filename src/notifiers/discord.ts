const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL!;

export type DiscordMessageOptions = {
  content?: string;
  username?: string;
};

export async function sendDiscordMessage(
  payload: DiscordMessageOptions
): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) {
    console.warn("DISCORD_WEBHOOK_URL is not set. Skip sending message.");
    return;
  }

  const body = JSON.stringify({
    content: payload.content ?? "",
    username: payload.username ?? "GitCord",
  });

  const res = await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (!res.ok) {
    console.error("Failed to send message to Discord:", await res.text());
  }
}
