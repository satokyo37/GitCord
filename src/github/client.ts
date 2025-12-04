const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_API_BASE = "https://api.github.com";

export type GitHubIssue = {
  html_url: string;
  title: string;
  number: number;
  repository_url: string;
};

type FetchAssignedIssuesOptions = {
  limit?: number;
  repo?: string;
};

export async function fetchAssignedIssues(
  githubLogin: string,
  options?: FetchAssignedIssuesOptions
): Promise<GitHubIssue[]> {
  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is not set");
  }

  const limit = options?.limit ?? 10;

  const url = new URL(`${GITHUB_API_BASE}/search/issues`);

  const queryParts = [`assignee:${githubLogin}`, "is:open", "is:issue"];

  if (options?.repo) {
    queryParts.push(`repo:${options.repo}`);
  }

  url.searchParams.set("q", queryParts.join(" "));
  url.searchParams.set("sort", "updated");
  url.searchParams.set("order", "desc");
  url.searchParams.set("per_page", String(limit));

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "User-Agent": "gitcord-bot",
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return (data.items ?? []) as GitHubIssue[];
}
