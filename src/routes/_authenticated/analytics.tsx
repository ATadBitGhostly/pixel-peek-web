import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";

import { fetchGames } from "@/lib/games";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — PixelLog" },
      { name: "description", content: "Genre, platform, status and rating reports for your game library." },
    ],
  }),
  component: AnalyticsPage,
});

const PALETTE = [
  "var(--chart-1)", "var(--chart-2)", "var(--chart-3)",
  "var(--chart-4)", "var(--chart-5)",
];

function AnalyticsPage() {
  const { data: games = [], isLoading } = useQuery({ queryKey: ["games"], queryFn: fetchGames });

  const { byGenre, byPlatform, byStatus, byRating } = useMemo(() => {
    const genre = new Map<string, number>();
    const platform = new Map<string, { count: number; hours: number }>();
    const status = new Map<string, number>();
    const rating = new Map<number, number>();

    for (const g of games) {
      genre.set(g.genre, (genre.get(g.genre) ?? 0) + 1);
      const p = platform.get(g.platform) ?? { count: 0, hours: 0 };
      p.count += 1; p.hours += Number(g.hours_played || 0);
      platform.set(g.platform, p);
      status.set(g.status, (status.get(g.status) ?? 0) + 1);
      if (g.rating !== null) rating.set(g.rating, (rating.get(g.rating) ?? 0) + 1);
    }

    return {
      byGenre: Array.from(genre, ([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      byPlatform: Array.from(platform, ([name, v]) => ({ name, games: v.count, hours: Number(v.hours.toFixed(1)) }))
        .sort((a, b) => b.hours - a.hours),
      byStatus: Array.from(status, ([name, value]) => ({
        name: name.replace("_", " "), value,
      })),
      byRating: Array.from({ length: 11 }, (_, i) => ({ name: String(i), value: rating.get(i) ?? 0 })),
    };
  }, [games]);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-widest text-accent font-mono">Reports</p>
        <h1 className="mt-1 text-3xl md:text-4xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-muted-foreground">Break down your library by genre, platform, status and rating.</p>
      </header>

      {isLoading ? (
        <div className="panel p-10 text-center text-muted-foreground">Loading…</div>
      ) : games.length === 0 ? (
        <div className="panel p-10 text-center text-muted-foreground">
          Add some games first to see reports appear here.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Games by genre" hint="How your library is distributed">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byGenre}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="value" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Status breakdown" hint="Where each game stands">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                  {byStatus.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Hours per platform" hint="Where you spend your time">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byPlatform} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={12} width={90} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="hours" fill="var(--chart-2)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Rating distribution" hint="How generous is your scoring?">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byRating}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="value" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--popover-foreground)",
  fontSize: 12,
};

function ChartCard({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="panel p-6">
      <div className="mb-4">
        <h2 className="font-semibold tracking-tight">{title}</h2>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      {children}
    </div>
  );
}
