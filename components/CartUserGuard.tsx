"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import useStore from "@/store";

const CART_OWNER_KEY = "cart-store-owner";

const CartUserGuard = () => {
  const { isLoaded, userId } = useAuth();
  const resetCart = useStore((state) => state.resetCart);

  useEffect(() => {
    if (!isLoaded || !userId) {
      return;
    }

    const previousOwner = window.localStorage.getItem(CART_OWNER_KEY);
    if (previousOwner !== userId) {
      resetCart();
      window.localStorage.setItem(CART_OWNER_KEY, userId);
    }
  }, [isLoaded, userId, resetCart]);

  return null;
};

export default CartUserGuard;
