import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Send, Smile, Phone, UserCheck, MessageSquare, AlertTriangle, Scale } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { StickerPicker } from "@/components/StickerPicker";
import {
  friendsQuery,
  getLocalItem,
  noticesQuery,
  profileQuery,
  setLocalItem,
  type Friend,
  type Notice,
} from "@/lib/data";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/chat")({
  validateSearch: (s: Record<string, unknown>): { friend?: string } =>
    typeof s["friend"] === "string" ? { friend: s["friend"] } : {},
  head: () => ({
    meta: [
      { title: "Dost Chat & Stickers — The Peacekeeper" },
      {
        name: "description",
        content: "Chat with roommates, send court notices and floating meme stickers.",
      },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(friendsQuery),
      context.queryClient.ensureQueryData(noticesQuery),
      context.queryClient.ensureQueryData(profileQuery),
    ]),
  component: ChatPage,
});

function ChatPage() {
  const search = Route.useSearch();
  const qc = useQueryClient();
  const { data: friends } = useSuspenseQuery(friendsQuery);
  const { data: notices } = useSuspenseQuery(noticesQuery);
  const { data: profile } = useSuspenseQuery(profileQuery);

  const [activeFriendId, setActiveFriendId] = useState<string | null>(
    search.friend ?? friends[0]?.id ?? null,
  );
  const [text, setText] = useState("");
  const [showStickers, setShowStickers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeFriend = friends.find((f) => f.id === activeFriendId) ?? null;

  // Filter messages between current user and active friend
  const conversation = notices
    .filter((n) => {
      if (!profile || !activeFriend) return false;
      const targetId = activeFriend.friend_user_id || activeFriend.id;
      return (
        (n.sender_id === profile.id && n.receiver_id === targetId) ||
        (n.sender_id === targetId && n.receiver_id === profile.id)
      );
    })
    .reverse(); // chronological order

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.length]);

  const sendMessage = useMutation({
    mutationFn: async ({ message, sticker }: { message?: string; sticker?: string }) => {
      if (!profile) throw new Error("Not logged in");
      if (!activeFriend) throw new Error("Friend select karo");
      const targetId = activeFriend.friend_user_id || activeFriend.id;

      const payload = {
        sender_id: profile.id,
        receiver_id: targetId,
        type: sticker ? "sticker" : "chat",
        message: message?.trim() || "",
        sticker: sticker || null,
      };

      try {
        const { error } = await supabase.from("notices").insert(payload);
        if (error) throw error;
      } catch {
        // Fallback to local storage if remote table is not yet migrated
        const local = getLocalItem<Notice[]>("peacekeeper_local_notices", []);
        local.unshift({
          id: crypto.randomUUID(),
          ...payload,
          amount: null,
          entry_id: null,
          status: "unread",
          created_at: new Date().toISOString(),
        });
        setLocalItem("peacekeeper_local_notices", local);
      }
    },
    onSuccess: () => {
      setText("");
      setShowStickers(false);
      qc.invalidateQueries({ queryKey: ["notices"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSendText(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage.mutate({ message: text });
  }

  function handleSendSticker(sticker: string) {
    sendMessage.mutate({ sticker, message: sticker });
  }

  if (friends.length === 0) {
    return (
      <div>
        <PageHeader kicker="Chat" title="Dost Chat & Stickers" sticker="💬" />
        <EmptyState
          sticker="🦗"
          title="Koi dost hi nahi"
          sub="Chat karne ke liye pehle kisi ko gang mein add karo."
        >
          <Button asChild>
            <Link to="/friends">👯 Dost add karo</Link>
          </Button>
        </EmptyState>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker="In-App Chat"
        title="Dost Chat & Meme Stickers"
        sub="Roommates ko court notices, dues ya floating hostel meme stickers bhejo bina WhatsApp khole."
        sticker="💬"
      />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Friends Sidebar List */}
        <div className="sticker-lg h-fit space-y-2 p-3">
          <p className="px-2 py-1 text-xs font-black uppercase tracking-wider text-muted-foreground">
            Dost & Roomies ({friends.length})
          </p>
          <div className="space-y-1">
            {friends.map((f) => {
              const isActive = f.id === activeFriendId;
              const isLinked = Boolean(f.friend_user_id);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFriendId(f.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border-2 p-2.5 text-left transition-all",
                    isActive
                      ? "border-ink bg-secondary font-bold shadow-sticker-sm"
                      : "border-transparent hover:bg-muted font-medium",
                  )}
                >
                  <span className="text-2xl">{f.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold flex items-center gap-1">
                      {f.name}
                      {isLinked && (
                        <span className="text-[10px]" title="Linked Peacekeeper User">
                          ⚡
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {isLinked ? "Online ID linked" : "Offline friend"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Thread Panel */}
        <section className="sticker-lg flex flex-col overflow-hidden h-[620px] bg-card">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b-2 border-ink bg-ink px-5 py-3 text-ink-foreground">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{activeFriend?.emoji ?? "❔"}</span>
              <div>
                <p className="font-extrabold flex items-center gap-1.5">
                  {activeFriend?.name}
                  {activeFriend?.friend_user_id ? (
                    <span className="rounded bg-gain px-1.5 py-0.2 text-[9px] font-black uppercase text-gain-foreground">
                      ⚡ Peacekeeper ID
                    </span>
                  ) : (
                    <span className="rounded bg-muted px-1.5 py-0.2 text-[9px] font-bold text-foreground">
                      Not linked
                    </span>
                  )}
                </p>
                <p className="text-xs opacity-70">{activeFriend?.phone || "No phone saved"}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link to="/court" search={{ friend: activeFriend?.id }}>
                  ⚖️ Court Notice
                </Link>
              </Button>
            </div>
          </div>

          {/* Not linked warning banner if applicable */}
          {!activeFriend?.friend_user_id && (
            <div className="flex items-center justify-between bg-yellow-100 dark:bg-yellow-950/60 border-b-2 border-ink px-4 py-2 text-xs font-semibold text-yellow-900 dark:text-yellow-200">
              <span>
                💡 {activeFriend?.name} ka Peacekeeper username link nahi hai. Dues aur Court
                notices offline WhatsApp se jaayenge.
              </span>
              <Button asChild variant="outline" size="sm" className="h-6 text-[10px]">
                <Link to="/friends">Link karo ⚡</Link>
              </Button>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-accent/40">
            {conversation.length === 0 ? (
              <div className="grid h-full place-items-center text-center p-6">
                <div>
                  <span className="text-5xl animate-bob">💬</span>
                  <p className="mt-3 font-display text-lg font-bold">
                    {activeFriend?.name} ke saath abhi koi message nahi
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    Niche floating sticker chuno ya message likh kar udhaar ki yaad dilaao! 💸
                  </p>
                </div>
              </div>
            ) : (
              conversation.map((msg) => {
                const isMe = msg.sender_id === profile?.id;
                const isCourt = msg.type === "court_notice";
                const isDue = msg.type === "due_request";
                const isDispute = msg.type === "dispute";
                const isSticker = msg.type === "sticker";

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col max-w-[80%]",
                      isMe ? "ml-auto items-end" : "mr-auto items-start",
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-2xl border-2 border-ink p-3 shadow-sticker-sm",
                        isCourt && "bg-secondary text-foreground -rotate-1",
                        isDue && "bg-gain-soft border-dashed",
                        isDispute && "bg-loss-soft border-destructive",
                        isSticker && "bg-card text-2xl font-bold py-2 px-4 animate-wiggle",
                        !isCourt &&
                          !isDue &&
                          !isDispute &&
                          !isSticker &&
                          (isMe
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-card-foreground"),
                      )}
                    >
                      {/* Notice type badges */}
                      {isCourt && (
                        <div className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase text-foreground/80">
                          <Scale className="h-3 w-3" /> Roommate Court Notice
                        </div>
                      )}
                      {isDue && (
                        <div className="mb-1 text-[10px] font-black uppercase text-gain">
                          💰 New Due Request ({msg.amount ? formatINR(Number(msg.amount)) : ""})
                        </div>
                      )}
                      {isDispute && (
                        <div className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase text-loss">
                          <AlertTriangle className="h-3 w-3" /> Dispute Filed 🚩
                        </div>
                      )}

                      <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed">
                        {msg.message}
                      </p>
                    </div>

                    <span className="mt-1 text-[9px] font-bold text-muted-foreground px-1">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Sticker Tray Popup */}
          {showStickers && (
            <div className="p-2 border-t-2 border-ink bg-card">
              <StickerPicker onSelect={handleSendSticker} />
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={handleSendText}
            className="flex items-center gap-2 border-t-2 border-ink bg-card p-3"
          >
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowStickers((v) => !v)}
              className={cn("h-11 w-11 rounded-xl text-xl", showStickers && "bg-secondary")}
              title="Stickers 🤡"
            >
              🤡
            </Button>

            <Input
              placeholder={`${activeFriend?.name ?? "Dost"} ko message ya sticker bhejo…`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={sendMessage.isPending}
              className="h-11 rounded-xl font-medium"
            />

            <Button
              type="submit"
              size="icon"
              disabled={!text.trim() || sendMessage.isPending}
              className="h-11 w-11 rounded-xl"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
