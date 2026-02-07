"use client";

import React from "react";
import { LogoFull } from "@/components/features/icons/Logo";
import { OrdersIcon } from "@/components/features/icons/OrdersIcon";
import HeartIcon from "@/components/features/icons/HeartIcon";
import { CartIcon } from "@/components/features/icons/CartIcon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "../icons/SearchIcon";

const DashboardHeader = ({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
}) => {
  return (
    <div className="fixed left-0 top-0 z-50 w-full  bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center lg:mr-16">
          <LogoFull className="h-7 w-auto" />
        </div>
        <div className="flex-1 flex gap-2 items-center">
          <Button className="bg-[#058A05] hover:bg-[#047804] text-white rounded-md h-9 px-4 text-xs gap-2">
            <span className="grid gap-1">
              <span className="h-0.5 w-4 bg-white rounded-full" />
              <span className="h-0.5 w-4 bg-white rounded-full" />
              <span className="h-0.5 w-4 bg-white rounded-full" />
            </span>
            Categories
          </Button>
          <div className="relative  max-w-xl w-full">

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
        </div>

        <div className="flex items-center gap-4 justify-end text-sm text-[#3B3B3B]">
          <div className="flex items-center gap-2 text-xs text-[#3B3B3B]">
            <OrdersIcon className="text-[#3B3B3B]/60" />
            Orders
          </div>
          <button className="relative flex items-center gap-2">
            <HeartIcon className="text-[#3B3B3B]/60" />
            <span className="sr-only">Favorites</span>
          </button>
          <button className="relative flex items-center gap-2 text-xs text-[#3B3B3B]">
            <span className="absolute -top-2 left-2 rounded-full bg-[#E11D48] text-white text-[10px] h-4 min-w-4 px-1.5 grid place-items-center">
              3
            </span>
            <CartIcon className="text-[#3B3B3B]/60" />
            Cart
          </button>
          <Button
            variant="outline"
            className="rounded-full border-[#E4E9EC] px-5 text-xs text-[#3B3B3B]"
          >
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
