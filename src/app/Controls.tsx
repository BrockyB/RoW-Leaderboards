"use client";

type Props = {
  boardKeys: string[];
  boardTitles: Record<string, string>;
  activeBoard: string;
  activeSort: string;
  activePage: number;
  activeQuery: string;
};

export default function Controls({
  boardKeys,
  boardTitles,
  activeBoard,
  activeSort,
  activePage,
  activeQuery,
}: Props) {
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

  return (
    <section className="rounded-2xl bg-zinc-900/40 border border-zinc-800 p-4 flex flex-col gap-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Board tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-zinc-400">Board:</span>

          {boardKeys.map((k) => {
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
        </div>

        {/* Sort dropdown */}
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

      {/* Search */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">Search:</span>
          <input
            defaultValue={activeQuery}
            placeholder="Player name..."
            className="w-64 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm"
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              const v = (e.currentTarget.value || "").trim();
              window.location.href = makeHref({ q: v, page: 1 });
            }}
          />
          <button
            className="px-3 py-2 rounded-xl border border-zinc-700 text-sm hover:border-zinc-500"
            onClick={() => {
              const el = document.querySelector<HTMLInputElement>('input[placeholder="Player name..."]');
              const v = (el?.value || "").trim();
              window.location.href = makeHref({ q: v, page: 1 });
            }}
          >
            Apply
          </button>

          {activeQuery ? (
            <a
              href={makeHref({ q: "", page: 1 })}
              className="text-sm text-zinc-400 hover:text-zinc-200"
            >
              Clear
            </a>
          ) : null}
        </div>

        <div className="text-xs text-zinc-500">
          Tip: press Enter to search
        </div>
      </div>
    </section>
  );
}
