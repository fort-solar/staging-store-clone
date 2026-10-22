"use client";

import React, { useState } from "react";
import { LogoTransparent } from "@/components/features/icons/LogoTransparent";
import HeartIcon from "@/components/features/icons/HeartIcon";
import { CartIcon } from "@/components/features/icons/CartIcon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "../icons/SearchIcon";
import Link from "next/link";
import { useGeneralStore } from "@/store/GeneralStore";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, HelpCircle, LogOut, Settings, List, InspectionPanel, House, UserRound  } from "lucide-react";
import { OrdersIcon } from "../icons/OrdersIcon";
import { useAuth } from "@/components/auth/auth-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const DashboardHeader = ({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { session, signOut } = useAuth();
  const isCustomerLoggedIn = Boolean(session);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const cartCount = useGeneralStore((state) =>
    Array.isArray(state?.cartItems)
      ? state.cartItems.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0)
      : 0
  );
  const favoritesCount = useGeneralStore(
    (state) =>
      (Array.isArray(state?.favorites?.products) ? state.favorites.products.length : 0) +
      (Array.isArray(state?.favorites?.packages) ? state.favorites.packages.length : 0)
  );

  const effectiveCartCount = isMounted ? cartCount : 0;
  const effectiveFavoritesCount = isMounted ? favoritesCount : 0;

  const userInitial = session?.user.fullName?.charAt(0)?.toUpperCase() ?? "A";
  const userFullName = session?.user.fullName ?? "Customer User";
  const userFirstName = session?.user.fullName?.split(" ")[0] ?? "Customer";
  const userEmail = session?.user.email ?? "customer@email.com";

  const handleSignOut = () => {
    void signOut();
    router.replace("/");
  };

  return (
    <div className="fixed left-0 top-0 z-50 w-full border-b border-[#E9EEF0] bg-white dark:bg-[#0a0f1d] dark:border-slate-800">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between lg:justify-start lg:mr-8">
          <Link href="/" className="flex items-center">
            <LogoTransparent className="h-7 w-auto" />
          </Link>
        </div>

        <div className="lg:hidden block relative w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA5AC]">
            <SearchIcon />
          </span>
          <Input
            placeholder="Search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="pl-10 h-11 text-xs rounded-lg border-[#C9D4D9] focus-visible:ring-[#BFE8BF]"
          />
        </div>

        <div className="hidden flex-1 items-center lg:flex lg:justify-start max-w-xl">
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA5AC]">
              <SearchIcon />
            </span>
            <Input
              placeholder="Search products, packages, or solar systems..."
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              className="pl-10 h-10 text-xs rounded-lg border-[#C9D4D9] focus-visible:ring-[#BFE8BF]"
            />
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-4 justify-end text-sm text-[#3B3B3B] dark:text-slate-200">
          <ThemeToggle />
          {isCustomerLoggedIn ? (
            <Link href="/settings/orders" className="flex items-center gap-2 text-xs text-[#3B3B3B] dark:text-slate-200 hover:text-[#048A05] dark:hover:text-emerald-400">
              <OrdersIcon className="text-[#3B3B3B]/60 dark:text-slate-400" />
              <span className="hidden lg:block">
                Orders
              </span>
            </Link>
          ) : null}
          <Link
            href="/favorites"
            className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {effectiveFavoritesCount > 0 && (
              <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-[#E11D48]" />
            )}
            <HeartIcon className="text-[#3B3B3B]/60 dark:text-slate-400" />
            <span className="sr-only">Favorites</span>
          </Link>
          <Link href="/cart" className="relative flex items-center gap-2 text-xs text-[#3B3B3B] dark:text-slate-200 hover:text-[#048A05] dark:hover:text-emerald-400">
            {effectiveCartCount > 0 && (
              <span className="absolute -top-2 left-2 rounded-full bg-[#E11D48] text-white text-[10px] h-4 min-w-4 px-1.5 grid place-items-center">
                {effectiveCartCount}
              </span>
            )}
            <CartIcon className="text-[#3B3B3B]/60 dark:text-slate-400" />
            Cart
          </Link>

          {isCustomerLoggedIn ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] p-1 rounded-md flex items-center gap-2"
              >
                <div className="bg-[#EBFAEB] dark:bg-emerald-950/60 text-[#048a05] dark:text-emerald-400 px-3 py-1 rounded-md">
                  <p className="text-sm font-medium">{userInitial}</p>
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold line-clamp-1 text-slate-900 dark:text-slate-100">{userFirstName}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Customer</p>
                </div>
                 {isCustomerLoggedIn && isProfileMenuOpen ? <ChevronUp className="w-3 h-3 text-slate-500" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}  
              </button>
            </div>
          ) : (
            <Link href="/login">
              <Button
                variant="outline"
                className="rounded-lg cursor-pointer border-[#E4E9EC] dark:border-slate-700 px-5 text-xs text-[#3B3B3B] dark:text-slate-200"
              >
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>

      <nav
        aria-label="Store navigation"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[#E2E8EC] bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {[
            { href: "/", label: "Store", icon: House, active: pathname === "/" },
            { href: "/settings/orders#section", label: "Orders", icon: OrdersIcon, active: pathname.startsWith("/settings/orders") },
            { href: "/favorites", label: "Favorites", icon: HeartIcon, active: pathname.startsWith("/favorites"), badge: effectiveFavoritesCount },
            { href: "/cart", label: "Cart", icon: CartIcon, active: pathname.startsWith("/cart"), badge: effectiveCartCount },
            { href: isCustomerLoggedIn ? "/settings/profile#section" : "/login", label: isCustomerLoggedIn ? "Profile" : "Sign in", icon: UserRound, active: pathname.startsWith("/settings/profile") || pathname === "/login" },
          ].map(({ href, label, icon: Icon, active, badge }) => (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors ${
                active ? "bg-[#EBFAEB] text-[#048A05]" : "text-[#66727A] hover:bg-[#F4F7F8] hover:text-[#30343A]"
              }`}
            >
              <span className="relative flex h-5 w-5 items-center justify-center">
                <Icon className="h-5 w-5" />
                {badge ? (
                  <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#E11D48] px-1 text-[9px] text-white">
                    {badge > 99 ? "99+" : badge}
                  </span>
                ) : null}
              </span>
              <span className="w-full truncate text-center">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {isCustomerLoggedIn && isProfileMenuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-20 bg-transparent"
            onClick={() => setIsProfileMenuOpen(false)}
            aria-label="Close profile menu"
          />
          <div className="absolute right-4 top-18 z-30 w-80 max-w-[90vw] rounded-[24px] border border-[#C9D5DF] dark:border-slate-800 bg-white dark:bg-[#111827] p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#17A11E] bg-[#EAF8EA] dark:bg-emerald-950/60 text-2xl text-[#3B3B3B] dark:text-emerald-400">
                  {userInitial}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1F2937] dark:text-slate-100">{userFullName}</p>
                  <p className="text-xs text-[#4B5563] dark:text-slate-400">{userEmail}</p>
                </div>
              </div>
              <ChevronUp className="h-5 w-5 text-[#4B5563] dark:text-slate-400 cursor-pointer" onClick={() => setIsProfileMenuOpen(false)}/>
            </div>

            <div className="mt-4 border-t border-[#D8E0E8] dark:border-slate-800 pt-3">
              <Link
                href="/settings/orders#section"
                className="flex lg:hidden w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[#30343A] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-800"
              >
                <OrdersIcon className="h-5 w-5" />
                Orders
              </Link>
              <Link
                href="/settings/orders"
                className="hidden lg:flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[#30343A] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-800"
              >
                <OrdersIcon className="h-5 w-5" />
                Orders
              </Link>
              <Link
                href="/settings/quotes#section"
                className="flex lg:hidden w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[#30343A] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-800"
              >
                <List className="h-5 w-5" />
                Quotes
              </Link>
              <Link
                href="/settings/quotes"
                className="hidden lg:flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[#30343A] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-800"
              >
                <List className="h-5 w-5" />
                Quotes
              </Link>
              <Link
                href="/settings/installations#section"
                className="flex lg:hidden w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[#30343A] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-800"
              >
                <InspectionPanel className="h-5 w-5" />
                Installations
              </Link>
              <Link
                href="/settings/installations"
                className="hidden lg:flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[#30343A] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-800"
              >
                <InspectionPanel className="h-5 w-5" />
                Installations
              </Link>
              <Link
                href="/settings/profile"
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[#30343A] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-800"
              >
                <Settings className="h-5 w-5" />
                Settings
              </Link>
              <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[#30343A] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-800">
                <HelpCircle className="h-5 w-5" />
                Help &amp; Support
              </button>
            </div>

            <div className="mt-4 border-t border-[#D8E0E8] dark:border-slate-800 pt-3">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[#F35B5B] hover:bg-[#FFF5F5] dark:hover:bg-red-950/30"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardHeader;
