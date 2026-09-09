"use client";

import { motion } from "framer-motion";
import { Globe2, Search } from "lucide-react";

export function TypingDots({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const dotClass = "h-1.5 w-1.5 rounded-full bg-muted-foreground";

  if (reducedMotion) {
    return (
      <div className="flex items-center gap-1">
        <span className={dotClass} />
        <span className={dotClass} />
        <span className={dotClass} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className={dotClass}
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: index * 0.14 }}
        />
      ))}
    </div>
  );
}

export function SearchingSpinner({ reducedMotion = false }: { reducedMotion?: boolean }) {
  if (reducedMotion) {
    return <Search className="h-3.5 w-3.5 text-emerald-400" />;
  }

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
    >
      <Globe2 className="h-3.5 w-3.5 text-emerald-400" />
    </motion.div>
  );
}
