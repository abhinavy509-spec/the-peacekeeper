import { useEffect, useState } from "react";
import { Calculator as CalcIcon, Delete, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  calcBus,
  initialCalc,
  pressBack,
  pressDigit,
  pressDot,
  pressEquals,
  pressOp,
  shuffledDigits,
  type CalcState,
  type Op,
} from "@/lib/calc";
import { cn } from "@/lib/utils";

const TROLLS = ["Keys bhaag gaye 🏃", "Dhoondo ab 😈", "Focus, bhai 🧐", "Hisaab itna easy nahi 🤪"];

// Floating calculator. The 1–9 keys reshuffle after every digit press — on purpose.
export function Calculator() {
  const [open, setOpen] = useState(false);
  const [s, setS] = useState<CalcState>(initialCalc);
  const [digits, setDigits] = useState<string[]>(["7", "8", "9", "4", "5", "6", "1", "2", "3"]);
  const [canUse, setCanUse] = useState(false);
  const [troll, setTroll] = useState("");

  useEffect(() => {
    if (open) setCanUse(calcBus.hasListeners());
  }, [open]);

  const digit = (d: string) => {
    setS((x) => pressDigit(x, d));
    setDigits(shuffledDigits());
    setTroll(TROLLS[Math.floor(Math.random() * TROLLS.length)] ?? "");
  };
  const op = (o: Op) => setS((x) => pressOp(x, o));

  const result = Number(s.display);

  return (
    <>
      <button
        type="button"
        aria-label="Calculator kholo"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-24 right-4 z-40 grid h-14 w-14 place-items-center rounded-2xl border-2 border-ink bg-secondary shadow-sticker hover:animate-shake md:bottom-6 md:right-6"
      >
        {open ? <X className="h-6 w-6" /> : <CalcIcon className="h-6 w-6" />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Calculator"
          className="sticker-lg fixed bottom-40 right-4 z-40 w-[280px] animate-pop p-4 md:bottom-24 md:right-6"
        >
          <div className="mb-1 flex items-center justify-between">
            <p className="font-hand text-xl">Chhota hisaab 🧮</p>
            <span className="text-[11px] font-bold text-muted-foreground">{troll}</span>
          </div>
          <div className="mb-3 rounded-xl border-2 border-ink bg-ink px-3 py-2 text-right text-ink-foreground">
            <p className="h-4 text-xs opacity-60">{s.acc !== null && s.op ? `${s.acc} ${s.op}` : ""}</p>
            <p className="truncate font-display text-3xl font-extrabold" aria-live="polite">
              {s.error ?? s.display}
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Key onClick={() => setS(initialCalc)} className="bg-loss-soft">C</Key>
            <Key onClick={() => setS((x) => pressBack(x))} aria-label="Backspace" className="bg-muted">
              <Delete className="h-4 w-4" />
            </Key>
            <Key onClick={() => op("÷")} className="bg-accent">÷</Key>
            <Key onClick={() => op("×")} className="bg-accent">×</Key>

            <div className="col-span-3 grid grid-cols-3 gap-2">
              {digits.map((d) => (
                <Key key={d} onClick={() => digit(d)}>
                  {d}
                </Key>
              ))}
              <Key onClick={() => digit("0")} className="col-span-2">0</Key>
              <Key onClick={() => setS((x) => pressDot(x))}>.</Key>
            </div>
            <div className="grid grid-rows-4 gap-2">
              <Key onClick={() => op("-")} className="bg-accent">−</Key>
              <Key onClick={() => op("+")} className="bg-accent">+</Key>
              <Key onClick={() => setS((x) => pressEquals(x))} className="row-span-2 bg-primary text-primary-foreground">
                =
              </Key>
            </div>
          </div>
          {canUse && (
            <Button
              className="mt-3 w-full"
              variant="ink"
              size="sm"
              disabled={!(result > 0) || Boolean(s.error)}
              onClick={() => {
                const final = pressEquals(s);
                const n = Number(final.display);
                if (!(n > 0)) return;
                calcBus.emit(Math.round(n * 100) / 100);
                toast.success(`₹${Math.round(n * 100) / 100} amount mein daal diya ✍️`);
                setOpen(false);
              }}
            >
              Amount mein daalo 👉
            </Button>
          )}
        </div>
      )}
    </>
  );
}

function Key({
  children,
  onClick,
  className,
  ...rest
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "grid h-12 place-items-center rounded-xl border-2 border-ink bg-card font-display text-lg font-bold shadow-sticker-sm transition-transform hover:animate-shake active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
