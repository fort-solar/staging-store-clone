"use client";

import React from "react";
import { GoogleIcon } from "@/components/features/icons/GoogleIcon";
import { FORTSOLAR_GOOGLE_REVIEW_URL } from "@/lib/env";

type GoogleReviewsBadgeProps = {
  className?: string;
  rating?: number;
  label?: string;
};

export function GoogleReviewsBadge({
  className = "",
  rating = 4.9,
  label = "Fortsolar Google Rating",
}: GoogleReviewsBadgeProps) {
  return (
    <a
      href={FORTSOLAR_GOOGLE_REVIEW_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex items-center gap-2 rounded-full border border-amber-300/80 dark:border-amber-700/50 bg-amber-50/80 dark:bg-amber-950/30 px-3 py-1 text-xs font-medium text-amber-950 dark:text-amber-200 transition hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-100/90 dark:hover:bg-amber-900/40 cursor-pointer shadow-2xs ${className}`}
      title="View verified Fortsolar company reviews on Google (Lagos & Uyo branches)"
    >
      <span className="flex items-center text-amber-500 dark:text-amber-400 text-xs tracking-tight">
        {"★★★★★"}
      </span>
      <span className="font-bold text-slate-900 dark:text-white">{rating.toFixed(1)}</span>
      <span className="text-slate-400 dark:text-slate-600">·</span>
      <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
        <GoogleIcon />
        <span>{label}</span>
      </span>
      <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
        ↗
      </span>
    </a>
  );
}
