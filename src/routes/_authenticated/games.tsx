import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GameFormDialog } from "@/components/GameFormDialog";
import { fetchGames, STATUSES, STATUS_COLOR, type Game, type GameStatus } from "@/lib/games";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/games")({
  head: () => ({
    meta: [
      { title: "Games — PixelLog" },
      { name: "description", content: "Your full game library, filterable and sortable." },
    ],
  }),
  component: GamesPage,
});

function GamesPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: games = [], isLoading } = useQuery({ queryKey: ["games"], queryFn: fetchGames });

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<GameStatus | "all">("all");
  const [editing, setEditing] = useState<Game | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<Game | null>(null);

  const filtered = useMemo(() => {
    return games.filter((g) => {
      if (status !== "all" && g.status !== status) return false;
      if (q.trim()) {
        const t = q.toLowerCase();
        return (
          g.title.toLowerCase().includes(t) ||
          g.platform.toLowerCase().includes(t) ||
          g.genre.toLowerCase().includes(t)
        );
      }
      return true;
    });
  }, [games, q, status]);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("games").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["games"] });
      toast.success("Game deleted");
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-accent font-mono">Library</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-bold tracking-tight">Games</h1>
          <p className="mt-1 text-muted-foreground">{filtered.length} of {games.length} shown</p>
        </div>
        <Button
          onClick={() => { setEditing(null); setDialogOpen(true); }}
          className="gradient-console text-primary-foreground hover:opacity-90 glow-primary gap-2"
        >
          <Plus className="h-4 w-4" /> Add game
        </Button>
      </header>

      <div className="panel p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, platform, genre…" className="pl-9" />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as GameStatus | "all")}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/40 hover:bg-secondary/40">
              <TableHead>Title</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Genre</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Rating</TableHead>
              <TableHead className="text-right">Hours</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">Loading…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                {games.length === 0 ? "No games yet — click Add game to log your first title." : "No matches for those filters."}
              </TableCell></TableRow>
            ) : (
              filtered.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.title}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{g.platform}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{g.genre}</TableCell>
                  <TableCell>
                    <span className={cn("inline-block text-xs px-2 py-1 rounded-md font-medium capitalize", STATUS_COLOR[g.status])}>
                      {g.status.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">{g.rating ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono">{Number(g.hours_played).toFixed(1)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(g); setDialogOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleting(g)}
                        className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <GameFormDialog open={dialogOpen} onOpenChange={setDialogOpen} userId={user.id} game={editing} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this game?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleting?.title}" will be removed from your library. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleting && del.mutate(deleting.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
