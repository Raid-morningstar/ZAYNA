"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type OrderStatusAutoRefreshProps = {
  intervalMs?: number;
};

const OrderStatusAutoRefresh = ({
  intervalMs = 15000,
}: OrderStatusAutoRefreshProps) => {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [router, intervalMs]);

  return null;
};

export default OrderStatusAutoRefresh;
