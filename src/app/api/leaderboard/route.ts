import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

export async function GET() {
  const filePath = path.join(process.cwd(), "public", "leaderboard.json");
  const raw = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(raw);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
