import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Every button is a "sticker": ink border, hard shadow, shakes on hover, squishes on press.
// A global listener in __root plays a random click sound for any button.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold cursor-pointer select-none border-2 border-ink transition-[transform,box-shadow,background-color] duration-150 hover:animate-shake active:translate-x-[3px] active:translate-y-[3px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sticker hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sticker",
        outline: "bg-card text-foreground shadow-sticker hover:bg-muted",
        secondary: "bg-secondary text-secondary-foreground shadow-sticker hover:bg-secondary/85",
        ink: "bg-ink text-ink-foreground shadow-sticker hover:bg-ink/90",
        whatsapp: "bg-whatsapp text-whatsapp-foreground shadow-sticker hover:bg-whatsapp/90",
        ghost:
          "border-transparent shadow-none hover:bg-accent hover:text-accent-foreground active:translate-x-0 active:translate-y-0",
        link: "border-transparent shadow-none text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-2xl px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
