"use client";

import { MY_ORDERS_QUERYResult } from "@/sanity.types";
import { TableBody, TableCell, TableRow } from "./ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import PriceFormatter from "./PriceFormatter";
import { format } from "date-fns";
import { X } from "lucide-react";
import { useState } from "react";
import OrderDetailDialog from "./OrderDetailDialog";
import toast from "react-hot-toast";

const formatStatusLabel = (value?: string) =>
  (value || "unknown")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getOrderStatusClasses = (value?: string) => {
  const status = (value || "").toLowerCase();
  if (status === "paid" || status === "delivered") {
    return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  }
  if (status === "pending" || status === "processing") {
    return "bg-amber-100 text-amber-800 ring-amber-200";
  }
  if (status === "shipped" || status === "out_for_delivery") {
    return "bg-blue-100 text-blue-800 ring-blue-200";
  }
  if (status === "cancelled") {
    return "bg-rose-100 text-rose-800 ring-rose-200";
  }
  return "bg-gray-100 text-gray-700 ring-gray-200";
};

const getPaymentStatusClasses = (value?: string) => {
  const status = (value || "").toLowerCase();
  if (status === "paid") {
    return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  }
  if (status === "partial" || status === "pending") {
    return "bg-amber-100 text-amber-800 ring-amber-200";
  }
  if (status === "failed") {
    return "bg-rose-100 text-rose-800 ring-rose-200";
  }
  if (status === "refunded") {
    return "bg-violet-100 text-violet-800 ring-violet-200";
  }
  return "bg-gray-100 text-gray-700 ring-gray-200";
};

const OrdersComponent = ({ orders }: { orders: MY_ORDERS_QUERYResult }) => {
  const [selectedOrder, setSelectedOrder] = useState<
    MY_ORDERS_QUERYResult[number] | null
  >(null);
  const handleDelete = () => {
    toast.error("La suppression est reservee a l'administrateur");
  };
  return (
    <>
      <TableBody>
        <TooltipProvider>
          {orders.map((order, index) => {
            const paymentStatus = (
              order as MY_ORDERS_QUERYResult[number] & { paymentStatus?: string }
            ).paymentStatus;

            return (
            <Tooltip key={order?._id || order?.orderNumber || `order-${index}`}>
              <TooltipTrigger asChild>
                <TableRow
                  className="cursor-pointer h-14 transition-colors hover:bg-shop_light_green/10"
                  onClick={() => setSelectedOrder(order)}
                >
                  <TableCell className="font-medium">
                    {order.orderNumber?.slice(-10) ?? "N/D"}...
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {order?.orderDate &&
                      format(new Date(order.orderDate), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {order.email}
                  </TableCell>
                  <TableCell>
                    <PriceFormatter
                      amount={order?.totalPrice}
                      className="text-black font-medium"
                    />
                  </TableCell>
                  <TableCell>
                    {order?.status && (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getOrderStatusClasses(order.status)}`}
                      >
                        {formatStatusLabel(order.status)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {paymentStatus && (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getPaymentStatusClasses(paymentStatus)}`}
                      >
                        {formatStatusLabel(paymentStatus)}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="hidden sm:table-cell">
                    {order?.invoice && (
                      <p className="font-medium line-clamp-1">
                        {order?.invoice ? order?.invoice?.number : "----"}
                      </p>
                    )}
                  </TableCell>
                  <TableCell
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete();
                    }}
                    className="flex items-center justify-center group"
                  >
                    <X
                      size={20}
                      className="group-hover:text-shop_dark_green hoverEffect"
                    />
                  </TableCell>
                </TableRow>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cliquez pour voir les details de la commande</p>
              </TooltipContent>
            </Tooltip>
          )})}
        </TooltipProvider>
      </TableBody>
      <OrderDetailDialog
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </>
  );
};

export default OrdersComponent;
