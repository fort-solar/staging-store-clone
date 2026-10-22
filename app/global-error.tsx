"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Store global client exception caught:", error);
  }, [error]);

  const handleReset = () => {
    try {
      reset();
    } catch {
      window.location.reload();
    }
  };

  const handleClearAndReload = () => {
    try {
      localStorage.removeItem("general-store");
    } catch {
      // ignore
    }
    window.location.href = "/";
  };

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-6">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            We encountered an unexpected display issue while loading the store.
          </p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#048A05] px-4 py-3 text-sm font-semibold text-white hover:bg-[#037004] transition shadow-sm cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              Reload Page
            </button>

            <button
              type="button"
              onClick={handleClearAndReload}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <Home className="h-3.5 w-3.5" />
              Return to Store Home
            </button>
          </div>

          {error.digest && (
            <p className="mt-6 text-[10px] text-slate-400 font-mono">
              Ref: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
