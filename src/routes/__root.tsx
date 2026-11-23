import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportError } from "../lib/error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { playRandomClick } from "@/lib/sound";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="sticker-lg max-w-md p-10 text-center">
        <div className="text-7xl animate-bob">🫥</div>
        <h1 className="mt-4 text-5xl font-extrabold text-foreground">404</h1>
        <p className="mt-2 text-muted-foreground">
          Ye page bhi udhaar lekar bhaag gaya. Yahan kuch nahi hai, bhai.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl border-2 border-ink bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sticker"
          >
            Ghar chalo 🏠
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="sticker-lg max-w-md p-10 text-center">
        <div className="text-6xl">😵‍💫</div>
        <h1 className="mt-3 text-2xl font-bold text-foreground">Kuch toh gadbad hai</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Page load nahi hua. Ek baar phir try karo ya ghar wapas chalo.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl border-2 border-ink bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sticker"
          >
            Phir se try karo
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border-2 border-ink bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sticker"
          >
            Ghar chalo
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "The Peacekeeper — Hostel ka hisaab" },
      {
        name: "description",
        content:
          "Track debts, dues and splits with your hostel friends — with memes and Roommate Court.",
      },
      { name: "author", content: "Abhinav Yadav" },
      { property: "og:title", content: "The Peacekeeper — Hostel ka hisaab" },
      {
        property: "og:description",
        content:
          "Track debts, dues and splits with your hostel friends — with memes and Roommate Court.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Caveat:wght@600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  // One auth listener for the whole app, filtered to identity changes.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  // Random funny click sound for every button / link press.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest("button, a, [role=button], [role=tab]");
      if (el) playRandomClick();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
