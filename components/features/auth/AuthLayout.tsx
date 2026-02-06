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
    <div className="relative min-h-screen bg-white">
      <div className="min-h-screen lg:grid lg:grid-cols-[1.3fr_1fr]">
        <main className="flex max-h-screen items-start justify-center overflow-y-auto px-6 py-12 lg:px-16">
          <div className="w-full max-w-115 space-y-8">
            <div className="h-15 w-15">
              <LogoIcon />
            </div>
            {children}
          </div>
        </main>
        <aside className="relative hidden lg:block">
          <div className="fixed right-0 top-0 hidden h-screen w-[45%] overflow-hidden lg:block lg:w-[45%]">
            <div className="absolute inset-0 fortsolar-auth-gradient" />
            <div className="relative flex h-full w-full flex-col justify-between px-20 py-24 text-white">
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
          </div>
        </aside>
      </div>
    </div>
  );
};

export { AuthLayout };
