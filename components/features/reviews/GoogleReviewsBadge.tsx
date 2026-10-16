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
  label = "Google Reviews",
}: GoogleReviewsBadgeProps) {
  return (
    <a
      href={FORTSOLAR_GOOGLE_REVIEW_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex items-center gap-2 rounded-full border border-amber-200/90 bg-amber-50/70 px-3 py-1 text-xs font-medium text-amber-950 transition hover:border-amber-300 hover:bg-amber-100/80 cursor-pointer shadow-2xs ${className}`}
      title="View verified Fortsolar customer reviews on Google"
    >
      <span className="flex items-center text-amber-500 text-xs tracking-tight">
        {"★★★★★"}
      </span>
      <span className="font-bold text-gray-900">{rating.toFixed(1)}</span>
      <span className="text-gray-300">·</span>
      <span className="inline-flex items-center gap-1.5 font-medium text-gray-700 group-hover:text-gray-900">
        <GoogleIcon />
        <span>{label}</span>
      </span>
      <span className="text-[11px] font-semibold text-amber-700 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
        ↗
      </span>
    </a>
  );
}
