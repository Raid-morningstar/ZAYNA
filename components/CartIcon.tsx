"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import React from "react";
import useStore from "@/store";

const CartIcon = () => {
  const items = useStore((state) => state.items);
  const cartCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <Link href={"/cart"} className="group relative">
      <ShoppingBag className="w-5 h-5 hover:text-shop_light_green hoverEffect" />
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-shop_dark_green text-white h-3.5 min-w-3.5 px-1 rounded-full text-xs font-semibold flex items-center justify-center">
          {cartCount}
        </span>
      )}
    </Link>
  );
};

export default CartIcon;
