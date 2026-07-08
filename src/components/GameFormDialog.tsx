import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Game, GameStatus } from "@/lib/games";
import { STATUSES } from "@/lib/games";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  game?: Game | null;
}

type FormState = {
  title: string;
  platform: string;
  genre: string;
  status: GameStatus;
  rating: string;
  hours_played: string;
  completed_at: string;
  notes: string;
};

const empty: FormState = {
  title: "", platform: "", genre: "", status: "backlog",
  rating: "", hours_played: "0", completed_at: "", notes: "",
};

export function GameFormDialog({ open, onOpenChange, userId, game }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(empty);

  useEffect(() => {
    if (game) {
      setForm({
        title: game.title,
        platform: game.platform,
        genre: game.genre,
        status: game.status,
        rating: game.rating?.toString() ?? "",
        hours_played: game.hours_played.toString(),
        completed_at: game.completed_at ?? "",
        notes: game.notes ?? "",
      });
    } else {
      setForm(empty);
    }
  }, [game, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: userId,
        title: form.title.trim(),
        platform: form.platform.trim(),
        genre: form.genre.trim(),
        status: form.status,
        rating: form.rating === "" ? null : Number(form.rating),
        hours_played: Number(form.hours_played) || 0,
        completed_at: form.completed_at || null,
        notes: form.notes.trim() || null,
      };
      if (game) {
        const { error } = await supabase.from("games").update(payload).eq("id", game.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("games").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["games"] });
      toast.success(game ? "Game updated" : "Game added");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{game ? "Edit game" : "Add a game"}</DialogTitle>
          <DialogDescription>
            {game ? "Update your entry." : "Log a new title in your library."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="col-span-2 space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" required maxLength={200}
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Input id="platform" required placeholder="PS5, PC, Switch…"
              value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="genre">Genre</Label>
            <Input id="genre" required placeholder="RPG, FPS, Indie…"
              value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as GameStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rating">Rating (0–10)</Label>
            <Input id="rating" type="number" min={0} max={10} step={1}
              value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours">Hours played</Label>
            <Input id="hours" type="number" min={0} step={0.5}
              value={form.hours_played} onChange={(e) => setForm({ ...form, hours_played: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="completed">Completed on</Label>
            <Input id="completed" type="date"
              value={form.completed_at} onChange={(e) => setForm({ ...form, completed_at: e.target.value })} />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} maxLength={1000}
              value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <DialogFooter className="col-span-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}
              className="gradient-console text-primary-foreground hover:opacity-90">
              {mutation.isPending ? "Saving…" : game ? "Save changes" : "Add game"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
