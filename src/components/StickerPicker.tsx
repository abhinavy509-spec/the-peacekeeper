import { FLOATERS } from "@/lib/memes";
import { cn } from "@/lib/utils";

interface StickerPickerProps {
  onSelect: (sticker: string) => void;
  className?: string;
}

export function StickerPicker({ onSelect, className }: StickerPickerProps) {
  return (
    <div className={cn("rounded-2xl border-2 border-ink bg-card p-3 shadow-sticker-sm", className)}>
      <p className="mb-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
        Hostel Floating Stickers 🤡
      </p>
      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
        {FLOATERS.map((stk) => {
          const isEmojiOnly = stk.length <= 4 && !stk.includes(" ");
          return (
            <button
              key={stk}
              type="button"
              onClick={() => onSelect(stk)}
              className={cn(
                "rounded-xl border border-ink bg-secondary px-2.5 py-1 text-xs font-bold transition-transform hover:scale-110 hover:-rotate-2 active:scale-95 shadow-sticker-sm",
                isEmojiOnly ? "text-xl px-2 py-1" : "text-xs",
              )}
            >
              {stk}
            </button>
          );
        })}
      </div>
    </div>
  );
}
