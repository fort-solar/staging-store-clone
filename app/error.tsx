"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, ShoppingCart } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected client-side errors
    console.error("Store client exception caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1d] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mb-6">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          We encountered an unexpected display issue. Your cart and selections are preserved.
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#048A05] px-4 py-3 text-sm font-semibold text-white hover:bg-[#037004] transition shadow-sm"
          >
            <RotateCcw className="h-4 w-4" />
            Reload Page
          </button>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              <Home className="h-3.5 w-3.5" />
              Store Home
            </Link>
            <Link
              href="/cart"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              View Cart
            </Link>
          </div>
        </div>

        {error.digest && (
          <p className="mt-6 text-[10px] text-slate-400 font-mono">
            Ref: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
