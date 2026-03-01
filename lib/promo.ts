export type PaymentMethod = "cod" | "cmi_card" | "installments";

export type PromoCodeRecord = {
  _id: string;
  code: string;
  active?: boolean;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  minimumOrderAmount?: number;
  allowedPaymentMethods?: PaymentMethod[];
  startsAt?: string;
  endsAt?: string;
  usageLimit?: number;
  usedCount?: number;
};

export type PromoCalculationResult = {
  valid: boolean;
  message?: string;
  discountAmount: number;
  finalTotal: number;
  promoId?: string;
  promoCode?: string;
};

export function calculatePromoDiscount(
  promo: PromoCodeRecord | null,
  subtotal: number,
  paymentMethod: PaymentMethod
): PromoCalculationResult {
  if (!promo) {
    return {
      valid: false,
      message: "Promo code not found.",
      discountAmount: 0,
      finalTotal: subtotal,
    };
  }

  if (!promo.active) {
    return {
      valid: false,
      message: "Promo code is inactive.",
      discountAmount: 0,
      finalTotal: subtotal,
    };
  }

  const now = Date.now();
  if (promo.startsAt && new Date(promo.startsAt).getTime() > now) {
    return {
      valid: false,
      message: "Promo code is not active yet.",
      discountAmount: 0,
      finalTotal: subtotal,
    };
  }
  if (promo.endsAt && new Date(promo.endsAt).getTime() < now) {
    return {
      valid: false,
      message: "Promo code has expired.",
      discountAmount: 0,
      finalTotal: subtotal,
    };
  }

  if (
    promo.allowedPaymentMethods?.length &&
    !promo.allowedPaymentMethods.includes(paymentMethod)
  ) {
    return {
      valid: false,
      message: "Promo code is not valid for this payment method.",
      discountAmount: 0,
      finalTotal: subtotal,
    };
  }

  if ((promo.minimumOrderAmount || 0) > subtotal) {
    return {
      valid: false,
      message: `Minimum order amount is ${promo.minimumOrderAmount}.`,
      discountAmount: 0,
      finalTotal: subtotal,
    };
  }

  if (
    typeof promo.usageLimit === "number" &&
    (promo.usedCount || 0) >= promo.usageLimit
  ) {
    return {
      valid: false,
      message: "Promo usage limit reached.",
      discountAmount: 0,
      finalTotal: subtotal,
    };
  }

  const discountValue = promo.discountValue || 0;
  let discountAmount = 0;
  if (promo.discountType === "percentage") {
    discountAmount = (subtotal * discountValue) / 100;
  } else if (promo.discountType === "fixed") {
    discountAmount = discountValue;
  }

  discountAmount = Math.max(0, Math.min(discountAmount, subtotal));

  return {
    valid: true,
    discountAmount,
    finalTotal: Math.max(0, subtotal - discountAmount),
    promoId: promo._id,
    promoCode: promo.code,
  };
}
