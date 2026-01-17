export const runtime = "nodejs";

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
    case "personal":
    default:
      return personal(e);
  }
}

function fmt(n: number) {
  return (n || 0).toLocaleString();
}

/**
 * Website-side name cleanup.
 * Removes OCR junk like:
 *  - "@ Kiyomi Personal Score: 246,587"
 *  - "Kiyomi — Personal 246,587"
 */
function cleanName(raw: string): string {
  let s = (raw ?? "").trim();

  // remove leading @
  s = s.replace(/^[@\s]+/, "");

  // remove "Personal Score: 123,456"
  s = s.replace(/\bpersonal\s*score\s*:\s*[\d,]+/gi, "").trim();

  // remove "Personal: 123,456"
  s = s.replace(/\bpersonal\s*:\s*[\d,]+/gi, "").trim();

  // remove trailing separators
  s = s.replace(/[\s\-—|:]+$/g, "").trim();

  return s;
}

/**
 * Merge duplicate players after cleaning the name.
 * Key = cleaned name lowercased.
 * Sums stats so duplicates collapse into one row.
 */
function dedupeEntries(entries: Entry[]): Entry[] {
  const merged: Record<string, Entry> = {};

  for (const e of entries) {
    const display = cleanName(e?.name ?? "");
    if (!display) continue;

    const key = display.toLocaleLowerCase();

    if (!merged[key]) {
      merged[key] = {
        name: display,
        occ: e.occ || 0,
        gather: e.gather || 0,
        pvp: e.pvp || 0,
        life: e.life || 0,
      };
    } else {
      merged[key].occ += e.occ || 0;
      merged[key].gather += e.gather || 0;
      merged[key].pvp += e.pvp || 0;
      merged[key].life += e.life || 0;

      // keep “nicer” display name (usually longer / more complete)
      if (display.length > merged[key].name.length) {
        merged[key].name = display;
      }
    }
  }

  return Object.values(merged);
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Read static JSON directly from /public
  const filePath = path.join(process.cwd(), "public", "leaderboard.json");
  const raw = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(raw) as Data;

  const sp = (await searchParams) ?? {};
  const boardKeys = Object.keys(data.boards);

  // Defaults
  const boardKey =
    (typeof sp.board === "string" && boardKeys.includes(sp.board) && sp.board) ||
    (boardKeys.includes("overall") ? "overall" : boardKeys[0]) ||
    "overall";

  const sortKey = ((): SortKey => {
    const v = typeof sp.sort === "string" ? sp.sort : "personal";
    if (v === "occ" || v === "gather" || v === "pvp" || v === "life" || v === "personal")
      return v;
    return "personal";
  })();

  const pageNum = (() => {
    const v = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;
    return Number.isFinite(v) && v > 0 ? v : 1;
  })();

  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const board = data.boards[boardKey] ?? data.boards["overall"] ?? data.boards[boardKeys[0]];
  const rawEntries = board?.entries ?? [];

  // ✅ Normalize + merge duplicates BEFORE filtering/sorting
  const mergedEntries = dedupeEntries(rawEntries);

  // Search filters the paged list only
  const filtered = q
    ? mergedEntries.filter((e) => e.name.toLocaleLowerCase().includes(q.toLocaleLowerCase()))
    : mergedEntries;

  const sorted = [...filtered].sort((a, b) => scoreFor(b, sortKey) - scoreFor(a, sortKey));

  // Podium always top 3 by PERSONAL (from full mergedEntries)
  const podiumSorted = [...mergedEntries].sort((a, b) => personal(b) - personal(a));
  const top3 = podiumSorted.slice(0, 3);

  // Paging
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(pageNum, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = sorted.slice(start, start + PAGE_SIZE);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm text-zinc-400">Updated: {data.updatedAt}</div>
            <h1 className="text-3xl font-semibold">🏛️ {board.title} Leaderboard</h1>
            {board.weekOf ? (
              <div className="text-sm text-zinc-400">Week: {board.weekOf}</div>
            ) : null}
          </div>

          <div className="text-sm text-zinc-300 flex flex-wrap gap-x-3 gap-y-1">
            <span>🏰 Occ</span>
            <span>⛏️ Gather</span>
            <span>⚔️ PvP</span>
            <span>🌀 Life</span>
          </div>
        </header>

        <Controls
          boardKeys={boardKeys}
          boardTitles={Object.fromEntries(boardKeys.map((k) => [k, data.boards[k]?.title ?? k]))}
          activeBoard={boardKey}
          activeSort={sortKey}
          activePage={safePage}
          activeQuery={q}
        />

        {/* Top 3 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {top3.map((e, i) => (
            <div
              key={`${i}-${e.name}`}
              className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4"
            >
              <div className="text-sm text-zinc-400">Rank #{i + 1}</div>
              <div className="text-xl font-semibold truncate">{e.name}</div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>🏰 {fmt(e.occ)}</div>
                <div>⛏️ {fmt(e.gather)}</div>
                <div>⚔️ {fmt(e.pvp)}</div>
                <div>🌀 {fmt(e.life)}</div>
              </div>

              <div className="mt-3 text-sm text-zinc-300">
                Personal: <span className="font-semibold">{fmt(personal(e))}</span>
              </div>
            </div>
          ))}
        </section>

        {/* Paged List */}
        <section className="rounded-2xl bg-zinc-900/40 border border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <div className="text-sm text-zinc-300">
              {q ? (
                <>
                  Filter: <span className="font-semibold">{q}</span> —{" "}
                </>
              ) : null}
              Showing <span className="font-semibold">{sorted.length ? start + 1 : 0}</span>–
              <span className="font-semibold">
                {sorted.length ? Math.min(start + PAGE_SIZE, sorted.length) : 0}
              </span>{" "}
              of <span className="font-semibold">{sorted.length}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <a
                href={`/?board=${encodeURIComponent(boardKey)}&sort=${encodeURIComponent(
                  sortKey
                )}&page=${Math.max(1, safePage - 1)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={[
                  "px-3 py-1 rounded-xl border",
                  safePage === 1
                    ? "border-zinc-800 text-zinc-600 pointer-events-none"
                    : "border-zinc-700 hover:border-zinc-500",
                ].join(" ")}
              >
                ⏮️ Prev
              </a>

              <span className="text-zinc-400">
                Page <span className="text-zinc-200">{safePage}</span> / {totalPages}
              </span>

              <a
                href={`/?board=${encodeURIComponent(boardKey)}&sort=${encodeURIComponent(
                  sortKey
                )}&page=${Math.min(totalPages, safePage + 1)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={[
                  "px-3 py-1 rounded-xl border",
                  safePage === totalPages
                    ? "border-zinc-800 text-zinc-600 pointer-events-none"
                    : "border-zinc-700 hover:border-zinc-500",
                ].join(" ")}
              >
                Next ⏭️
              </a>
            </div>
          </div>

          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs uppercase tracking-wide text-zinc-400 border-b border-zinc-800">
            <div className="col-span-1">#</div>
            <div className="col-span-3">Player</div>
            <div className="col-span-2 text-right">Personal</div>
            <div className="col-span-2 text-right">🏰 Occ</div>
            <div className="col-span-2 text-right">⛏️ Gather</div>
            <div className="col-span-1 text-right">⚔️</div>
            <div className="col-span-1 text-right">🌀</div>
          </div>

          {pageItems.map((e, idx) => {
            const rank = start + idx + 1;
            const zebra = idx % 2 === 0 ? "bg-zinc-950/10" : "bg-zinc-950/20";
            return (
              <div
                key={`${rank}-${e.name}`}
                className={`grid grid-cols-12 gap-2 px-4 py-2 text-sm border-b border-zinc-900/60 ${zebra}`}
              >
                <div className="col-span-1 text-zinc-400">{rank}</div>
                <div className="col-span-3 truncate">{e.name}</div>
                <div className="col-span-2 text-right font-semibold">{fmt(personal(e))}</div>
                <div className="col-span-2 text-right">{fmt(e.occ)}</div>
                <div className="col-span-2 text-right">{fmt(e.gather)}</div>
                <div className="col-span-1 text-right">{fmt(e.pvp)}</div>
                <div className="col-span-1 text-right">{fmt(e.life)}</div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
