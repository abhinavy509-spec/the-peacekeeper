import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Volume2, VolumeX, LogOut, Bell, MessageSquare, AlertTriangle, Scale } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { supabase } from "@/integrations/supabase/client";
import { FloatingMemes } from "@/components/FloatingMemes";
import { Calculator } from "@/components/Calculator";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { profileQuery, noticesQuery } from "@/lib/data";
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
  { to: "/chat", label: "Chat", emoji: "💬" },
  { to: "/galla", label: "Galla", emoji: "🏺" },
  { to: "/chores", label: "Roulette", emoji: "🎡" },
  { to: "/court", label: "Court", emoji: "⚖️" },
  { to: "/leaderboard", label: "Tier List", emoji: "🏆" },
] as const;

const MOBILE_NAV = [
  { to: "/home", label: "Home", emoji: "🏠" },
  { to: "/add", label: "Add", emoji: "➕" },
  { to: "/chat", label: "Chat", emoji: "💬" },
  { to: "/galla", label: "Galla", emoji: "🏺" },
  { to: "/chores", label: "Roulette", emoji: "🎡" },
  { to: "/court", label: "Court", emoji: "⚖️" },
] as const;

function AppShell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery(profileQuery);
  const { data: notices = [] } = useQuery(noticesQuery);
  const [muted, setMutedState] = useState(false);

  useEffect(() => setMutedState(isMuted()), []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  // Filter incoming notices for current user
  const myNotices = notices.filter((n) => profile && n.receiver_id === profile.id);
  const unreadCount = myNotices.filter((n) => n.status === "unread").length;

  return (
    <div className="relative min-h-screen pb-28 md:pb-10">
      <FloatingMemes count={10} />
      <header className="sticky top-0 z-30 border-b-2 border-ink bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
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
                className="rounded-xl border-2 border-transparent px-2.5 py-1.5 text-xs lg:text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{
                  className: "!border-ink !bg-secondary !text-foreground shadow-sticker-sm",
                }}
              >
                {n.emoji} {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {profile && (
              <span className="hidden font-hand text-lg lg:inline">
                Namaste, {profile.display_name} 👋
              </span>
            )}

            {/* Notification Bell */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="relative"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-ink bg-loss text-[9px] font-black text-white animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="sticker-lg w-80 p-0 border-2 border-ink bg-card">
                <div className="border-b-2 border-ink bg-secondary p-3">
                  <p className="font-extrabold text-sm flex items-center justify-between">
                    <span>Hostel Notices 🔔</span>
                    <span className="text-xs text-muted-foreground">{myNotices.length} total</span>
                  </p>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y-2 divide-ink/20 p-2">
                  {myNotices.length === 0 ? (
                    <p className="p-4 text-center text-xs font-semibold text-muted-foreground">
                      Koi naya notice nahi hai. Shanti hai! 🕊️
                    </p>
                  ) : (
                    myNotices.slice(0, 10).map((n) => (
                      <div key={n.id} className="p-2 space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 font-bold">
                          {n.type === "court_notice" && (
                            <Scale className="h-3.5 w-3.5 text-primary" />
                          )}
                          {n.type === "dispute" && (
                            <AlertTriangle className="h-3.5 w-3.5 text-loss" />
                          )}
                          {n.type === "chat" && (
                            <MessageSquare className="h-3.5 w-3.5 text-foreground" />
                          )}
                          <span className="capitalize">{n.type.replace("_", " ")}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-[11px] leading-tight">
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t-2 border-ink p-2 text-center bg-muted/50">
                  <Link to="/chat" className="text-xs font-bold text-primary hover:underline">
                    Dost Chat kholein 💬
                  </Link>
                </div>
              </PopoverContent>
            </Popover>

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

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>

      <Calculator />

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-6 gap-1 rounded-2xl border-2 border-ink bg-card p-1.5 shadow-sticker md:hidden">
        {MOBILE_NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className={cn(
              "flex flex-col items-center rounded-xl py-1 text-[10px] font-bold text-muted-foreground",
            )}
            activeProps={{ className: "!bg-secondary !text-foreground font-black" }}
          >
            <span className="text-lg">{n.emoji}</span>
            <span className="truncate max-w-[50px]">{n.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
