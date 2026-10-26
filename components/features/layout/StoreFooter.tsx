"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { GoogleIcon } from "@/components/features/icons/GoogleIcon";
import {
  FORTSOLAR_GOOGLE_REVIEW_URL,
  FORTSOLAR_WHATSAPP_NUMBER,
} from "@/lib/env";
import { MapPin, Phone, ShieldCheck, Truck, Headphones, ExternalLink } from "lucide-react";

export function StoreFooter() {
  const whatsappUrl = `https://wa.me/${FORTSOLAR_WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello Fortsolar, I am browsing your online store and would like to make an enquiry.")}`;

  return (
    <footer className="mt-16 border-t border-[#E9EEF0] dark:border-slate-800 bg-[#FAFBFB] dark:bg-[#0c1322] text-[#252C32] dark:text-slate-200 transition-colors">
      {/* Trust & Guarantee Banner */}
      <div className="border-b border-[#E9EEF0] dark:border-slate-800/80 bg-white dark:bg-[#0f172a]">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#048A05] dark:text-emerald-400">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Nationwide Waybill & Delivery</h4>
                <p className="mt-0.5 text-xs text-[#5A646B] dark:text-slate-400">
                  Reliable park-to-park interstate logistics to all 36 states and the FCT.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#048A05] dark:text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Certified Solar Engineers</h4>
                <p className="mt-0.5 text-xs text-[#5A646B] dark:text-slate-400">
                  Professional nationwide installation, commissioning, and up to 10-year equipment warranty.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#048A05] dark:text-emerald-400">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Direct Engineering Support</h4>
                <p className="mt-0.5 text-xs text-[#5A646B] dark:text-slate-400">
                  Speak directly with an energy specialist for custom load sizing and recommendations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.3fr_0.8fr_0.9fr]">
          {/* Company & Nationwide Reputation */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <Image
                src="/FortsolarLogo.png"
                alt="Fortsolar Logo"
                width={130}
                height={36}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <p className="max-w-md text-xs leading-relaxed text-[#5A646B] dark:text-slate-400">
              Fortsolar provides Tier-1 solar panels, hybrid inverters, and lithium energy storage systems for homes, businesses, and industrial facilities across Nigeria.
            </p>

            {/* Consolidated Verified Rating Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11192e] p-4 shadow-2xs">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <GoogleIcon />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Fortsolar Verified Rating</span>
                      <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 text-[9px] font-semibold text-[#048A05] dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                        Verified Business
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-amber-500 font-semibold tracking-tight">★★★★★</span>
                      <span className="font-bold text-slate-900 dark:text-white">4.9 / 5.0</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-[11px] text-[#5A646B] dark:text-slate-400">Nationwide installations</span>
                    </div>
                  </div>
                </div>

                <a
                  href={FORTSOLAR_GOOGLE_REVIEW_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <span>Google Reviews</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Catalog Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Store Catalog</h4>
            <ul className="space-y-2 text-xs text-[#5A646B] dark:text-slate-400">
              <li>
                <Link href="/packages" className="transition-colors hover:text-[#048A05]">
                  Solar Packages
                </Link>
              </li>
              <li>
                <Link href="/products" className="transition-colors hover:text-[#048A05]">
                  All Catalog Products
                </Link>
              </li>
              <li>
                <a
                  href="https://www.fortsolar.ng/energy-calculator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-[#048A05]"
                >
                  <span>Solar Load Calculator</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.fortsolar.ng/about"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-[#048A05]"
                >
                  <span>About Fortsolar</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </li>
              <li>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#048A05] font-semibold hover:underline"
                >
                  <span>Chat with an Engineer</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </li>
            </ul>
          </div>

          {/* Experience Centres & Nationwide Coverage */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Offices & Service Coverage</h4>
            <div className="space-y-3 text-xs text-[#5A646B] dark:text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#048A05]" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-200">Lagos (Headquarters)</p>
                  <p className="text-[11px] leading-snug">Suite D1 038, HFP Eastline Complex, Abraham Adesanya Axis, Lekki–Epe Expressway, Lagos.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#048A05]" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-200">Uyo (Regional Branch)</p>
                  <p className="text-[11px] leading-snug">183 Ikot Ekpene Road, Uyo, Akwa Ibom State.</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-slate-900 dark:text-slate-200">
                <Phone className="h-3.5 w-3.5 text-[#048A05]" />
                <a href={`tel:+${FORTSOLAR_WHATSAPP_NUMBER}`} className="font-medium hover:underline">
                  +234 706 652 4793
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-10 border-t border-[#E9EEF0] dark:border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5A646B] dark:text-slate-400">
          <p>© {new Date().getFullYear()} Fortsolar Nigeria. All rights reserved.</p>
          <p className="text-[11px]">
            Delivering clean, dependable energy solutions across Nigeria.
          </p>
        </div>
      </div>
    </footer>
  );
}
