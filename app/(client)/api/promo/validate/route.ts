import {calculatePromoDiscount, PaymentMethod, PromoCodeRecord} from "@/lib/promo";
import {backendClient} from "@/sanity/lib/backendClient";
import {auth} from "@clerk/nextjs/server";
import {NextRequest, NextResponse} from "next/server";

export const dynamic = "force-dynamic";

const PROMO_QUERY = `*[_type == "promoCode" && code == $code][0]{
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
}`;

export async function POST(req: NextRequest) {
  try {
    const {userId} = await auth();
    if (!userId) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const payload = await req.json();
    const code = String(payload.code || "").trim().toUpperCase();
    const subtotal = Number(payload.subtotal || 0);
    const paymentMethod = (payload.paymentMethod || "cmi_card") as PaymentMethod;

    if (!code) {
      return NextResponse.json({valid: false, message: "Promo code is required."});
    }

    const promo = await backendClient.fetch<PromoCodeRecord | null>(PROMO_QUERY, {code});
    const result = calculatePromoDiscount(promo, subtotal, paymentMethod);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Promo validation failed:", error);
    return NextResponse.json(
      {valid: false, message: "Failed to validate promo code."},
      {status: 500}
    );
  }
}
