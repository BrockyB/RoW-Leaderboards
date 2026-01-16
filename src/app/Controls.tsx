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

function weekLabelFromKey(k: string) {
  // week_2026-01-16 -> Week 01-16
  const d = k.slice("week_".length); // YYYY-MM-DD
  const mm = d.slice(5, 7);
  const dd = d.slice(8, 10);
  if (mm.length === 2 && dd.length === 2) return `Week ${mm}-${dd}`;
  return k;
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

  // Split boards
  const hasOverall = boardKeys.includes("overall");
  const hasThisWeek = boardKeys.includes("thisWeek");

  const archivedWeeks = [...boardKeys]
    .filter(isArchivedWeekKey)
    // newest -> oldest (lexicographic works for YYYY-MM-DD)
    .sort((a, b) => b.localeCompare(a));

  // If user is currently viewing an archived week, show it selected.
  // Otherwise default dropdown selection to newest archived week (if any),
  // but do not auto-navigate; it’s just the control’s default.
  const defaultWeekKey =
    isArchivedWeekKey(activeBoard) ? activeBoard : archivedWeeks[0] ?? "";

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

        {/* Archived weeks dropdown */}
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
                  {weekLabelFromKey(k)}
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
