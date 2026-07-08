import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Gamepad2, Trophy, Clock, Star, Plus, ArrowRight } from "lucide-react";

import { fetchGames, STATUS_COLOR } from "@/lib/games";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — PixelLog" },
      { name: "description", content: "Your game library at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: games = [], isLoading } = useQuery({ queryKey: ["games"], queryFn: fetchGames });

  const total = games.length;
  const completed = games.filter((g) => g.status === "completed").length;
  const playing = games.filter((g) => g.status === "playing").length;
  const backlog = games.filter((g) => g.status === "backlog").length;
  const totalHours = games.reduce((s, g) => s + Number(g.hours_played || 0), 0);
  const rated = games.filter((g) => g.rating !== null);
  const avgRating = rated.length
    ? (rated.reduce((s, g) => s + (g.rating ?? 0), 0) / rated.length).toFixed(1)
    : "—";
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  const recent = [...games].slice(0, 5);
  const topRated = [...games]
    .filter((g) => g.rating !== null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-accent font-mono">Console</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">A snapshot of your gaming library.</p>
        </div>
        <Link
          to="/games"
          className="inline-flex items-center gap-2 rounded-lg gradient-console px-4 py-2.5 text-sm font-semibold text-primary-foreground glow-primary hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Add game
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Gamepad2 />} label="Total games" value={String(total)} hint={`${backlog} in backlog`} accent="primary" />
        <StatCard icon={<Trophy />} label="Completed" value={String(completed)} hint={`${completionRate}% completion`} accent="accent" />
        <StatCard icon={<Clock />} label="Total hours" value={totalHours.toFixed(1)} hint={`${playing} in progress`} accent="chart-3" />
        <StatCard icon={<Star />} label="Avg rating" value={String(avgRating)} hint={`${rated.length} rated`} accent="chart-4" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Recent additions" href="/games">
          {isLoading ? (
            <Skeleton />
          ) : recent.length === 0 ? (
            <Empty label="No games yet — add your first one." />
          ) : (
            <ul className="divide-y divide-border/60">
              {recent.map((g) => (
                <li key={g.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{g.title}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{g.platform} · {g.genre}</p>
                  </div>
                  <span className={cn("text-xs px-2 py-1 rounded-md font-medium capitalize", STATUS_COLOR[g.status])}>
                    {g.status.replace("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Top rated" href="/analytics">
          {isLoading ? (
            <Skeleton />
          ) : topRated.length === 0 ? (
            <Empty label="Rate some games to see your top picks." />
          ) : (
            <ul className="divide-y divide-border/60">
              {topRated.map((g) => (
                <li key={g.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{g.title}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{g.platform}</p>
                  </div>
                  <span className="flex items-center gap-1 font-mono text-sm">
                    <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                    {g.rating}
                    <span className="text-muted-foreground">/10</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>
    </div>
  );
}

function StatCard({
  icon, label, value, hint, accent,
}: { icon: React.ReactNode; label: string; value: string; hint: string; accent: "primary" | "accent" | "chart-3" | "chart-4" }) {
  const ringMap = {
    primary: "text-primary bg-primary/15",
    accent: "text-accent bg-accent/15",
    "chart-3": "text-chart-3 bg-chart-3/15",
    "chart-4": "text-chart-4 bg-chart-4/15",
  } as const;
  return (
    <div className="panel p-5 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">{label}</p>
        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center [&>svg]:h-4 [&>svg]:w-4", ringMap[accent])}>
          {icon}
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Panel({ title, href, children }: { title: string; href: "/games" | "/analytics"; children: React.ReactNode }) {
  return (
    <div className="panel p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold tracking-tight">{title}</h2>
        <Link to={href} className="text-xs text-accent hover:underline inline-flex items-center gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {children}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{label}</p>;
}

function Skeleton() {
  return (
    <div className="space-y-3 py-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-10 rounded-md bg-muted/40 animate-pulse" />
      ))}
    </div>
  );
}
