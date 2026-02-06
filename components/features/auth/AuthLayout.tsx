import React from "react";
import { LogoTransparent } from "../icons/LogoTransparent";
import { LogoIcon } from "@/components/features/icons/LogoIcon";

type AuthLayoutProps = {
  children: React.ReactNode;
  asideTitle?: string;
  asideBody?: string;
};

const AuthLayout = ({
  children,
  asideTitle = "SOLAR FACT",
  asideBody = "Did you know? Nigeria gets enough sunlight every year to power the entire country. If everyone went solar!",
}: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-[1.2fr_1fr]">
        <main className="flex items-center justify-center px-6 py-12 lg:px-16">
          <div className="w-full max-w-115 space-y-8">
            <div className="h-15 w-15">
              <LogoIcon />
            </div>
            {children}
          </div>
        </main>
        <aside className="relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 fortsolar-auth-gradient" />
          <div className="relative flex w-full flex-col justify-between px-20 py-24 text-white">
            <LogoTransparent className="h-10" />
            <div className="max-w-105">
              <p className="text-xs font-semibold tracking-[0.32em] text-white/70">
                {asideTitle}
              </p>
              <p className="mt-4 text-2xl font-semibold leading-snug">
                {asideBody}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export { AuthLayout };
