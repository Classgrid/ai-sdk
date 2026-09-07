"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, useMotionTemplate, useMotionValue } from "framer-motion"

import { cn } from "../../utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 relative overflow-hidden cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-900 text-white hover:bg-emerald-500 hover:text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-emerald-500 dark:hover:text-white border border-zinc-800 dark:border-white/10 hover:border-transparent transition-colors duration-300",
        primary:
          "bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all duration-300",
        destructive:
          "bg-red-500 text-white hover:bg-red-600",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors duration-300",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link:
          "text-primary underline-offset-4 hover:underline",
        rainbow:
          "bg-white text-zinc-950 hover:text-zinc-950 dark:bg-zinc-950 dark:text-white dark:hover:text-white border border-zinc-200 dark:border-white/20 transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.1)]",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-md px-4",
        lg: "h-14 rounded-full px-10 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
  showGlow?: boolean
  glowVariant?: "emerald" | "neutral"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, showGlow = false, glowVariant = "emerald", children, ...props }, ref) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
      const { left, top } = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }

    const isRainbow = variant === "rainbow";

    // Glow colors based on variant
    const glowColorDark = glowVariant === "neutral" 
      ? "rgba(255, 255, 255, 0.25)" 
      : "rgba(16, 185, 129, 0.45)"; 
      
    const glowColorLight = glowVariant === "neutral" 
      ? "rgba(0, 0, 0, 0.1)" 
      : "rgba(16, 185, 129, 0.35)";

    const renderGlow = () => {
      if (isRainbow) {
        return (
          <motion.div
            className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition duration-300 group-hover:opacity-100 z-10"
            style={{
              background: useMotionTemplate`
                radial-gradient(
                  200px circle at ${mouseX}px ${mouseY}px,
                  rgba(255, 0, 0, 0.6),
                  rgba(255, 165, 0, 0.6),
                  rgba(255, 255, 0, 0.6),
                  rgba(0, 128, 0, 0.6),
                  rgba(0, 0, 255, 0.6),
                  rgba(75, 0, 130, 0.6),
                  rgba(238, 130, 238, 0.6),
                  transparent 80%
                )
              `,
            }}
          />
        );
      }

      return (
        <>
          <motion.div
            className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition duration-300 group-hover:opacity-100 dark:hidden z-0"
            style={{
              background: useMotionTemplate`
                radial-gradient(
                  120px circle at ${mouseX}px ${mouseY}px,
                  ${glowColorLight},
                  transparent 80%
                )
              `,
            }}
          />
          <motion.div
            className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition duration-300 group-hover:opacity-100 hidden dark:block z-0"
            style={{
              background: useMotionTemplate`
                radial-gradient(
                  120px circle at ${mouseX}px ${mouseY}px,
                  ${glowColorDark},
                  transparent 80%
                )
              `,
            }}
          />
        </>
      );
    };

    const isRoundedFull = size === "lg" || className?.includes("rounded-full");
    const radiusClass = isRoundedFull ? "rounded-full" : "rounded-md";

    if (asChild) {
      return (
        <motion.div
        onMouseMove={handleMouseMove}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn("inline-block group relative overflow-hidden", radiusClass)}
        >
          <Slot
            className={cn(buttonVariants({ variant, size, className }))}
            ref={ref}
            {...(props as any)}
          >
            {children}
          </Slot>
          <div className="absolute inset-0 z-10 pointer-events-none mix-blend-plus-lighter rounded-[inherit]">
            {showGlow && renderGlow()}
          </div>
        </motion.div>
      )
    }

    return (
      <motion.button
        onMouseMove={handleMouseMove}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn("group relative", buttonVariants({ variant, size, className }))}
        ref={ref}
        {...(props as any)}
      >
        {showGlow && renderGlow()}
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </motion.button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
