import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "HEAD" || req.method === "OPTIONS") {
    res.status(200).send("OK");
    return;
  }

  if (req.method === "GET") {
    res.status(200).send("OK (discord minimal endpoint)");
    return;
  }

  if (req.method === "POST") {
    res.status(200).json({ type: 1 });
    return;
  }

  res.status(200).send("OK");
}
