"use client";
import { cn } from "@/lib/utils";
import { headerData } from "@/constants/data";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface HeaderMenuProps {
  className?: string;
  isSearchActive?: boolean;
}

const HeaderMenu = ({ className, isSearchActive = false }: HeaderMenuProps) => {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "inline-flex min-w-0 items-center justify-center gap-5 text-sm font-medium tracking-[0.01em] text-lightColor transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] xl:gap-8",
        isSearchActive && "gap-4 xl:gap-6",
        className
      )}
      aria-label="Navigation principale"
    >
      {headerData?.map((item) => {
        const isActive = pathname === item?.href;
        return (
          <Link
            key={item?.title}
            href={item?.href}
            className={cn(
              "group relative whitespace-nowrap rounded-full px-2.5 py-1.5 capitalize text-[13px] transition-all duration-300 ease-out",
              isActive
                ? "bg-shop_light_bg text-shop_dark_green"
                : "hover:bg-shop_light_bg/70 hover:text-shop_dark_green"
            )}
          >
            <span>{item?.title}</span>
            <span
              className={cn(
                "absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-shop_light_green transition-all duration-300 ease-out group-hover:w-[65%]",
                isActive && "w-[65%]"
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
};

export default HeaderMenu;
