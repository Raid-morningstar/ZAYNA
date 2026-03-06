"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import React from "react";
import useStore from "@/store";
import { cn } from "@/lib/utils";

interface CartIconProps {
  className?: string;
  iconClassName?: string;
}

const CartIcon = ({ className, iconClassName }: CartIconProps) => {
  const items = useStore((state) => state.items);
  const cartCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <Link
      href={"/cart"}
      className={cn(
        "group relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-shop_light_green/30 bg-white/90 text-lightColor shadow-[0_10px_24px_-20px_rgba(22,46,110,0.9)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-shop_light_green/70 hover:text-shop_dark_green",
        className
      )}
    >
      <ShoppingBag className={cn("h-4.5 w-4.5", iconClassName)} />
      {cartCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-shop_dark_green px-1 text-[10px] font-semibold text-white">
          {cartCount}
        </span>
      )}
    </Link>
  );
};

export default CartIcon;
