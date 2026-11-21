import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shuffle } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MemeCard } from "@/components/MemeCard";
import { FloatingMemes } from "@/components/FloatingMemes";
import { MEMES, randomMeme, type Meme } from "@/lib/memes";
import { nameToEmail, normalizeName } from "@/lib/identity";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Peacekeeper — Login karo, hisaab shuru karo" },
      {
        name: "description",
        content:
          "Hostel ke udhaar, dues aur splits ka hisaab — memes ke saath. Sign up with just your name and password.",
      },
      { property: "og:title", content: "The Peacekeeper — Because roommate drama needs a judge" },
      {
        property: "og:description",
        content: "Track who owes what in your hostel, split bills, and send funny Hinglish reminders on WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  // First render uses a fixed meme (SSR-safe), then shuffles to a random one on mount.
  const [meme, setMeme] = useState<Meme>(MEMES[0]!);

  useEffect(() => {
    setMeme(randomMeme());
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const clean = normalizeName(name);
    if (clean.length < 2) return void toast.error("Naam toh dhang ka daalo bhai 😅");
    if (password.length < 6) return void toast.error("Password kam se kam 6 characters ka 🔐");
    setBusy(true);
    try {
      const email = nameToEmail(name);
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { username: clean, display_name: name.trim() },
          },
        });
        if (error) {
          if (/already/i.test(error.message))
            toast.error("Ye naam pehle se kisi ne le liya 😬 Sign in karo ya naam badlo.");
          else toast.error(error.message);
          return;
        }
        if (!data.session) {
          toast.error("Account bana, par sign in nahi hua. Sign in try karo.");
          setMode("signin");
          return;
        }
        toast.success(`Swagat hai ${name.trim()}! 🎉 Ab koi udhaar nahi bhoolega.`);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error("Naam ya password galat hai 🙅 (ya phir tum woh nahi ho jo bol rahe ho 🕵️)");
          return;
        }
        toast.success("Welcome back! Hisaab tumhara intezaar kar raha tha 📒");
      }
      navigate({ to: "/home", replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <FloatingMemes count={12} />
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-5 py-12 lg:grid-cols-[1.1fr_1fr]">
        <section>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
            Promptwars × AITD
          </p>
          <h1 className="mt-3 text-6xl font-extrabold leading-[0.9] md:text-8xl">
            The
            <br />
            Peace<span className="text-primary">keeper</span>
            <span className="ml-3 inline-block align-middle text-5xl animate-wiggle md:text-6xl">⚖️</span>
          </h1>
          <p className="mt-5 max-w-md text-lg">
            Because roommate drama needs a judge. Hostel ke saare udhaar, dues aur splits — ek jagah,
            bina "bhai paise de de 😭" wale awkward moments ke.
          </p>

          <div className="mt-8 max-w-md">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-hand text-2xl">Aaj ka meme 👇</p>
              <Button variant="outline" size="sm" onClick={() => setMeme((m) => randomMeme(m))}>
                <Shuffle /> Ek aur
              </Button>
            </div>
            <MemeCard key={JSON.stringify(meme)} meme={meme} className="-rotate-1" />
          </div>
        </section>

        <section className="sticker-lg tape mx-auto w-full max-w-md p-7 md:p-9">
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border-2 border-ink bg-muted p-1">
            {(["signup", "signin"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-lg py-2 text-sm font-bold transition-colors",
                  mode === m ? "bg-ink text-ink-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "signup" ? "Naya hoon 🐣" : "Purana khiladi 😎"}
              </button>
            ))}
          </div>

          <h2 className="text-3xl font-extrabold">
            {mode === "signup" ? "Account banao" : "Wapas aao"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Bas naam aur password. Email-shemail ki koi tension nahi."
              : "Naam aur password daalo, hisaab wahi milega jahan chhoda tha."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tumhara naam</Label>
              <Input
                id="name"
                autoComplete="username"
                placeholder="e.g. Abhinav"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder="Roommate ko mat batana 🤫"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? "Ruko zara… ⏳" : mode === "signup" ? "Chalo shuru karein 🚀" : "Andar aane do 🚪"}
            </Button>
          </form>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            Pro tip: password bhool gaye toh hum bhi kuch nahi kar sakte. Likh ke rakho 📝
          </p>
        </section>
      </div>
    </main>
  );
}
