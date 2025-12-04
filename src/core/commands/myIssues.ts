import { fetchAssignedIssues } from "../../github/client";
import { resolveGitHubLoginFromDiscordUser } from "../../config/userMap";

const TARGET_REPO = process.env.GITHUB_REPO;

export async function handleMyIssuesCommand(
  discordUserId: string
): Promise<string> {
  const login = resolveGitHubLoginFromDiscordUser(discordUserId);

  if (!login) {
    return [
      "⚠️ この Discord アカウントには GitHub アカウントの紐付けがありません。",
      "Discord ID と GitHub ログインを追加してください。",
    ].join("\n");
  }

  const issues = await fetchAssignedIssues(
    login,
    TARGET_REPO ? { limit: 100, repo: TARGET_REPO } : { limit: 100 }
  );

  if (issues.length === 0) {
    return `✅ 現在 \`${login}\` にアサインされている open issue はありません。`;
  }

  const lines = issues.map((issue, idx) => {
    const repoFullName = issue.repository_url.replace(
      "https://api.github.com/repos/",
      ""
    );
    return `${idx + 1}. [${repoFullName}#${issue.number}](${
      issue.html_url
    }) - ${issue.title}`;
  });

  return [
    `📋 \`${login}\` にアサインされている open issue 一覧（${issues.length}件）：`,
    "",
    ...lines,
  ].join("\n");
}
