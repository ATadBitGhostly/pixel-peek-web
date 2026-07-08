import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Game = Database["public"]["Tables"]["games"]["Row"];
export type GameInsert = Database["public"]["Tables"]["games"]["Insert"];
export type GameUpdate = Database["public"]["Tables"]["games"]["Update"];
export type GameStatus = Database["public"]["Enums"]["game_status"];

export const STATUSES: { value: GameStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "playing", label: "Playing" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On hold" },
  { value: "dropped", label: "Dropped" },
];

export const STATUS_COLOR: Record<GameStatus, string> = {
  backlog: "bg-muted text-muted-foreground",
  playing: "bg-primary/20 text-primary border border-primary/40",
  completed: "bg-accent/20 text-accent border border-accent/40",
  on_hold: "bg-chart-4/20 text-chart-4 border border-chart-4/40",
  dropped: "bg-destructive/15 text-destructive border border-destructive/40",
};

export async function fetchGames(): Promise<Game[]> {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
