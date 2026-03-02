import { BasketIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "sanity";

export const orderType = defineType({
  name: "order",
  title: "Order",
  type: "document",
  icon: BasketIcon,
  groups: [
    { name: "workflow", title: "Workflow", default: true },
    { name: "customer", title: "Customer" },
    { name: "items", title: "Items" },
    { name: "finance", title: "Finance" },
    { name: "shipping", title: "Shipping" },
    { name: "system", title: "System" },
  ],
  fields: [
    defineField({
      name: "status",
      title: "Order Status",
      type: "string",
      group: "workflow",
      description: "Track operational progress of the order.",
      options: {
        layout: "radio",
        list: [
          { title: "Pending", value: "pending" },
          { title: "Processing", value: "processing" },
          { title: "Paid", value: "paid" },
          { title: "Shipped", value: "shipped" },
          { title: "Out for Delivery", value: "out_for_delivery" },
          { title: "Delivered", value: "delivered" },
          { title: "Cancelled", value: "cancelled" },
        ],
      },
      initialValue: "pending",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "paymentStatus",
      title: "Payment Status",
      type: "string",
      group: "workflow",
      description: "Use this field when validating or rejecting payment.",
      options: {
        layout: "radio",
        list: [
          { title: "Pending", value: "pending" },
          { title: "Partial", value: "partial" },
          { title: "Paid", value: "paid" },
          { title: "Failed", value: "failed" },
          { title: "Refunded", value: "refunded" },
        ],
      },
      initialValue: "pending",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "orderDate",
      title: "Order Date",
      type: "datetime",
      group: "workflow",
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "orderNumber",
      title: "Order Number",
      type: "string",
      group: "workflow",
      readOnly: true,
      description: "Auto-generated unique order reference.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "customerName",
      title: "Customer Name",
      type: "string",
      group: "customer",
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "email",
      title: "Customer Email",
      type: "string",
      group: "customer",
      readOnly: true,
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: "products",
      title: "Products",
      type: "array",
      group: "items",
      readOnly: true,
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "product",
              title: "Product",
              type: "reference",
              to: [{ type: "product" }],
            }),
            defineField({
              name: "quantity",
              title: "Quantity",
              type: "number",
            }),
          ],
          preview: {
            select: {
              product: "product.name",
              quantity: "quantity",
              image: "product.image",
              price: "product.price",
            },
            prepare(select) {
              const total = (select.price || 0) * (select.quantity || 0);
              return {
                title: `${select.product || "Product"} x ${select.quantity || 0}`,
                subtitle: `${total} MAD`,
                media: select.image,
              };
            },
          },
        }),
      ],
    }),
    defineField({
      name: "paymentMethod",
      title: "Payment Method",
      type: "string",
      group: "finance",
      readOnly: true,
      options: {
        list: [
          { title: "Cash on Delivery", value: "cod" },
          { title: "Card Payment", value: "cmi_card" },
          { title: "Installments", value: "installments" },
        ],
      },
      initialValue: "cmi_card",
    }),
    defineField({
      name: "totalPrice",
      title: "Total Price",
      type: "number",
      group: "finance",
      readOnly: true,
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "currency",
      title: "Currency",
      type: "string",
      group: "finance",
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "amountDiscount",
      title: "Amount Discount",
      type: "number",
      group: "finance",
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "promoCode",
      title: "Promo Code",
      type: "string",
      group: "finance",
      readOnly: true,
    }),
    defineField({
      name: "promoDiscount",
      title: "Promo Discount",
      type: "number",
      group: "finance",
      readOnly: true,
      initialValue: 0,
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "installmentPlan",
      title: "Installment Plan",
      type: "object",
      group: "finance",
      readOnly: true,
      hidden: ({ document }) => document?.paymentMethod !== "installments",
      fields: [
        defineField({
          name: "months",
          title: "Months",
          type: "number",
          validation: (Rule) => Rule.min(2).max(12),
        }),
        defineField({
          name: "monthlyAmount",
          title: "Monthly Amount",
          type: "number",
          validation: (Rule) => Rule.min(0),
        }),
      ],
    }),
    defineField({
      name: "address",
      title: "Shipping Address",
      type: "object",
      group: "shipping",
      readOnly: true,
      fields: [
        defineField({ name: "name", title: "Contact Name", type: "string" }),
        defineField({ name: "phone", title: "Phone Number", type: "string" }),
        defineField({ name: "address", title: "Street Address", type: "string" }),
        defineField({ name: "city", title: "City", type: "string" }),
        defineField({ name: "state", title: "State", type: "string" }),
        defineField({ name: "zip", title: "Zip Code", type: "string" }),
      ],
    }),
    defineField({
      name: "invoice",
      title: "Invoice",
      type: "object",
      group: "system",
      readOnly: true,
      hidden: true,
      fields: [
        defineField({ name: "id", title: "Invoice ID", type: "string" }),
        defineField({ name: "number", title: "Invoice Number", type: "string" }),
        defineField({ name: "hosted_invoice_url", title: "Hosted URL", type: "url" }),
      ],
    }),
    defineField({
      name: "stripeCheckoutSessionId",
      title: "Stripe Checkout Session ID",
      type: "string",
      group: "system",
      hidden: true,
      readOnly: true,
    }),
    defineField({
      name: "stripeCustomerId",
      title: "Stripe Customer ID",
      type: "string",
      group: "system",
      hidden: true,
      readOnly: true,
    }),
    defineField({
      name: "stripePaymentIntentId",
      title: "Stripe Payment Intent ID",
      type: "string",
      group: "system",
      hidden: true,
      readOnly: true,
    }),
    defineField({
      name: "clerkUserId",
      title: "Store User ID",
      type: "string",
      group: "system",
      hidden: true,
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      name: "customerName",
      amount: "totalPrice",
      currency: "currency",
      orderId: "orderNumber",
      email: "email",
      status: "status",
      paymentStatus: "paymentStatus",
    },
    prepare(select) {
      const safeOrderId = select.orderId || "NoOrderId";
      const orderIdSnippet =
        safeOrderId.length > 10
          ? `${safeOrderId.slice(0, 5)}...${safeOrderId.slice(-5)}`
          : safeOrderId;

      const statusLabel = select.status
        ? `${select.status}`.replace(/_/g, " ")
        : "pending";
      const paymentLabel = select.paymentStatus || "pending";

      return {
        title: `${select.name || "Unknown Customer"} (${orderIdSnippet})`,
        subtitle: `${select.amount || 0} ${select.currency || "MAD"} | Order: ${statusLabel} | Payment: ${paymentLabel} | ${select.email || "-"}`,
        media: BasketIcon,
      };
    },
  },
});
