import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(200).send("OK (discord minimal endpoint)");
    return;
  }

  res.status(200).json({ type: 1 });
}
