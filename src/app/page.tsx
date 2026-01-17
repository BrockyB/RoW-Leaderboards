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

function norm(s: string) {
  return (s || "").toLowerCase();
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const filePath = path.join(process.cwd(), "public", "leaderboard.json");
  const raw = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(raw) as Data;

  const sp = searchParams ?? {};
  const boardKeys = Object.keys(data.boards);

  const boardKey =
    (typeof sp.board === "string" && boardKeys.includes(sp.board) && sp.board) ||
    (boardKeys.includes("overall") ? "overall" : boardKeys[0]) ||
    "overall";

  const sortKey = ((): SortKey => {
    const v = typeof sp.sort === "string" ? sp.sort : "personal";
    return v === "occ" || v === "gather" || v === "pvp" || v === "life" || v === "personal"
      ? v
      : "personal";
  })();

  const q = typeof sp.q === "string" ? sp.q : "";
  const qNorm = norm(q.trim());

  const pageNum = (() => {
    const v = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;
    return Number.isFinite(v) && v > 0 ? v : 1;
  })();

  const board = data.boards[boardKey] ?? data.boards[boardKeys[0]];
  const entries = board?.entries ?? [];

  // Podium is always top 3 by PERSONAL (unfiltered)
  const podiumSorted = [...entries].sort((a, b) => personal(b) - personal(a));
  const top3 = podiumSorted.slice(0, 3);

  // Filter list by query (paged list only)
  const filtered = qNorm
    ? entries.filter((e) => norm(e.name).includes(qNorm))
    : entries;

  const sorted = [...filtered].sort((a, b) => scoreFor(b, sortKey) - scoreFor(a, sortKey));

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(pageNum, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = sorted.slice(start, start + PAGE_SIZE);

  const makeHref = (next: Partial<{ board: string; sort: string; page: number; q: string }>) => {
    const b = next.board ?? boardKey;
    const s = next.sort ?? sortKey;
    const p = next.page ?? safePage;
    const qq = next.q ?? q;

    const qp = new URLSearchParams();
    qp.set("board", b);
    qp.set("sort", s);
    qp.set("page", String(p));
    if (qq.trim()) qp.set("q", qq.trim());

    return `/?${qp.toString()}`;
  };

  const activeColClass = "bg-zinc-800/40";
  const baseColClass = "";

  const col = (key: SortKey) => (sortKey === key ? activeColClass : baseColClass);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm text-zinc-400">Updated: {data.updatedAt}</div>
            <h1 className="text-3xl font-semibold">🏛️ {board.title} Leaderboard</h1>
            {board.weekOf ? <div className="text-sm text-zinc-400">Week of: {board.weekOf}</div> : null}
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
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between px-4 py-3 border-b border-zinc-800">
            <div className="text-sm text-zinc-300">
              Showing <span className="font-semibold">{sorted.length ? start + 1 : 0}</span>–
              <span className="font-semibold">
                {sorted.length ? Math.min(start + PAGE_SIZE, sorted.length) : 0}
              </span>{" "}
              of <span className="font-semibold">{sorted.length}</span>
              {q.trim() ? (
                <span className="text-zinc-400">
                  {" "}
                  (filtered by: <span className="text-zinc-200">{q}</span>)
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <a
                href={makeHref({ page: Math.max(1, safePage - 1) })}
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
                href={makeHref({ page: Math.min(totalPages, safePage + 1) })}
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
            <div className="col-span-1 text-right">⚔️ PvP</div>
            <div className="col-span-1 text-right">🌀 Life</div>
          </div>

          {/* Rows */}
          {pageItems.map((e, idx) => {
            const rank = start + idx + 1;
            const zebra = idx % 2 === 0 ? "bg-zinc-950/20" : "bg-transparent";

            return (
              <div
                key={`${rank}-${e.name}`}
                className={["grid grid-cols-12 gap-2 px-4 py-3 text-sm border-b border-zinc-900/60", zebra].join(" ")}
              >
                <div className="col-span-1 text-zinc-400">{rank}</div>
                <div className="col-span-3 truncate">{e.name}</div>

                <div className={["col-span-2 text-right font-semibold", col("personal")].join(" ")}>
                  {fmt(personal(e))}
                </div>

                <div className={["col-span-2 text-right text-zinc-300", col("occ")].join(" ")}>
                  {fmt(e.occ)}
                </div>

                <div className={["col-span-2 text-right text-zinc-300", col("gather")].join(" ")}>
                  {fmt(e.gather)}
                </div>

                <div className={["col-span-1 text-right text-zinc-300", col("pvp")].join(" ")}>
                  {fmt(e.pvp)}
                </div>

                <div className={["col-span-1 text-right text-zinc-300", col("life")].join(" ")}>
                  {fmt(e.life)}
                </div>
              </div>
            );
          })}

          {sorted.length === 0 ? (
            <div className="px-4 py-8 text-sm text-zinc-400">
              No players match your search.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
