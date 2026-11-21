import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Volume2, VolumeX, LogOut } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { FloatingMemes } from "@/components/FloatingMemes";
import { Button } from "@/components/ui/button";
import { profileQuery } from "@/lib/data";
import { isMuted, setMuted } from "@/lib/sound";
import { cn } from "@/lib/utils";

// Session lives in browser storage, so the gate runs client-side only.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/", replace: true });
  },
  component: AppShell,
});

const NAV = [
  { to: "/home", label: "Home", emoji: "🏠" },
  { to: "/add", label: "Add", emoji: "➕" },
  { to: "/friends", label: "Dost", emoji: "👯" },
  { to: "/leaderboard", label: "Tier List", emoji: "🏆" },
  { to: "/court", label: "Court", emoji: "⚖️" },
] as const;

function AppShell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery(profileQuery);
  const [muted, setMutedState] = useState(false);

  useEffect(() => setMutedState(isMuted()), []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="relative min-h-screen pb-28 md:pb-10">
      <FloatingMemes count={10} />
      <header className="sticky top-0 z-30 border-b-2 border-ink bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <Link to="/home" className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl border-2 border-ink bg-secondary text-xl shadow-sticker-sm">
              ⚖️
            </span>
            <span className="font-display text-xl font-extrabold">
              Peace<span className="text-primary">keeper</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-xl border-2 border-transparent px-3 py-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "!border-ink !bg-secondary !text-foreground shadow-sticker-sm" }}
              >
                {n.emoji} {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {profile && (
              <span className="hidden font-hand text-xl lg:inline">
                Namaste, {profile.display_name} 👋
              </span>
            )}
            <Button
              variant="outline"
              size="icon"
              aria-label={muted ? "Sound on karo" : "Sound band karo"}
              onClick={() => {
                setMuted(!muted);
                setMutedState(!muted);
              }}
            >
              {muted ? <VolumeX /> : <Volume2 />}
            </Button>
            <Button variant="outline" size="icon" aria-label="Logout" onClick={signOut}>
              <LogOut />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 gap-1 rounded-2xl border-2 border-ink bg-card p-1.5 shadow-sticker md:hidden">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className={cn("flex flex-col items-center rounded-xl py-1.5 text-[11px] font-bold text-muted-foreground")}
            activeProps={{ className: "!bg-secondary !text-foreground" }}
          >
            <span className="text-xl">{n.emoji}</span>
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
