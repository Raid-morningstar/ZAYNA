"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type OrderStatusAutoRefreshProps = {
  intervalMs?: number;
};

const OrderStatusAutoRefresh = ({
  intervalMs = 30000,
}: OrderStatusAutoRefreshProps) => {
  const router = useRouter();

  useEffect(() => {
    const refreshIfActive = () => {
      if (document.visibilityState !== "visible") return;
      if (!document.hasFocus()) return;
      router.refresh();
    };

    const timer = window.setInterval(refreshIfActive, intervalMs);
    const onFocus = () => refreshIfActive();
    const onVisibilityChange = () => refreshIfActive();

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router, intervalMs]);

  return null;
};

export default OrderStatusAutoRefresh;
