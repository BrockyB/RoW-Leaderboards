"use client";

type Props = {
  boardKeys: string[];
  boardTitles: Record<string, string>;
  activeBoard: string;
  activeSort: string;
  activePage: number;
  activeQuery: string; // NEW
};

function isArchivedWeekKey(k: string) {
  return k.startsWith("week_");
}

function mmdd(iso: string) {
  const mm = iso.slice(5, 7);
  const dd = iso.slice(8, 10);
  if (mm.length === 2 && dd.length === 2) return `${mm}-${dd}`;
  return iso;
}

function archivedWeekLabel(key: string, titleFromData?: string) {
  const t = (titleFromData ?? "").replace(/\(.*?\)/g, "");
  const matches = t.match(/\d{4}-\d{2}-\d{2}/g);

  if (matches && matches.length >= 2) {
    const start = matches[0];
    const end = matches[1];
    return `Week ${mmdd(start)} \u2192 ${mmdd(end)}`;
  }

  const startIso = key.slice("week_".length);
  return `Week ${mmdd(startIso)}`;
}

export default function Controls({
  boardKeys,
  boardTitles,
  activeBoard,
  activeSort,
  activePage,
  activeQuery,
}: Props) {
  const makeHref = (
    next: Partial<{ board: string; sort: string; page: number; q: string }>
  ) => {
    const b = next.board ?? activeBoard;
    const s = next.sort ?? activeSort;
    const p = next.page ?? activePage;
    const q = next.q ?? activeQuery ?? "";

    const qp = new URLSearchParams();
    qp.set("board", b);
    qp.set("sort", s);
    qp.set("page", String(p));
    if (q.trim()) qp.set("q", q.trim());

    return `/?${qp.toString()}`;
  };

  const hasOverall = boardKeys.includes("overall");
  const hasThisWeek = boardKeys.includes("thisWeek");

  const archivedWeeks = [...boardKeys]
    .filter(isArchivedWeekKey)
    .sort((a, b) => b.localeCompare(a));

  const defaultWeekKey = isArchivedWeekKey(activeBoard)
    ? activeBoard
    : archivedWeeks[0] ?? "";

  return (
    <section className="rounded-2xl bg-zinc-900/40 border border-zinc-800 p-4 flex flex-col gap-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Left: Board + archive */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-zinc-400">Board:</span>

          {hasOverall ? (
            <a
              href={makeHref({ board: "overall", page: 1 })}
              className={[
                "px-3 py-1 rounded-full border text-sm",
                activeBoard === "overall"
                  ? "bg-zinc-100 text-zinc-900 border-zinc-100"
                  : "border-zinc-700 text-zinc-200 hover:border-zinc-500",
              ].join(" ")}
            >
              {boardTitles["overall"] ?? "Overall"}
            </a>
          ) : null}

          {hasThisWeek ? (
            <a
              href={makeHref({ board: "thisWeek", page: 1 })}
              className={[
                "px-3 py-1 rounded-full border text-sm",
                activeBoard === "thisWeek"
                  ? "bg-zinc-100 text-zinc-900 border-zinc-100"
                  : "border-zinc-700 text-zinc-200 hover:border-zinc-500",
              ].join(" ")}
            >
              {boardTitles["thisWeek"] ?? "This Week"}
            </a>
          ) : null}

          {archivedWeeks.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">Archive:</span>
              <select
                defaultValue={defaultWeekKey}
                className={[
                  "bg-zinc-950 border rounded-xl px-3 py-2 text-sm",
                  isArchivedWeekKey(activeBoard)
                    ? "border-zinc-100 text-zinc-100"
                    : "border-zinc-700 text-zinc-100",
                ].join(" ")}
                onChange={(e) => {
                  window.location.href = makeHref({ board: e.target.value, page: 1 });
                }}
              >
                {archivedWeeks.map((k) => (
                  <option key={k} value={k}>
                    {archivedWeekLabel(k, boardTitles[k])}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        {/* Right: Sort */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-400" htmlFor="sort">
            Sort:
          </label>

          <select
            id="sort"
            defaultValue={activeSort}
            className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm"
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

      {/* Search row */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 w-full">
          <label className="text-sm text-zinc-400" htmlFor="q">
            Search:
          </label>
          <input
            id="q"
            defaultValue={activeQuery}
            placeholder="Player name…"
            className="w-full md:w-96 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = (e.target as HTMLInputElement).value ?? "";
                window.location.href = makeHref({ q: v, page: 1 });
              }
            }}
          />
          <a
            href={makeHref({ q: activeQuery, page: 1 })}
            className="px-3 py-2 rounded-xl border border-zinc-700 text-sm text-zinc-200 hover:border-zinc-500"
            title="Apply search"
          >
            Apply
          </a>
          {activeQuery.trim() ? (
            <a
              href={makeHref({ q: "", page: 1 })}
              className="px-3 py-2 rounded-xl border border-zinc-800 text-sm text-zinc-400 hover:border-zinc-600"
              title="Clear search"
            >
              Clear
            </a>
          ) : null}
        </div>

        <div className="text-sm text-zinc-500">
          Tip: press <span className="text-zinc-300">Enter</span> to search
        </div>
      </div>
    </section>
  );
}
