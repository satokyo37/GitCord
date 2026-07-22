import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { handleDiscordHttpRequest } from "../src/http/discordInteraction";
import { handleGitHubWebhookHttpRequest } from "../src/http/githubWebhook";

test("DiscordエンドポイントはGETの疎通確認へ応答する", async () => {
  const response = await handleDiscordHttpRequest({
    method: "GET",
    headers: {},
    rawBody: Buffer.alloc(0),
  });

  assert.deepEqual(response, { status: 200, body: "OK" });
});

test("Discordエンドポイントは署名のないPOSTを拒否する", async () => {
  const response = await handleDiscordHttpRequest({
    method: "POST",
    headers: {},
    rawBody: Buffer.from("{}"),
  });

  assert.deepEqual(response, { status: 401, body: "Missing signature" });
});

test("GitHub WebhookはPOST以外を拒否する", async () => {
  const response = await handleGitHubWebhookHttpRequest({
    method: "GET",
    headers: {},
    rawBody: Buffer.alloc(0),
  });

  assert.deepEqual(response, { status: 405, body: "Method Not Allowed" });
});

test("GitHub Webhookは正しい署名の未処理イベントへOKを返す", async () => {
  const previousSecret = process.env.GITHUB_WEBHOOK_SECRET;
  process.env.GITHUB_WEBHOOK_SECRET = "test-secret";

  try {
    const rawBody = Buffer.from('{"zen":"test"}');
    const signature =
      "sha256=" +
      crypto
        .createHmac("sha256", "test-secret")
        .update(rawBody)
        .digest("hex");
    const response = await handleGitHubWebhookHttpRequest({
      method: "POST",
      headers: {
        "x-hub-signature-256": signature,
        "x-github-event": "ping",
      },
      rawBody,
    });

    assert.deepEqual(response, { status: 200, body: "OK" });
  } finally {
    if (previousSecret === undefined) {
      delete process.env.GITHUB_WEBHOOK_SECRET;
    } else {
      process.env.GITHUB_WEBHOOK_SECRET = previousSecret;
    }
  }
});
