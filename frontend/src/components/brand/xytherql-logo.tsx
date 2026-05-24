"use client";

import Image from "next/image";
import { useId } from "react";
import { cn } from "@/lib/utils";

/** Hexagon X mark — sidebar & compact UI */
export function XytherQLIcon({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const grad = `xy-grad-${id}`;
  const glow = `xy-glow-${id}`;

  return (
    <svg
      viewBox="0 0 140 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="100%" stopColor="#7A5CFF" />
        </linearGradient>
        <filter id={glow}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${glow})`}>
        <polygon
          points="70,0 140,40 140,120 70,160 0,120 0,40"
          stroke={`url(#${grad})`}
          strokeWidth="6"
          fill="rgba(255,255,255,0.03)"
        />
        <path
          d="M35 40 L105 120"
          stroke="#00F0FF"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M105 40 L35 120"
          stroke="#7A5CFF"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <circle cx="70" cy="0" r="4" fill="#00F0FF" />
        <circle cx="140" cy="40" r="4" fill="#7A5CFF" />
        <circle cx="140" cy="120" r="4" fill="#00F0FF" />
        <circle cx="70" cy="160" r="4" fill="#7A5CFF" />
        <circle cx="0" cy="120" r="4" fill="#00F0FF" />
        <circle cx="0" cy="40" r="4" fill="#7A5CFF" />
      </g>
    </svg>
  );
}

/** Sidebar / inline wordmark */
export function XytherQLWordmark({ compact }: { compact?: boolean }) {
  return (
    <div>
      <p
        className={cn(
          "font-bold tracking-tight text-white",
          compact ? "text-base" : "text-lg"
        )}
      >
        Xyther<span className="text-gradient">QL</span>
      </p>
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8FA3BF]">
        GraphQL Security Auditing
      </p>
    </div>
  );
}

/** Full banner logo for dashboard hero */
export function XytherQLBanner({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full max-w-full sm:max-w-xl", className)}>
      <Image
        src="/xytherql-logo.svg"
        alt="XytherQL — GraphQL Security Auditing Tool"
        width={900}
        height={260}
        priority
        className="h-auto w-full rounded-xl shadow-2xl shadow-[#00F0FF]/10 sm:rounded-2xl"
      />
    </div>
  );
}
