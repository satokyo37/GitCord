import fs from "node:fs";
import path from "node:path";

type UserConfig = {
  discordId: string;
  githubLogin: string;
};

type UsersFile = {
  users: UserConfig[];
};

function loadUsersConfig(): UsersFile {
  const raw = process.env.USERS_JSON;
  if (raw) {
    try {
      return JSON.parse(raw) as UsersFile;
    } catch (e) {
      console.error("USERS_JSON is not valid JSON", e);
      return { users: [] };
    }
  }

  const configPath = path.resolve(process.cwd(), "config/users.json");
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf8")) as UsersFile;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      console.error(`${configPath} could not be loaded`, error);
    }
    return { users: [] };
  }
}

const usersConfig = loadUsersConfig();

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
