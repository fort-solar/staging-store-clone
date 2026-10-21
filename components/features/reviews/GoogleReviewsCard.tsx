"use client";

import React from "react";
import { GoogleIcon } from "@/components/features/icons/GoogleIcon";
import {
  FORTSOLAR_GOOGLE_REVIEW_URL_LAGOS,
  FORTSOLAR_GOOGLE_REVIEW_URL_UYO,
} from "@/lib/env";

type GoogleReviewsCardProps = {
  className?: string;
  title?: string;
  subtitle?: string;
};

export function GoogleReviewsCard({
  className = "",
  title = "Fortsolar Verified Company Reviews",
  subtitle = "Read verified customer installation & service reviews across our Lagos & Uyo offices.",
}: GoogleReviewsCardProps) {
  return (
    <div className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-xs transition hover:border-slate-300 dark:hover:border-slate-700 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-2xs">
            <GoogleIcon />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-semibold text-[#048A05] dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50">
                Verified Business
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs flex-wrap">
              <span className="text-amber-500 dark:text-amber-400 font-semibold tracking-tight">★★★★★</span>
              <span className="font-bold text-slate-900 dark:text-white">4.9 / 5.0</span>
              <span className="text-slate-400 dark:text-slate-600">·</span>
              <span className="text-slate-500 dark:text-slate-400">{subtitle}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={FORTSOLAR_GOOGLE_REVIEW_URL_LAGOS}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            title="Read reviews for Fortsolar Lagos Office"
          >
            <span>Lagos Reviews</span>
            <span className="text-[10px]">↗</span>
          </a>
          <a
            href={FORTSOLAR_GOOGLE_REVIEW_URL_UYO}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            title="Read reviews for Fortsolar Uyo Office"
          >
            <span>Uyo Reviews</span>
            <span className="text-[10px]">↗</span>
          </a>
        </div>
      </div>

      <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>
          Had Fortsolar install solar at your home or facility and loved the experience?
        </span>
        <div className="flex items-center gap-3 shrink-0 font-medium">
          <span className="text-slate-400 dark:text-slate-500 text-[11px]">Leave Review:</span>
          <a
            href={FORTSOLAR_GOOGLE_REVIEW_URL_LAGOS}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#048A05] dark:text-emerald-400 hover:underline"
          >
            Lagos &rarr;
          </a>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <a
            href={FORTSOLAR_GOOGLE_REVIEW_URL_UYO}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#048A05] dark:text-emerald-400 hover:underline"
          >
            Uyo &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
