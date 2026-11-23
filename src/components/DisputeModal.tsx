import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatINR } from "@/lib/money";

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: {
    id: string;
    amount: number;
    note: string;
    friendName: string;
  } | null;
  onDispute: (id: string, reason: string) => Promise<void>;
}

const QUICK_REASONS = [
  "Maine toh ye khaya hi nahi! 🍜",
  "Cash pehle hi de diya tha bhai 💵",
  "Wrong amount likha hai ❌",
  "Maine pay kiya tha, usne nahi 🤦‍♂️",
];

export function DisputeModal({ isOpen, onClose, entry, onDispute }: DisputeModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!entry) return null;

  async function handleConfirmDispute() {
    if (!reason.trim()) {
      return toast.error("Wajah toh batao ki jhooth kyun hai! 🤨");
    }
    setIsSubmitting(true);
    try {
      await onDispute(entry!.id, reason.trim());
      toast.success("Dispute darj ho gaya! Entry freeze ho gayi 🚩");
      setReason("");
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Dispute failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sticker-lg max-w-md border-2 border-ink bg-card p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-extrabold text-loss">
            <AlertTriangle className="h-6 w-6" /> Jhooth Hai! 🚩 Dispute
          </DialogTitle>
          <DialogDescription className="text-sm font-semibold text-foreground">
            {entry.friendName} ka <span className="font-bold">{formatINR(entry.amount)}</span> (
            {entry.note || "bina note"}) wala daawa challenge karo.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <p className="rounded-lg border border-ink/30 bg-muted/70 p-2.5 text-xs text-muted-foreground">
            ⚠️ Note: Jhooth bolne ya faltu dispute karne par Roommate CIBIL score girta hai (-40 pts
            penalty).
          </p>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground">
              Quick reasons chuno:
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REASONS.map((qr) => (
                <button
                  key={qr}
                  type="button"
                  onClick={() => setReason(qr)}
                  className="rounded-lg border border-ink bg-muted px-2.5 py-1 text-xs font-bold hover:bg-secondary"
                >
                  {qr}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dispute-reason" className="text-xs font-bold uppercase">
              Asli wajah likho:
            </Label>
            <Input
              id="dispute-reason"
              placeholder="e.g. Bhai us din toh main ghar pe tha"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="font-bold"
              onClick={handleConfirmDispute}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Darj ho raha hai..." : "🚩 Case File Karo (Freeze Entry)"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
