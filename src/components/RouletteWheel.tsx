import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ChoreItem {
  id: string;
  label: string;
  emoji: string;
}

interface RouletteWheelProps {
  chores: ChoreItem[];
  onFinish: (chore: ChoreItem) => void;
  disabled?: boolean;
}

const COLORS = [
  "#FFD000", // yellow
  "#FF6B6B", // coral/red
  "#4ECDC4", // teal
  "#FFBE0B", // orange-yellow
  "#A8DADC", // light blue
  "#9B5DE5", // purple
  "#00F5D4", // mint
  "#F15BB5", // pink
];

export function RouletteWheel({ chores, onFinish, disabled }: RouletteWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  const total = chores.length;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || total === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const radius = width / 2 - 10;
    const centerX = width / 2;
    const centerY = height / 2;
    const arc = (2 * Math.PI) / total;

    ctx.clearRect(0, 0, width, height);

    chores.forEach((item, i) => {
      const angle = i * arc;

      // Draw slice
      ctx.beginPath();
      ctx.fillStyle = COLORS[i % COLORS.length]!;
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + arc);
      ctx.lineTo(centerX, centerY);
      ctx.fill();

      // Border line
      ctx.strokeStyle = "#1A1A1A";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw text and emoji
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#1A1A1A";
      ctx.font = "bold 13px system-ui, sans-serif";

      // Truncate label if too long
      const text = item.label.length > 14 ? item.label.slice(0, 13) + "…" : item.label;
      ctx.fillText(`${item.emoji} ${text}`, radius - 20, 5);
      ctx.restore();
    });

    // Draw center hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 24, 0, 2 * Math.PI);
    ctx.fillStyle = "#1A1A1A";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 14, 0, 2 * Math.PI);
    ctx.fillStyle = "#FFD000";
    ctx.fill();
  }, [chores, total]);

  function spin() {
    if (isSpinning || total === 0 || disabled) return;
    setIsSpinning(true);

    // Calculate random winner
    const winnerIndex = Math.floor(Math.random() * total);
    const arcDegrees = 360 / total;

    // We want the winner slice to end up under the pointer at top (270 degrees in standard canvas, or 0 at 3 o'clock)
    // Canvas 0 angle is at 3 o'clock (right). The pointer is at top (270° or -90°).
    // Center of winner slice i is (i * arcDegrees + arcDegrees / 2).
    // Rotation required to align that center to 270°:
    const targetSliceCenter = winnerIndex * arcDegrees + arcDegrees / 2;
    const extraRounds = 5 + Math.floor(Math.random() * 3); // 5 to 7 full spins
    const targetRotation =
      rotation + extraRounds * 360 + ((270 - (targetSliceCenter % 360) + 360) % 360);

    setRotation(targetRotation);

    setTimeout(() => {
      setIsSpinning(false);
      onFinish(chores[winnerIndex]!);
    }, 4200);
  }

  return (
    <div className="flex flex-col items-center">
      {/* Pointer at top */}
      <div className="relative flex flex-col items-center z-10 -mb-4">
        <div className="w-0 h-0 border-x-[16px] border-x-transparent border-t-[28px] border-t-loss drop-shadow-[0_3px_2px_rgba(0,0,0,0.4)] animate-bounce" />
      </div>

      {/* Wheel Canvas Container */}
      <div
        className="relative overflow-hidden rounded-full border-4 border-ink shadow-sticker-lg bg-card p-1 transition-transform"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: isSpinning ? "transform 4.2s cubic-bezier(0.15, 0.85, 0.25, 1)" : "none",
        }}
      >
        <canvas ref={canvasRef} width={360} height={360} className="rounded-full select-none" />
      </div>

      {/* Spin Button */}
      <Button
        size="lg"
        onClick={spin}
        disabled={isSpinning || total === 0 || disabled}
        className={cn(
          "mt-6 text-xl font-extrabold h-14 px-8 border-2 border-ink shadow-sticker transition-transform active:scale-95",
          isSpinning ? "opacity-70 cursor-not-allowed" : "hover:-rotate-1",
        )}
      >
        {isSpinning ? "Chakra ghoom raha hai... 🌀" : "🎡 SPIN KARO (Kismat Chuno)!"}
      </Button>
    </div>
  );
}
