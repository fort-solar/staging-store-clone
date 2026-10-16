"use client";

import React from "react";
import { GoogleIcon } from "@/components/features/icons/GoogleIcon";
import { FORTSOLAR_GOOGLE_REVIEW_URL } from "@/lib/env";

type GoogleReviewsCardProps = {
  className?: string;
  title?: string;
  subtitle?: string;
};

export function GoogleReviewsCard({
  className = "",
  title = "Customer Reviews & Installation Feedback",
  subtitle = "Our customer reviews are gathered and verified on Google Business.",
}: GoogleReviewsCardProps) {
  return (
    <div className={`rounded-2xl border border-[#E4E9EC] bg-white p-5 shadow-xs transition hover:border-[#D5DDE2] ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#EEF1F4] pb-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200/80 bg-gray-50 shadow-2xs">
            <GoogleIcon />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-[#252C32]">{title}</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-[#048A05]">
                Verified Ratings
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="text-amber-500 font-semibold tracking-tight">★★★★★</span>
              <span className="font-bold text-gray-900">4.9 / 5.0</span>
              <span className="text-gray-400">·</span>
              <span className="text-[#5A646B]">{subtitle}</span>
            </div>
          </div>
        </div>

        <a
          href={FORTSOLAR_GOOGLE_REVIEW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-2xs transition hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 shrink-0 cursor-pointer"
        >
          <span>Read Google Reviews</span>
          <span className="text-xs">↗</span>
        </a>
      </div>

      <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#5A646B]">
        <span>
          Had Fortsolar install at your home or facility and loved the experience?
        </span>
        <a
          href={FORTSOLAR_GOOGLE_REVIEW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#048A05] hover:underline shrink-0"
        >
          Leave a Review on Google &rarr;
        </a>
      </div>
    </div>
  );
}
