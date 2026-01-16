"use client";

type Props = {
  boardKeys: string[];
  boardTitles: Record<string, string>;
  activeBoard: string;
  activeSort: string;
  activePage: number;
};

function isArchivedWeekKey(k: string) {
  return k.startsWith("week_"); // week_YYYY-MM-DD
}

function mmdd(iso: string) {
  // iso: YYYY-MM-DD
  const mm = iso.slice(5, 7);
  const dd = iso.slice(8, 10);
  if (mm.length === 2 && dd.length === 2) return `${mm}-${dd}`;
  return iso;
}

function archivedWeekLabel(key: string, titleFromData?: string) {
  // Use stored title if present, but strip anything in parentheses just in case
  const t = (titleFromData ?? "").replace(/\(.*?\)/g, "");
  const matches = t.match(/\d{4}-\d{2}-\d{2}/g);

  if (matches && matches.length >= 2) {
    const start = matches[0];
    const end = matches[1];
    return `Week ${mmdd(start)} \u2192 ${mmdd(end)}`;
  }

  // Fallback: use key start only
  const startIso = key.slice("week_".length);
  return `Week ${mmdd(startIso)}`;
}

export default function Controls({
  boardKeys,
  boardTitles,
  activeBoard,
  activeSort,
  activePage,
}: Props) {
  const makeHref = (next: Partial<{ board: string; sort: string; page: number }>) => {
    const b = next.board ?? activeBoard;
    const s = next.sort ?? activeSort;
    const p = next.page ?? activePage;
    return `/?board=${encodeURIComponent(b)}&sort=${encodeURIComponent(s)}&page=${p}`;
  };

  const hasOverall = boardKeys.includes("overall");
  const hasThisWeek = boardKeys.includes("thisWeek");

  const archivedWeeks = [...boardKeys]
    .filter(isArchivedWeekKey)
    // newest -> oldest
    .sort((a, b) => b.localeCompare(a));

  const defaultWeekKey = isArchivedWeekKey(activeBoard)
    ? activeBoard
    : archivedWeeks[0] ?? "";

  return (
    <section className="rounded-2xl bg-zinc-900/40 border border-zinc-800 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
    </section>
  );
}
