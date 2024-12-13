'use client'

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export function Loading({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center max-w-screen-xl mx-auto px-4", className)}>
      <div className="w-16 h-16 mb-6">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="256"
            cy="256"
            r="200"
            className="stroke-foreground"
            strokeWidth="24"
            fill="none"
          />
          <circle
            cx="256"
            cy="256"
            r="64"
            className="fill-foreground"
          />
          <circle
            cx="256"
            cy="256"
            r="120"
            className="stroke-foreground"
            strokeWidth="24"
            fill="none"
          />
          <motion.circle
            cx="256"
            cy="256"
            r="160"
            className="stroke-foreground"
            strokeWidth="24"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </svg>
      </div>
      <motion.div
        className="h-0.5 bg-foreground/20 w-32 relative overflow-hidden rounded-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="h-full bg-foreground absolute top-0 left-0 right-0"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
    </div>
  )
} 