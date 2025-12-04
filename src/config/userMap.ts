import usersConfig from "@config/users.json";

type UserConfig = {
  discordId: string;
  githubLogin: string;
};

const userMap: Record<string, string> = {};
const githubLoginSet = new Set<string>();

(usersConfig.users as UserConfig[]).forEach((u) => {
  userMap[u.discordId] = u.githubLogin;
  githubLoginSet.add(u.githubLogin);
});

export function resolveGitHubLoginFromDiscordUser(
  discordUserId: string
): string | undefined {
  return userMap[discordUserId];
}

export function isKnownGitHubLogin(login: string): boolean {
  return githubLoginSet.has(login);
}
