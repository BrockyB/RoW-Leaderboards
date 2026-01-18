// src/app/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import fs from "node:fs/promises";
import path from "node:path";
import Controls from "./Controls";
import StickyFooter from "./StickyFooter";

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

function labelForSort(key: SortKey) {
  switch (key) {
    case "occ":
      return "Occupational";
    case "gather":
      return "Gathering";
    case "pvp":
      return "PvP";
    case "life":
      return "Lifestone";
    default:
      return "Personal";
  }
}

function iconForSort(key: SortKey) {
  switch (key) {
    case "occ":
      return "🏰";
    case "gather":
      return "⛏️";
    case "pvp":
      return "⚔️";
    case "life":
      return "🌀";
    default:
      return "⭐";
  }
}

/* ============================
   OCR ALIAS MAP (kept as-is)
   ============================ */
const NAME_ALIASES: Record<string, string> = {
  sqgeking: "SØGEKING",
  "upnice) i238": "Up n1ce小皮鞭",
  "upnice)\\ i238": "Up n1ce小皮鞭",
  "up n1ce小皮鞭": "Up n1ce小皮鞭",
};

function normalizeForAliasKey(s: string) {
  const collapsed = s.replace(/\s+/g, " ").trim();
  const lower = collapsed.toLowerCase();
  const slashless = lower.replace(/[\\\/]/g, "");
  return { lower, slashless };
}

function cleanName(raw: string): string {
  let s = (raw ?? "").trim();
  s = s.replace(/^[@\s]+/, "");
  s = s.replace(/\bpersonal\s*score\s*:\s*[\d,]+/gi, "").trim();
  s = s.replace(/\bpersonal\s*:\s*[\d,]+/gi, "").trim();
  s = s.replace(/[\s\-—|:]+$/g, "").trim();

  const { lower, slashless } = normalizeForAliasKey(s);

  if (NAME_ALIASES[lower]) return NAME_ALIASES[lower];

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

function makeHref(
  next: Partial<{ board: string; sort: string; page: number; q: string }>,
  current: { board: string; sort: string; page: number; q: string }
) {
  const b = next.board ?? current.board;
  const s = next.sort ?? current.sort;
  const p = next.page ?? current.page;
  const q = next.q ?? current.q;

  const params = new URLSearchParams();
  params.set("board", b);
  params.set("sort", s);
  params.set("page", String(p));
  if (q) params.set("q", q);

  return `/?${params.toString()}`;
}

function Medal({ rank }: { rank: 1 | 2 | 3 }) {
  if (rank === 1) return <span aria-label="gold medal">🥇</span>;
  if (rank === 2) return <span aria-label="silver medal">🥈</span>;
  return <span aria-label="bronze medal">🥉</span>;
}

function medalBackdrop(place: 1 | 2 | 3) {
  switch (place) {
    case 1:
      return [
        "border-[#caa44a]/40",
        "bg-gradient-to-b from-[rgba(255,214,102,0.22)] via-[rgba(255,214,102,0.10)] to-[rgba(9,9,9,0.35)]",
        "shadow-[0_0_0_1px_rgba(255,214,102,0.10),0_18px_45px_rgba(0,0,0,0.35)]",
      ].join(" ");
    case 2:
      return [
        "border-[rgba(210,210,215,0.35)]",
        "bg-gradient-to-b from-[rgba(220,220,230,0.16)] via-[rgba(220,220,230,0.08)] to-[rgba(9,9,9,0.35)]",
        "shadow-[0_0_0_1px_rgba(220,220,230,0.08),0_18px_45px_rgba(0,0,0,0.35)]",
      ].join(" ");
    case 3:
    default:
      return [
        "border-[rgba(206,143,90,0.38)]",
        "bg-gradient-to-b from-[rgba(206,143,90,0.20)] via-[rgba(206,143,90,0.09)] to-[rgba(9,9,9,0.35)]",
        "shadow-[0_0_0_1px_rgba(206,143,90,0.08),0_18px_45px_rgba(0,0,0,0.35)]",
      ].join(" ");
  }
}

function topRankBadge(rank: 1 | 2 | 3) {
  // Small “medal plate” badge for the table rank column
  switch (rank) {
    case 1:
      return [
        "border-[#caa44a]/45",
        "bg-[rgba(255,214,102,0.12)]",
        "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.20),0_0_22px_rgba(255,214,102,0.06)]",
        "text-[rgba(255,245,210,0.95)]",
      ].join(" ");
    case 2:
      return [
        "border-[rgba(210,210,215,0.40)]",
        "bg-[rgba(220,220,230,0.10)]",
        "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.20),0_0_18px_rgba(220,220,230,0.05)]",
        "text-[rgba(245,245,250,0.95)]",
      ].join(" ");
    case 3:
    default:
      return [
        "border-[rgba(206,143,90,0.42)]",
        "bg-[rgba(206,143,90,0.11)]",
        "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.20),0_0_18px_rgba(206,143,90,0.05)]",
        "text-[rgba(255,240,230,0.95)]",
      ].join(" ");
  }
}

function TopCard({
  place,
  name,
  score,
  isChampion,
  className = "",
}: {
  place: 1 | 2 | 3;
  name: string;
  score: number;
  isChampion?: boolean;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-4 transition-transform duration-200",
        "bg-zinc-950/35",
        "shadow-sm shadow-black/30",
        medalBackdrop(place),
        isChampion ? "md:scale-[1.035] md:-translate-y-[2px]" : "hover:brightness-[1.06]",
        className,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm text-zinc-200/90 flex items-center gap-2">
            <span className="text-lg">
              <Medal rank={place} />
            </span>
            <span className="font-semibold">
              #{place} {isChampion ? "Champion" : ""}
            </span>
          </div>

          <div
            className={[
              "mt-1 font-semibold text-zinc-100 truncate",
              isChampion ? "text-xl" : "text-lg",
            ].join(" ")}
            title={name}
          >
            {name}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-1 text-sm font-semibold tabular-nums text-zinc-100">
          {fmt(score)}
        </div>
      </div>

      <div className="mt-3 text-xs text-zinc-500">
        Spotlight score: <span className="text-zinc-200">{fmt(score)}</span>
      </div>
    </div>
  );
}

function RankMark({ rank }: { rank: number }) {
  if (rank === 1) return <span aria-label="gold medal">🥇</span>;
  if (rank === 2) return <span aria-label="silver medal">🥈</span>;
  if (rank === 3) return <span aria-label="bronze medal">🥉</span>;
  return <span>{rank}</span>;
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
    typeof sp.board === "string" && boardKeys.includes(sp.board) ? sp.board : "overall";

  const sortKey: SortKey =
    typeof sp.sort === "string" && ["personal", "occ", "gather", "pvp", "life"].includes(sp.sort)
      ? (sp.sort as SortKey)
      : "personal";

  const page = Math.max(1, Number(sp.page ?? 1));
  const qRaw = typeof sp.q === "string" ? sp.q : "";
  const qNorm = qRaw.toLowerCase();

  const board = data.boards[boardKey];
  const merged = dedupeEntries(board.entries);

  const filtered = qNorm ? merged.filter((e) => e.name.toLowerCase().includes(qNorm)) : merged;
  const sorted = [...filtered].sort((a, b) => scoreFor(b, sortKey) - scoreFor(a, sortKey));

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = sorted.slice(start, start + PAGE_SIZE);

  const showingFrom = total === 0 ? 0 : start + 1;
  const showingTo = Math.min(start + PAGE_SIZE, total);

  const current = { board: boardKey, sort: sortKey, page: safePage, q: qRaw };
  const prevHref = safePage > 1 ? makeHref({ page: safePage - 1 }, current) : "";
  const nextHref = safePage < totalPages ? makeHref({ page: safePage + 1 }, current) : "";

  const updated = data.updatedAt ? new Date(data.updatedAt) : null;
  const updatedText =
    updated && !Number.isNaN(updated.getTime()) ? updated.toLocaleString() : "";

  const top1 = sorted[0];
  const top2 = sorted[1];
  const top3 = sorted[2];

  const sortIcon = iconForSort(sortKey);
  const sortLabel = labelForSort(sortKey);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-[28px] p-[1px] bg-gradient-to-b from-red-500/12 via-zinc-800/55 to-zinc-900/25 shadow-[0_0_36px_rgba(239,68,68,0.06)]">
          <div className="ornament-frame rounded-3xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-sm p-6 pb-24 shadow-2xl shadow-black/40">
            {/* Roots intentionally removed */}

            <div className="frame-surface space-y-6">
              {/* Header */}
              <header className="row-banner anim-fade-up">
                <div className="row-banner-inner">
                  {/* Reverted to original simple kicker */}
                  <div className="row-kicker">Home of 671</div>

                  <h1 className="row-title">
                    Roots of War <span className="row-title-ember">Leaderboard</span>
                  </h1>

                  <div className="row-sep" aria-hidden="true" />
                </div>
              </header>

              <div className="anim-fade-up anim-delay-1">
                <Controls
                  boardKeys={boardKeys}
                  boardTitles={Object.fromEntries(boardKeys.map((k) => [k, data.boards[k].title]))}
                  activeBoard={boardKey}
                  activeSort={sortKey}
                  activePage={safePage}
                  activeQuery={qRaw}
                />
              </div>

              {/* Top 3 */}
              {top1 ? (
                <section className="rounded-2xl border border-zinc-800 bg-zinc-900/25 overflow-hidden shadow-[0_0_0_1px_rgba(239,68,68,0.05)] anim-fade-up anim-delay-2">
                  <div className="px-5 py-4 bg-zinc-950/35">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">🏆</span>
                        <div>
                          <div className="font-semibold tracking-tight text-xl md:text-2xl">
                            Top 3
                          </div>
                          <div className="text-sm md:text-base text-zinc-400">
                            Based on <span className="text-zinc-200">{sortLabel}</span>
                          </div>
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/40 px-3 py-1 text-xs text-zinc-300">
                        <span className="text-zinc-500">Metric:</span>
                        <span className="text-base leading-none">{sortIcon}</span>
                        <span className="text-zinc-100 font-semibold">{sortLabel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-zinc-800/70 bg-gradient-to-b from-zinc-950/10 to-transparent p-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      {top2 ? (
                        <TopCard
                          place={2}
                          name={top2.name}
                          score={scoreFor(top2, sortKey)}
                          className="anim-fade-up anim-delay-1"
                        />
                      ) : (
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/35 p-4 text-zinc-500 anim-fade-up anim-delay-1">
                          <div className="text-sm">🥈 #2</div>
                          <div className="mt-2 text-sm">Not enough players to fill Top 3.</div>
                        </div>
                      )}

                      <TopCard
                        place={1}
                        name={top1.name}
                        score={scoreFor(top1, sortKey)}
                        isChampion
                        className="anim-fade-up"
                      />

                      {top3 ? (
                        <TopCard
                          place={3}
                          name={top3.name}
                          score={scoreFor(top3, sortKey)}
                          className="anim-fade-up anim-delay-2"
                        />
                      ) : (
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/35 p-4 text-zinc-500 anim-fade-up anim-delay-2">
                          <div className="text-sm">🥉 #3</div>
                          <div className="mt-2 text-sm">Not enough players to fill Top 3.</div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              ) : null}

              {/* Table */}
              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/25 overflow-hidden shadow-[0_0_0_1px_rgba(239,68,68,0.04)] anim-fade-up anim-delay-3">
                <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/25">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                      <span className="text-zinc-500">Legend:</span>
                      <span>
                        ⭐ <span className="text-zinc-200">Personal</span>
                      </span>
                      <span className="text-zinc-700">•</span>
                      <span>
                        🏰 <span className="text-zinc-200">Occ</span>
                      </span>
                      <span className="text-zinc-700">•</span>
                      <span>
                        ⛏️ <span className="text-zinc-200">Gather</span>
                      </span>
                      <span className="text-zinc-700">•</span>
                      <span>
                        ⚔️ <span className="text-zinc-200">PvP</span>
                      </span>
                      <span className="text-zinc-700">•</span>
                      <span>
                        🌀 <span className="text-zinc-200">Life</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-center">
                      <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/35 px-3 py-1 text-xs text-zinc-300">
                        <span className="text-zinc-500">Sorting:</span>
                        <span className="text-base leading-none">{sortIcon}</span>
                        <span className="text-zinc-100 font-semibold">{sortLabel}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[860px] w-full">
                    <thead className="sticky top-0 z-10 bg-zinc-950/70 backdrop-blur-md border-b border-zinc-800">
                      <tr className="text-left text-xs uppercase tracking-wider text-zinc-400">
                        <th className="py-3 px-4 w-[76px]">Rank</th>
                        <th className="py-3 px-4">Player</th>
                        <th className="py-3 px-4 text-right w-[140px]">
                          <span className="inline-flex items-center gap-2 justify-end w-full">
                            <span className="text-sm">⭐</span>
                            <span>Personal</span>
                          </span>
                        </th>
                        <th className="py-3 px-4 text-right w-[140px]">
                          <span className="inline-flex items-center gap-2 justify-end w-full">
                            <span className="text-sm">🏰</span>
                            <span>Occ</span>
                          </span>
                        </th>
                        <th className="py-3 px-4 text-right w-[140px]">
                          <span className="inline-flex items-center gap-2 justify-end w-full">
                            <span className="text-sm">⛏️</span>
                            <span>Gather</span>
                          </span>
                        </th>
                        <th className="py-3 px-4 text-right w-[140px]">
                          <span className="inline-flex items-center gap-2 justify-end w-full">
                            <span className="text-sm">⚔️</span>
                            <span>PvP</span>
                          </span>
                        </th>
                        <th className="py-3 px-4 text-right w-[140px]">
                          <span className="inline-flex items-center gap-2 justify-end w-full">
                            <span className="text-sm">🌀</span>
                            <span>Life</span>
                          </span>
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-zinc-800">
                      {pageItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10 px-4 text-center text-zinc-400">
                            No results.
                          </td>
                        </tr>
                      ) : (
                        pageItems.map((e, i) => {
                          const rank = start + i + 1;

                          return (
                            <tr
                              key={`${e.name}-${rank}`}
                              className={[
                                "group relative transition-colors",
                                "hover:bg-zinc-900/55",
                                "hover:shadow-[inset_0_0_0_1px_rgba(239,68,68,0.10)]",
                                rank % 2 === 0 ? "bg-zinc-950/15" : "bg-transparent",
                              ].join(" ")}
                            >
                              <td className="py-3 px-4">
                                <span
                                  className={[
                                    "inline-flex items-center justify-center w-10 h-8 rounded-xl border text-sm font-semibold transition-colors",
                                    rank === 1
                                      ? topRankBadge(1)
                                      : rank === 2
                                      ? topRankBadge(2)
                                      : rank === 3
                                      ? topRankBadge(3)
                                      : "border-zinc-700/70 bg-zinc-950/25 text-zinc-200",
                                  ].join(" ")}
                                >
                                  <RankMark rank={rank} />
                                </span>
                              </td>

                              <td className="py-3 px-4">
                                <div className="min-w-0">
                                  <div className="font-medium text-zinc-100 truncate">{e.name}</div>
                                  <div className="text-xs text-zinc-500">
                                    {rank <= 3 ? "Top 3" : "Ranked"}
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-4 text-right font-semibold tabular-nums">
                                {fmt(personal(e))}
                              </td>
                              <td className="py-3 px-4 text-right text-zinc-200 tabular-nums">
                                {fmt(e.occ)}
                              </td>
                              <td className="py-3 px-4 text-right text-zinc-200 tabular-nums">
                                {fmt(e.gather)}
                              </td>
                              <td className="py-3 px-4 text-right text-zinc-200 tabular-nums">
                                {fmt(e.pvp)}
                              </td>
                              <td className="py-3 px-4 text-right text-zinc-200 tabular-nums">
                                {fmt(e.life)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="px-4 py-3 border-t border-zinc-800 text-xs text-zinc-500">
                  Tip: on smaller screens, scroll sideways to see all columns.
                </div>
              </section>

              {/* Sticky footer */}
              <StickyFooter className="-mx-6">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={prevHref || "#"}
                      aria-disabled={!prevHref}
                      className={[
                        "px-3 py-2 rounded-xl border text-sm select-none",
                        prevHref
                          ? "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900/40"
                          : "border-zinc-800 text-zinc-600 cursor-not-allowed",
                      ].join(" ")}
                    >
                      ⏮️ Prev
                    </a>

                    <div className="text-sm text-zinc-400 px-2">
                      Page <span className="text-zinc-200">{safePage}</span> /{" "}
                      <span className="text-zinc-200">{totalPages}</span>
                    </div>

                    <a
                      href={nextHref || "#"}
                      aria-disabled={!nextHref}
                      className={[
                        "px-3 py-2 rounded-xl border text-sm select-none",
                        nextHref
                          ? "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900/40"
                          : "border-zinc-800 text-zinc-600 cursor-not-allowed",
                      ].join(" ")}
                    >
                      Next ⏭️
                    </a>
                  </div>

                  <div className="text-sm text-zinc-400 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                    <span>
                      Sorted by <span className="text-zinc-200">{sortLabel}</span>
                    </span>
                    <span className="hidden sm:inline text-zinc-700">•</span>
                    <span>
                      Showing{" "}
                      <span className="text-zinc-200">
                        {showingFrom}-{showingTo}
                      </span>{" "}
                      of <span className="text-zinc-200">{fmt(total)}</span>
                    </span>
                    {updatedText ? (
                      <>
                        <span className="hidden sm:inline text-zinc-700">•</span>
                        <span title={data.updatedAt}>Updated {updatedText}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </StickyFooter>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
