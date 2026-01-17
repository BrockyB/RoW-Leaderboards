"use client";

import { useMemo, useState } from "react";

type Props = {
  boardKeys: string[];
  boardTitles: Record<string, string>;
  activeBoard: string;
  activeSort: string;
  activePage: number;
  activeQuery?: string;
};

export default function Controls({
  boardKeys,
  boardTitles,
  activeBoard,
  activeSort,
  activePage,
  activeQuery = "",
}: Props) {
  const [query, setQuery] = useState(activeQuery);

  const { primary, archived } = useMemo(() => {
    const keys = [...boardKeys];

    const primaryOrder = ["overall", "thisWeek"];
    const primaryKeys = primaryOrder.filter((k) => keys.includes(k));

    const archivedKeys = keys.filter((k) => !primaryKeys.includes(k));

    // Sort archived by title (so weeks appear nicely)
    archivedKeys.sort((a, b) => {
      const ta = (boardTitles[a] ?? a).toLowerCase();
      const tb = (boardTitles[b] ?? b).toLowerCase();
      return ta.localeCompare(tb);
    });

    return { primary: primaryKeys, archived: archivedKeys };
  }, [boardKeys, boardTitles]);

  const makeHref = (next: Partial<{ board: string; sort: string; page: number; q: string }>) => {
    const b = next.board ?? activeBoard;
    const s = next.sort ?? activeSort;
    const p = next.page ?? activePage;
    const q = next.q ?? activeQuery;

    const params = new URLSearchParams();
    params.set("board", b);
    params.set("sort", s);
    params.set("page", String(p));
    if (q) params.set("q", q);

    return `/?${params.toString()}`;
  };

  const go = (next: Partial<{ board: string; sort: string; page: number; q: string }>) => {
    window.location.href = makeHref(next);
  };

  return (
    <section className="rounded-2xl bg-zinc-900/40 border border-zinc-800 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      {/* Left: board controls + search */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-zinc-400">Board:</span>

          {primary.map((k) => {
            const active = k === activeBoard;
            return (
              <button
                key={k}
                onClick={() => go({ board: k, page: 1 })}
                className={[
                  "px-3 py-1 rounded-full border text-sm",
                  active
                    ? "bg-zinc-100 text-zinc-900 border-zinc-100"
                    : "border-zinc-700 text-zinc-200 hover:border-zinc-500",
                ].join(" ")}
              >
                {boardTitles[k] ?? k}
              </button>
            );
          })}

          {archived.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">Archive:</span>
              <select
                value={archived.includes(activeBoard) ? activeBoard : ""}
                className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-200"
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) go({ board: v, page: 1 });
                }}
              >
                <option value="">Select week…</option>
                {archived.map((k) => (
                  <option key={k} value={k}>
                    {boardTitles[k] ?? k}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">Search:</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") go({ q: query.trim(), page: 1 });
            }}
            placeholder="Player name…"
            className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm w-56 text-zinc-100"
          />
          <button
            onClick={() => go({ q: query.trim(), page: 1 })}
            className="px-3 py-2 rounded-xl border border-zinc-700 hover:border-zinc-500 text-sm"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Right: sort */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-zinc-400" htmlFor="sort">
          Sort:
        </label>

        <select
          id="sort"
          value={activeSort}
          className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm"
          onChange={(e) => go({ sort: e.target.value, page: 1 })}
        >
          <option value="personal">Personal</option>
          <option value="occ">Occupational</option>
          <option value="gather">Gathering</option>
          <option value="pvp">PvP</option>
          <option value="life">Lifestone</option>
        </select>
      </div>
    </section>
  );
}
