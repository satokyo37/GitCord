import { sendDiscordMessage } from "../notifiers/discord";
import { isKnownGitHubLogin } from "../config/userMap";

type IssuesEventPayload = {
  action: string;
  issue: {
    html_url: string;
    title: string;
    number: number;
  };
  assignee?: { login: string } | null;
  repository: {
    full_name: string;
  };
};

export async function handleIssuesEvent(payload: IssuesEventPayload) {
  if (payload.action !== "assigned") return;
  if (!payload.assignee) return;

  const assigneeLogin = payload.assignee.login;

  if (!isKnownGitHubLogin(assigneeLogin)) return;

  const { issue, repository } = payload;

  const message = [
    `📌 **New issue assigned**`,
    `Assignee: \`${assigneeLogin}\``,
    `Repo: \`${repository.full_name}\``,
    `#${issue.number}: ${issue.title}`,
    issue.html_url,
  ].join("\n");

  await sendDiscordMessage({ content: message });
}
