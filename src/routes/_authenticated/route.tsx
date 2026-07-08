import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppNav } from "@/components/AppNav";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { user } = Route.useRouteContext();
  return (
    <div className="min-h-screen flex flex-col">
      <AppNav email={user.email ?? ""} />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <Outlet />
      </main>
    </div>
  );
}
