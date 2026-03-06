"use client";

import { cn } from "@/lib/utils";
import { ClerkLoaded, SignedIn, UserButton } from "@clerk/nextjs";
import { Logs } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import CartIcon from "./CartIcon";
import FavoriteButton from "./FavoriteButton";
import HeaderMenu from "./HeaderMenu";
import SearchBar from "./SearchBar";
import SignIn from "./SignIn";

interface HeaderDesktopNavProps {
  userId: string | null;
  ordersCount: number;
}

const smoothTransition =
  "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]";

const HeaderDesktopNav = ({ userId, ordersCount }: HeaderDesktopNavProps) => {
  const [isSearchActive, setIsSearchActive] = useState(false);

  return (
    <>
      <div
        className={cn(
          "hidden min-w-0 lg:flex lg:items-center lg:justify-center",
          smoothTransition,
          isSearchActive ? "-translate-x-5 xl:-translate-x-8" : "translate-x-0"
        )}
      >
        <HeaderMenu
          isSearchActive={isSearchActive}
          className={cn(smoothTransition, isSearchActive && "opacity-90")}
        />
      </div>

      <div
        className={cn(
          "hidden lg:flex lg:items-center lg:justify-end",
          smoothTransition,
          isSearchActive ? "translate-x-1.5" : "translate-x-0"
        )}
      >
        <div
          className={cn(
            "inline-flex items-center rounded-full border border-shop_light_green/30 bg-white/80 p-1.5 shadow-[0_14px_32px_-28px_rgba(22,46,110,1)] backdrop-blur-md",
            smoothTransition,
            isSearchActive &&
              "border-shop_dark_green/35 shadow-[0_20px_38px_-28px_rgba(22,46,110,1)]"
          )}
        >
          <SearchBar
            mode="desktop"
            onDesktopActiveChange={setIsSearchActive}
            className="mr-1"
          />

          <div
            className={cn(
              "flex items-center gap-2.5 xl:gap-3.5",
              smoothTransition,
              isSearchActive ? "translate-x-1.5" : "translate-x-0"
            )}
          >
            <CartIcon />
            <FavoriteButton />

            {userId && (
              <Link
                href={"/orders"}
                className="group relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-shop_light_green/30 bg-white/90 text-lightColor shadow-[0_10px_24px_-20px_rgba(22,46,110,0.9)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-shop_light_green/70 hover:text-shop_dark_green"
              >
                <Logs className="h-4.5 w-4.5" />
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-shop_btn_dark_green px-1 text-[10px] font-semibold text-white">
                  {ordersCount}
                </span>
              </Link>
            )}

            <ClerkLoaded>
              <SignedIn>
                <div className="pl-0.5">
                  <UserButton />
                </div>
              </SignedIn>
              {!userId && <SignIn className="px-3.5" />}
            </ClerkLoaded>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 lg:hidden">
        <SearchBar mode="mobile" />
        <CartIcon className="h-8 w-8" iconClassName="h-4 w-4" />
        <FavoriteButton className="h-8 w-8" iconClassName="h-4 w-4" />

        {userId && (
          <Link
            href={"/orders"}
            className="group relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-shop_light_green/35 bg-white/90 text-lightColor"
          >
            <Logs className="h-4 w-4 transition-colors duration-300 group-hover:text-shop_dark_green" />
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-shop_btn_dark_green px-1 text-[10px] font-semibold text-white">
              {ordersCount}
            </span>
          </Link>
        )}

        <ClerkLoaded>
          <SignedIn>
            <UserButton />
          </SignedIn>
          {!userId && <SignIn className="h-8 px-3 py-1 text-xs" />}
        </ClerkLoaded>
      </div>
    </>
  );
};

export default HeaderDesktopNav;
