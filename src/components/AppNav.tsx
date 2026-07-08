import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Gamepad2, LayoutDashboard, Table2, BarChart3, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/games", label: "Games", icon: Table2 },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

export function AppNav({ email }: { email: string }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-4 md:px-8">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-console glow-primary">
            <Gamepad2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold tracking-tight text-lg">PixelLog</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active = path === l.to;
            const Icon = l.icon;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                )}
              >
                <Icon className="h-4 w-4" />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden sm:inline text-xs text-muted-foreground font-mono truncate max-w-[200px]">{email}</span>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>

      {/* Mobile nav row */}
      <nav className="md:hidden flex items-center gap-1 border-t border-border/60 px-4 py-2 overflow-x-auto">
        {links.map((l) => {
          const active = path === l.to;
          const Icon = l.icon;
          return (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap",
                active ? "bg-secondary text-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
