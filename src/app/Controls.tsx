"use client";

import { useMemo, useState } from "react";

type Props = {
  boardKeys: string[];
  boardTitles: Record<string, string>;
  activeBoard: string;
  activeSort: string;
  activePage: number;
  activeQ: string; // search query
};

type BoardGroup = {
  tabs: string[]; // e.g. ["overall","thisWeek"]
  archived: string[]; // everything else
};

function groupBoards(keys: string[]): BoardGroup {
  // Put these first if they exist
  const pinnedOrder = ["overall", "thisWeek"];

  const pinned = pinnedOrder.filter((k) => keys.includes(k));
  const rest = keys.filter((k) => !pinned.includes(k));

  // Try to sort archived by something stable (title is usually "Week 01-16 → 01-22")
  // If titles don’t exist, fallback to key
  return { tabs: pinned, archived: rest };
}

export default function Controls({
  boardKeys,
  boardTitles,
  activeBoard,
  activeSort,
  activePage,
  activeQ,
}: Props) {
  const groups = useMemo(() => groupBoards(boardKeys), [boardKeys]);
  const [q, setQ] = useState(activeQ ?? "");

  const makeHref = (next: Partial<{ board: string; sort: string; page: number; q: string }>) => {
    const b = next.board ?? activeBoard;
    const s = next.sort ?? activeSort;
    const p = next.page ?? activePage;
    const query = (next.q ?? q ?? "").trim();

    const params = new URLSearchParams();
    params.set("board", b);
    params.set("sort", s);
    params.set("page", String(p));
    if (query) params.set("q", query);

    return `/?${params.toString()}`;
  };

  const onApplySearch = () => {
    window.location.href = makeHref({ page: 1, q });
  };

  return (
    <section className="rounded-2xl bg-zinc-900/40 border border-zinc-800 p-4 space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Board tabs + archive dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-zinc-400">Board:</span>

          {groups.tabs.map((k) => {
            const active = k === activeBoard;
            return (
              <a
                key={k}
                href={makeHref({ board: k, page: 1 })}
                className={[
                  "px-3 py-1 rounded-full border text-sm",
                  active
                    ? "bg-zinc-100 text-zinc-900 border-zinc-100"
                    : "border-zinc-700 text-zinc-200 hover:border-zinc-500",
                ].join(" ")}
              >
                {boardTitles[k] ?? k}
              </a>
            );
          })}

          {groups.archived.length > 0 ? (
            <div className="flex items-center gap-2 ml-2">
              <span className="text-sm text-zinc-400">Archive:</span>
              <select
                className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100"
                value={groups.archived.includes(activeBoard) ? activeBoard : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) return;
                  window.location.href = makeHref({ board: v, page: 1 });
                }}
              >
                <option value="" disabled>
                  Select week…
                </option>
                {groups.archived
                  .slice()
                  .sort((a, b) => (boardTitles[a] ?? a).localeCompare(boardTitles[b] ?? b))
                  .map((k) => (
                    <option key={k} value={k}>
                      {boardTitles[k] ?? k}
                    </option>
                  ))}
              </select>
            </div>
          ) : null}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-400" htmlFor="sort">
            Sort:
          </label>

          <select
            id="sort"
            value={activeSort}
            className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100"
            onChange={(e) => {
              window.location.href = makeHref({ sort: e.target.value, page: 1 });
            }}
          >
            <option value="personal">Personal</option>
            <option value="occ">Occupational</option>
            <option value="gather">Gathering</option>
            <option value="pvp">PvP</option>
            <option value="life">Lifestone</option>
          </select>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-400" htmlFor="q">
            Search:
          </label>
          <input
            id="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onApplySearch();
            }}
            placeholder="Player name…"
            className="w-72 max-w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
          />
          <button
            onClick={onApplySearch}
            className="px-3 py-2 rounded-xl border border-zinc-700 text-sm text-zinc-200 hover:border-zinc-500"
          >
            Apply
          </button>

          {activeQ ? (
            <a
              href={makeHref({ q: "", page: 1 })}
              className="px-3 py-2 rounded-xl border border-zinc-800 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
            >
              Clear
            </a>
          ) : null}
        </div>

        <div className="text-xs text-zinc-500">
          Tip: press <span className="text-zinc-300">Enter</span> to search
        </div>
      </div>
    </section>
  );
}
