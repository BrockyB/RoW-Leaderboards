"use client";

type Props = {
  boardKeys: string[];
  boardTitles: Record<string, string>;
  activeBoard: string;
  activeSort: string;
  activePage: number;
};

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

  return (
    <section className="rounded-2xl bg-zinc-900/40 border border-zinc-800 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
