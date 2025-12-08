import { fetchRequestedReviews } from "../../github/client";
import { resolveGitHubLoginFromDiscordUser } from "../../config/userMap";

const TARGET_REPO = process.env.GITHUB_REPO;

export async function handleMyReviewsCommand(
  discordUserId: string
): Promise<string> {
  const login = resolveGitHubLoginFromDiscordUser(discordUserId);

  if (!login) {
    return [
      "⚠️ この Discord アカウントには GitHub アカウントの紐付けがありません。",
      "Discord ID と GitHub ログインを追加してください。",
    ].join("\n");
  }

  const reviews = await fetchRequestedReviews(
    login,
    TARGET_REPO ? { limit: 50, repo: TARGET_REPO } : { limit: 50 }
  );

  if (reviews.length === 0) {
    return `✅ 現在 \`${login}\` にレビュー依頼されている open PR はありません。`;
  }

  const lines = reviews.map((pr, idx) => {
    const repoFullName = pr.repository_url.replace(
      "https://api.github.com/repos/",
      ""
    );
    return `${idx + 1}. [${repoFullName}#${pr.number}](${pr.html_url}) - ${
      pr.title
    }`;
  });

  return [
    `📝 \`${login}\` にレビュー依頼されている open PR 一覧（${reviews.length}件）：`,
    "",
    ...lines,
  ].join("\n");
}
