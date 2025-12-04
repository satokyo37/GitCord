import "dotenv/config";

const { DISCORD_APPLICATION_ID, DISCORD_GUILD_ID, DISCORD_BOT_TOKEN } =
  process.env;

if (!DISCORD_APPLICATION_ID || !DISCORD_GUILD_ID || !DISCORD_BOT_TOKEN) {
  console.error(
    "Missing env: DISCORD_APPLICATION_ID / DISCORD_GUILD_ID / DISCORD_BOT_TOKEN"
  );
  process.exit(1);
}

const commands = [
  {
    name: "my-issues",
    description: "Show GitHub issues assigned to me",
    type: 1,
  },
];

async function main() {
  const url = `https://discord.com/api/v10/applications/${DISCORD_APPLICATION_ID}/guilds/${DISCORD_GUILD_ID}/commands`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
    },
    body: JSON.stringify(commands),
  });

  const text = await res.text();
  console.log(res.status, text);
  if (!res.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
