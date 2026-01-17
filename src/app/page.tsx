export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import fs from "node:fs/promises";
import path from "node:path";
import Controls from "./Controls";

type Entry = {
  name: string;
  occ: number;
  gather: number;
  pvp: number;
  life: number;
};

type Board = {
  title: string;
  weekOf?: string;
  entries: Entry[];
};

type Data = {
  updatedAt: string;
  boards: Record<string, Board>;
};

type SortKey = "personal" | "occ" | "gather" | "pvp" | "life";

const PAGE_SIZE = 25;

function personal(e: Entry) {
  return (e.occ || 0) + (e.gather || 0) + (e.pvp || 0) + (e.life || 0);
}

function scoreFor(e: Entry, key: SortKey) {
  switch (key) {
    case "occ":
      return e.occ || 0;
    case "gather":
      return e.gather || 0;
    case "pvp":
      return e.pvp || 0;
    case "life":
      return e.life || 0;
    default:
      return personal(e);
  }
}

function fmt(n: number) {
  return (n || 0).toLocaleString();
}

/* ============================
   OCR ALIAS MAP (Step C4)
   Keys must match *cleanName()* output lowercased.
   We include slash/backslash variants because OCR varies.
   ============================ */
const NAME_ALIASES: Record<string, string> = {
  // SØGEKING
  "sqgeking": "SØGEKING",

  // Up n1ce小皮鞭 variants
  "upnice) i238": "Up n1ce小皮鞭",
  "upnice)\\ i238": "Up n1ce小皮鞭", // literal backslash in string
  "up n1ce小皮鞭": "Up n1ce小皮鞭",
};

function normalizeForAliasKey(s: string) {
  // Normalize *only for matching* (we still display the mapped output)
  // - collapse spaces
  // - keep unicode
  // - keep punctuation, but also provide a slashless comparison
  const collapsed = s.replace(/\s+/g, " ").trim();
  const lower = collapsed.toLowerCase();
  const slashless = lower.replace(/[\\\/]/g, "");
  return { lower, slashless };
}

function cleanName(raw: string): string {
  let s = (raw ?? "").trim();

  // remove leading @ and whitespace
  s = s.replace(/^[@\s]+/, "");

  // remove "Personal Score: 123,456" anywhere
  s = s.replace(/\bpersonal\s*score\s*:\s*[\d,]+/gi, "").trim();
  s = s.replace(/\bpersonal\s*:\s*[\d,]+/gi, "").trim();

  // trim trailing separators
  s = s.replace(/[\s\-—|:]+$/g, "").trim();

  // ===== Step C4: alias matching =====
  const { lower, slashless } = normalizeForAliasKey(s);

  // direct
  if (NAME_ALIASES[lower]) return NAME_ALIASES[lower];

  // slashless fallback (handles "Upnice)\ i238" vs "Upnice) i238")
  for (const [k, v] of Object.entries(NAME_ALIASES)) {
    const kk = k.toLowerCase().replace(/[\\\/]/g, "");
    if (kk === slashless) return v;
  }

  return s;
}

function dedupeEntries(entries: Entry[]): Entry[] {
  const merged: Record<string, Entry> = {};

  for (const e of entries) {
    const name = cleanName(e.name);
    const key = name.toLowerCase();

    if (!merged[key]) {
      merged[key] = { name, occ: 0, gather: 0, pvp: 0, life: 0 };
    }

    merged[key].occ += e.occ || 0;
    merged[key].gather += e.gather || 0;
    merged[key].pvp += e.pvp || 0;
    merged[key].life += e.life || 0;
  }

  return Object.values(merged);
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filePath = path.join(process.cwd(), "public", "leaderboard.json");
  const raw = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(raw) as Data;

  const sp = (await searchParams) ?? {};
  const boardKeys = Object.keys(data.boards);

  const boardKey =
    typeof sp.board === "string" && boardKeys.includes(sp.board)
      ? sp.board
      : "overall";

  const sortKey: SortKey =
    typeof sp.sort === "string" &&
    ["personal", "occ", "gather", "pvp", "life"].includes(sp.sort)
      ? (sp.sort as SortKey)
      : "personal";

  const page = Math.max(1, Number(sp.page ?? 1));
  const q = typeof sp.q === "string" ? sp.q.toLowerCase() : "";

  const board = data.boards[boardKey];
  const merged = dedupeEntries(board.entries);

  const filtered = q ? merged.filter((e) => e.name.toLowerCase().includes(q)) : merged;

  const sorted = [...filtered].sort((a, b) => scoreFor(b, sortKey) - scoreFor(a, sortKey));

  const start = (page - 1) * PAGE_SIZE;
  const pageItems = sorted.slice(start, start + PAGE_SIZE);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <Controls
          boardKeys={boardKeys}
          boardTitles={Object.fromEntries(boardKeys.map((k) => [k, data.boards[k].title]))}
          activeBoard={boardKey}
          activeSort={sortKey}
          activePage={page}
          activeQuery={q}
        />

        {pageItems.map((e, i) => (
          <div key={i}>
            {e.name} — {fmt(personal(e))}
          </div>
        ))}
      </div>
    </main>
  );
}
