import { Metadata } from "@/actions/createCheckoutSession";
import { getStripe } from "@/lib/stripe";
import { backendClient } from "@/sanity/lib/backendClient";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "No Signature found for stripe" },
      { status: 400 }
    );
  }
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Stripe webhook secret is not set");
    return NextResponse.json(
      {
        error: "Stripe webhook secret is not set",
      },
      { status: 400 }
    );
  }
  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch (error) {
    console.error("Stripe client initialization failed:", error);
    return NextResponse.json(
      { error: "Stripe client initialization failed" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json(
      {
        error: "Webhook signature verification failed",
      },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const invoice = session.invoice
      ? await stripe.invoices.retrieve(session.invoice as string)
      : null;

    try {
      await createOrderInSanity(session, invoice);
    } catch (error) {
      console.error("Error creating order in sanity:", error);
      return NextResponse.json(
        {
          error: `Error creating order: ${error}`,
        },
        { status: 400 }
      );
    }
  }
  return NextResponse.json({ received: true });
}

async function createOrderInSanity(
  session: Stripe.Checkout.Session,
  invoice: Stripe.Invoice | null
) {
  const stripe = getStripe();

  const existingOrderId = await backendClient.fetch<string | null>(
    `*[_type == "order" && stripeCheckoutSessionId == $sessionId][0]._id`,
    { sessionId: session.id }
  );

  if (existingOrderId) {
    return null;
  }

  const {
    id,
    amount_total,
    currency,
    metadata,
    payment_intent,
    total_details,
  } = session;
  const normalizedCurrency = (currency || "mad").toUpperCase();
  const {
    orderNumber,
    customerName,
    customerEmail,
    clerkUserId,
    address,
    paymentMethod,
    promoCode,
    promoDiscount,
    installmentMonths,
  } = metadata as unknown as Metadata & {
    address: string;
    paymentMethod?: "cod" | "cmi_card" | "installments";
    promoCode?: string;
    promoDiscount?: string;
    installmentMonths?: string;
  };
  const parsedAddress = address ? JSON.parse(address) : null;

  const lineItemsWithProduct = await stripe.checkout.sessions.listLineItems(
    id,
    { expand: ["data.price.product"] }
  );

  // Create Sanity product references and prepare stock updates
  const sanityProducts = [];
  const stockUpdates = [];
  for (const item of lineItemsWithProduct.data) {
    const productId = (item.price?.product as Stripe.Product)?.metadata?.id;
    const quantity = item?.quantity || 0;

    if (!productId) continue;

    sanityProducts.push({
      _key: crypto.randomUUID(),
      product: {
        _type: "reference",
        _ref: productId,
      },
      quantity,
    });
    stockUpdates.push({ productId, quantity });
  }
  //   Create order in Sanity

  const order = await backendClient.create({
    _type: "order",
    orderNumber,
    stripeCheckoutSessionId: id,
    stripePaymentIntentId: payment_intent,
    customerName,
    stripeCustomerId: (session.customer as string) || "",
    clerkUserId: clerkUserId,
    email: customerEmail,
    currency: normalizedCurrency,
    amountDiscount: total_details?.amount_discount
      ? total_details.amount_discount / 100
      : 0,
    promoCode: promoCode || "",
    promoDiscount: Number(promoDiscount || 0),
    paymentMethod: paymentMethod || "cmi_card",
    paymentStatus: "paid",
    ...(paymentMethod === "installments"
      ? {
          installmentPlan: {
            months: Number(installmentMonths || 3),
            monthlyAmount:
              (amount_total ? amount_total / 100 : 0) /
              Math.max(Number(installmentMonths || 3), 1),
          },
        }
      : {}),

    products: sanityProducts,
    totalPrice: amount_total ? amount_total / 100 : 0,
    status: "paid",
    orderDate: new Date().toISOString(),
    ...(invoice
      ? {
          invoice: {
            id: invoice.id,
            number: invoice.number,
            hosted_invoice_url: invoice.hosted_invoice_url,
          },
        }
      : {}),
    ...(parsedAddress
      ? {
          address: {
            state: parsedAddress.state,
            zip: parsedAddress.zip,
            city: parsedAddress.city,
            phone: parsedAddress.phone,
            address: parsedAddress.address,
            name: parsedAddress.name,
          },
        }
      : {}),
  });
  if (promoCode) {
    const promoId = await backendClient.fetch<string | null>(
      `*[_type == "promoCode" && code == $code][0]._id`,
      { code: promoCode }
    );
    if (promoId) {
      await backendClient.patch(promoId).inc({ usedCount: 1 }).commit();
    }
  }

  // Update stock levels in Sanity

  await updateStockLevels(stockUpdates);
  return order;
}

// Function to update stock levels
async function updateStockLevels(
  stockUpdates: { productId: string; quantity: number }[]
) {
  for (const { productId, quantity } of stockUpdates) {
    try {
      // Fetch current stock
      const product = await backendClient.getDocument(productId);

      if (!product || typeof product.stock !== "number") {
        console.warn(
          `Product with ID ${productId} not found or stock is invalid.`
        );
        continue;
      }

      const newStock = Math.max(product.stock - quantity, 0); // Ensure stock does not go negative

      // Update stock in Sanity
      await backendClient.patch(productId).set({ stock: newStock }).commit();
    } catch (error) {
      console.error(`Failed to update stock for product ${productId}:`, error);
    }
  }
}
