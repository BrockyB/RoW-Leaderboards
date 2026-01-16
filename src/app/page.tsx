import fs from "node:fs/promises";
import path from "node:path";

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

function personal(e: Entry) {
  return (e.occ || 0) + (e.gather || 0) + (e.pvp || 0) + (e.life || 0);
}

export default async function Page() {
  // Read static JSON directly from /public (works locally + on Vercel)
  const filePath = path.join(process.cwd(), "public", "leaderboard.json");
  const raw = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(raw) as Data;

  const board = data.boards.overall;

  const sorted = [...board.entries].sort((a, b) => personal(b) - personal(a));
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-end justify-between gap-4">
          <div>
            <div className="text-sm text-zinc-400">Updated: {data.updatedAt}</div>
            <h1 className="text-3xl font-semibold">🏛️ {board.title} Leaderboard</h1>
          </div>
          <div className="text-sm text-zinc-300 space-x-3">
            <span>🏰 Occ</span>
            <span>⛏️ Gather</span>
            <span>⚔️ PvP</span>
            <span>🌀 Life</span>
          </div>
        </header>

        {/* Top 3 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {top3.map((e, i) => (
            <div
              key={e.name}
              className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4"
            >
              <div className="text-sm text-zinc-400">Rank #{i + 1}</div>
              <div className="text-xl font-semibold truncate">{e.name}</div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>🏰 {e.occ.toLocaleString()}</div>
                <div>⛏️ {e.gather.toLocaleString()}</div>
                <div>⚔️ {e.pvp.toLocaleString()}</div>
                <div>🌀 {e.life.toLocaleString()}</div>
              </div>

              <div className="mt-3 text-sm text-zinc-300">
                Personal:{" "}
                <span className="font-semibold">{personal(e).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </section>

        {/* Rest */}
        <section className="rounded-2xl bg-zinc-900/40 border border-zinc-800 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs uppercase tracking-wide text-zinc-400 border-b border-zinc-800">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Player</div>
            <div className="col-span-2 text-right">Personal</div>
            <div className="col-span-5 text-right">🏰 ⛏️ ⚔️ 🌀</div>
          </div>

          {rest.map((e, idx) => (
            <div
              key={`${idx}-${e.name}`}
              className="grid grid-cols-12 gap-2 px-4 py-3 text-sm border-b border-zinc-900/60"
            >
              <div className="col-span-1 text-zinc-400">{idx + 4}</div>
              <div className="col-span-4 truncate">{e.name}</div>
              <div className="col-span-2 text-right font-semibold">
                {personal(e).toLocaleString()}
              </div>
              <div className="col-span-5 text-right text-zinc-300">
                {e.occ.toLocaleString()} / {e.gather.toLocaleString()} /{" "}
                {e.pvp.toLocaleString()} / {e.life.toLocaleString()}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
