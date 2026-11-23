import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, QrCode } from "lucide-react";
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

interface UpiPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  friendName: string;
  defaultUpiId?: string;
  phone?: string;
  amount: number;
  onSettle: () => void;
}

export function UpiPayModal({
  isOpen,
  onClose,
  friendName,
  defaultUpiId = "",
  phone = "",
  amount,
  onSettle,
}: UpiPayModalProps) {
  // If no upi id, suggest standard phone@upi or let them enter
  const fallbackUpi = phone ? `${phone.replace(/\D/g, "").slice(-10)}@upi` : "";
  const [upiId, setUpiId] = useState(defaultUpiId || fallbackUpi);
  const [showQr, setShowQr] = useState(true);

  const cleanAmount = Math.abs(amount).toFixed(2);
  const upiUrl = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(friendName)}&am=${cleanAmount}&tn=Hostel+Hisaab&cu=INR`
    : "";

  const qrImageUrl = upiUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUrl)}`
    : "";

  async function copyUpi() {
    if (!upiId) return;
    await navigator.clipboard.writeText(upiId);
    toast.success("UPI ID copy ho gaya! 📋");
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sticker-lg max-w-sm border-2 border-ink bg-card p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-extrabold">
            💸 Scan & Settle
          </DialogTitle>
          <DialogDescription className="text-sm font-bold text-foreground">
            {friendName} ko <span className="text-loss">{formatINR(Math.abs(amount))}</span> chukao
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="upi-id" className="text-xs font-bold uppercase text-muted-foreground">
              {friendName} ka UPI ID
            </Label>
            <div className="flex gap-2">
              <Input
                id="upi-id"
                placeholder="e.g. rohit@okhdfcbank ya 9876543210@paytm"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copyUpi}
                disabled={!upiId}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {upiId ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink bg-white p-4">
              {showQr ? (
                <img
                  src={qrImageUrl}
                  alt="UPI QR Code"
                  className="h-44 w-44 rounded-lg object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="grid h-44 w-44 place-items-center text-center text-sm font-bold text-muted-foreground">
                  QR hidden
                </div>
              )}
              <p className="mt-2 text-center text-xs font-bold text-black">
                GPay / PhonePe / Paytm se scan karo 📱
              </p>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-ink/40 p-4 text-center text-sm text-muted-foreground">
              UPI ID daalo taaki QR code aur direct link generate ho sake.
            </div>
          )}

          <div className="space-y-2">
            {upiUrl && (
              <Button asChild size="lg" className="w-full bg-primary font-bold shadow-sticker-sm">
                <a href={upiUrl}>
                  <ExternalLink className="mr-2 h-4 w-4" /> 📱 Open UPI App Directly
                </a>
              </Button>
            )}

            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full font-bold"
              onClick={() => {
                onSettle();
                onClose();
              }}
            >
              <Check className="mr-2 h-4 w-4" /> Maine Pay Kar Diya (Barabar Karo) 🤝
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
