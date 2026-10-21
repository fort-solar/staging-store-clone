"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Loader2 } from "lucide-react";
import { GoogleIcon } from "@/components/features/icons/GoogleIcon";
import { cn } from "@/lib/utils";

type GoogleAuthButtonProps = {
  className?: string;
  wrapperClassName?: string;
  label?: string;
  isLastUsed?: boolean;
} & Omit<
  React.ComponentProps<typeof GoogleLogin>,
  "containerProps" | "shape" | "size" | "text" | "theme" | "width"
>;

const DEFAULT_BUTTON_WIDTH = 360;
const GOOGLE_MAX_BUTTON_WIDTH = 400;
const GOOGLE_BUTTON_HEIGHT = 40;
const CUSTOM_BUTTON_HEIGHT = 48;
const LAST_AUTH_METHOD_KEY = "fortsolar_last_auth_method";

const GoogleAuthButton = ({
  className,
  wrapperClassName,
  label = "Continue With Google",
  isLastUsed,
  onSuccess,
  onError,
  ...googleButtonProps
}: GoogleAuthButtonProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [buttonWidth, setButtonWidth] = useState(DEFAULT_BUTTON_WIDTH);
  const [isConnecting, setIsConnecting] = useState(false);
  const [detectedLastUsed, setDetectedLastUsed] = useState(false);

  // Check last used auth method from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkLastAuth = () => {
      try {
        const stored = localStorage.getItem(LAST_AUTH_METHOD_KEY);
        setDetectedLastUsed(stored === "google");
      } catch {
        setDetectedLastUsed(false);
      }
    };

    checkLastAuth();

    const handleStorage = () => checkLastAuth();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("fortsolar:last-auth-method-change", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("fortsolar:last-auth-method-change", handleStorage);
    };
  }, []);

  const showLastUsed = isLastUsed !== undefined ? isLastUsed : detectedLastUsed;

  const googleButtonWidth = Math.min(buttonWidth, GOOGLE_MAX_BUTTON_WIDTH);
  const scaleX = buttonWidth / googleButtonWidth;
  const scaleY = CUSTOM_BUTTON_HEIGHT / GOOGLE_BUTTON_HEIGHT;

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateWidth = () => {
      const nextWidth = Math.max(Math.floor(node.getBoundingClientRect().width), 200);
      setButtonWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  // Safety timer to clear loading spinner if popup was closed or dismissed
  useEffect(() => {
    if (!isConnecting) return;

    const timer = setTimeout(() => {
      setIsConnecting(false);
    }, 15000);

    return () => clearTimeout(timer);
  }, [isConnecting]);

  const markGoogleAuthUsed = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LAST_AUTH_METHOD_KEY, "google");
        window.dispatchEvent(new Event("fortsolar:last-auth-method-change"));
      } catch {}
    }
  }, []);

  const handleContainerClick = () => {
    setIsConnecting(true);
    markGoogleAuthUsed();

    // If Google GSI is available, trigger prompt
    if (typeof window !== "undefined" && (window as any).google?.accounts?.id?.prompt) {
      try {
        (window as any).google.accounts.id.prompt();
      } catch {}
    }
  };

  const handleSuccess: React.ComponentProps<typeof GoogleLogin>["onSuccess"] = (credentialResponse) => {
    setIsConnecting(false);
    markGoogleAuthUsed();
    onSuccess?.(credentialResponse);
  };

  const handleError = () => {
    setIsConnecting(false);
    onError?.();
  };

  return (
    <div className={cn("relative w-full pt-1.5", wrapperClassName)}>
      {showLastUsed && (
        <span
          data-testid="google-last-used-badge"
          className="absolute -top-1.5 right-3 z-30 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/90 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs pointer-events-none select-none"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Last used
        </span>
      )}

      <div
        ref={containerRef}
        onClick={handleContainerClick}
        className={cn(
          "relative h-12 w-full overflow-hidden rounded-2xl border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 transition shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus-within:ring-2 focus-within:ring-[#16A34A]/20 cursor-pointer",
          className,
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none flex h-full w-full items-center justify-center gap-3 px-4 text-[15px] font-medium text-[#6B7280] dark:text-slate-200"
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-4.5 w-4.5 animate-spin text-[#048a05] dark:text-emerald-400" />
              <span className="text-[#048a05] dark:text-emerald-400 font-medium">Connecting to Google...</span>
            </>
          ) : (
            <>
              <GoogleIcon />
              <span>{label}</span>
            </>
          )}
        </div>

        <GoogleLogin
          {...googleButtonProps}
          onSuccess={handleSuccess}
          onError={handleError}
          click_listener={() => {
            setIsConnecting(true);
            markGoogleAuthUsed();
          }}
          text="continue_with"
          shape="rectangular"
          theme="outline"
          size="large"
          width={googleButtonWidth}
          containerProps={{
            className: "absolute left-0 top-0 z-10 opacity-0 cursor-pointer",
            style: {
              width: googleButtonWidth,
              transform: `scale(${scaleX}, ${scaleY})`,
              transformOrigin: "top left",
            },
          }}
        />
      </div>
    </div>
  );
};

export { GoogleAuthButton };
