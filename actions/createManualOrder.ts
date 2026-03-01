"use server";

import {
  calculatePromoDiscount,
  PaymentMethod,
  PromoCalculationResult,
  PromoCodeRecord,
} from "@/lib/promo";
import {backendClient} from "@/sanity/lib/backendClient";
import {Address} from "@/sanity.types";
import {CartItem} from "@/store";
import {auth, currentUser} from "@clerk/nextjs/server";

type GroupedCartItems = {
  product: CartItem["product"];
  quantity: number;
};

type CreateManualOrderInput = {
  items: GroupedCartItems[];
  address?: Address | null;
  paymentMethod: Exclude<PaymentMethod, "cmi_card">;
  promoCode?: string;
  installmentMonths?: number;
};

export async function createManualOrder(input: CreateManualOrderInput) {
  const {userId} = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await currentUser();
  const customerEmail =
    user?.primaryEmailAddress?.emailAddress || user?.emailAddresses[0]?.emailAddress;
  if (!customerEmail) {
    throw new Error("Customer email is not available");
  }

  const subtotal = input.items.reduce(
    (total, item) => total + (item.product.price || 0) * item.quantity,
    0
  );
  const promoCode = input.promoCode?.trim().toUpperCase();

  let promoCalculation: PromoCalculationResult = {
    valid: false,
    discountAmount: 0,
    finalTotal: subtotal,
  };

  if (promoCode) {
    const promo = await backendClient.fetch<PromoCodeRecord | null>(
      `*[_type == "promoCode" && code == $code][0]{
        _id,
        code,
        active,
        discountType,
        discountValue,
        minimumOrderAmount,
        allowedPaymentMethods,
        startsAt,
        endsAt,
        usageLimit,
        usedCount
      }`,
      {code: promoCode}
    );
    promoCalculation = calculatePromoDiscount(promo, subtotal, input.paymentMethod);
    if (!promoCalculation.valid) {
      throw new Error(promoCalculation.message || "Invalid promo code");
    }
  }

  const orderNumber = crypto.randomUUID();
  const order = await backendClient.create({
    _type: "order",
    orderNumber,
    customerName: user?.fullName || "Customer",
    clerkUserId: userId,
    email: customerEmail,
    currency: "USD",
    products: input.items.map((item) => ({
      _key: crypto.randomUUID(),
      product: {
        _type: "reference",
        _ref: item.product._id,
      },
      quantity: item.quantity,
    })),
    totalPrice: promoCalculation.finalTotal,
    amountDiscount: 0,
    promoCode: promoCode || "",
    promoDiscount: promoCalculation.discountAmount || 0,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentMethod === "cod" ? "pending" : "partial",
    status: "pending",
    orderDate: new Date().toISOString(),
    ...(input.paymentMethod === "installments"
      ? {
          installmentPlan: {
            months: input.installmentMonths || 3,
            monthlyAmount:
              (promoCalculation.finalTotal || 0) / (input.installmentMonths || 3),
          },
        }
      : {}),
    ...(input.address
      ? {
          address: {
            state: input.address.state,
            zip: input.address.zip,
            city: input.address.city,
            phone: (input.address as Address & {phone?: string}).phone,
            address: input.address.address,
            name: input.address.name,
          },
        }
      : {}),
  });

  if (promoCalculation.valid && promoCalculation.promoId) {
    await backendClient
      .patch(promoCalculation.promoId)
      .inc({usedCount: 1})
      .commit({autoGenerateArrayKeys: false});
  }

  return {
    orderId: order._id,
    orderNumber,
  };
}
