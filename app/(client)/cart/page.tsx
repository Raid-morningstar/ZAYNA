"use client";

import {
  createCheckoutSession,
  Metadata,
} from "@/actions/createCheckoutSession";
import { createManualOrder } from "@/actions/createManualOrder";
import Container from "@/components/Container";
import EmptyCart from "@/components/EmptyCart";
import NoAccess from "@/components/NoAccess";
import PriceFormatter from "@/components/PriceFormatter";
import ProductSideMenu from "@/components/ProductSideMenu";
import QuantityButtons from "@/components/QuantityButtons";
import Title from "@/components/Title";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Address } from "@/sanity.types";
import { urlFor } from "@/sanity/lib/image";
import useStore from "@/store";
import { useAuth } from "@clerk/nextjs";
import { CreditCard, HandCoins, Landmark, ShoppingBag, Trash } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

type PaymentMethod = "cod" | "cmi_card" | "installments";
type AddressFormData = {
  name: string;
  address: string;
  city: string;
  phone: string;
  state: string;
  zip: string;
  default: boolean;
};

const CartPage = () => {
  const {
    deleteCartProduct,
    getTotalPrice,
    getItemCount,
    resetCart,
  } = useStore();
  const [loading, setLoading] = useState(false);
  const groupedItems = useStore((state) => state.getGroupedItems());
  const { isSignedIn } = useAuth();
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cmi_card");
  const [installmentMonths, setInstallmentMonths] = useState<number>(3);
  const [canUseInstallments, setCanUseInstallments] = useState(false);
  const [loyalty, setLoyalty] = useState<{
    cardNumber: string;
    points: number;
    tier: string;
  } | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoState, setPromoState] = useState<{
    valid: boolean;
    message?: string;
    discountAmount: number;
    finalTotal: number;
  } | null>(null);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressFormData>({
    name: "",
    address: "",
    city: "",
    phone: "",
    state: "",
    zip: "",
    default: false,
  });

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/addresses", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch addresses");
      }

      const data: Address[] = await response.json();
      setAddresses(data);
      const defaultAddress = data.find((addr: Address) => addr.default);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
      } else if (data.length > 0) {
        setSelectedAddress(data[0]); // Optional: select first address if no default
      }
    } catch (error) {
      console.log("Addresses fetching error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const onAddressFieldChange = (
    field: keyof AddressFormData,
    value: string | boolean
  ) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
  };

  const createAddress = async () => {
    if (
      !addressForm.name.trim() ||
      !addressForm.address.trim() ||
      !addressForm.city.trim() ||
      !addressForm.phone.trim() ||
      !addressForm.state.trim() ||
      !addressForm.zip.trim()
    ) {
      toast.error("Please fill all address fields");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressForm),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "Failed to create address");
      }
      const created: Address = await response.json();
      setAddresses((prev) => [created, ...(prev || [])]);
      setSelectedAddress(created);
      setAddressForm({
        name: "",
        address: "",
        city: "",
        phone: "",
        state: "",
        zip: "",
        default: false,
      });
      setIsAddressDialogOpen(false);
      toast.success("Address added successfully");
    } catch (error) {
      console.error("Create address error:", error);
      const message =
        error instanceof Error ? error.message : "Unable to create address";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckoutContext = useCallback(async () => {
    try {
      const response = await fetch("/api/checkout-context", {
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = await response.json();
      setCanUseInstallments(Boolean(data.canUseInstallments));
      setLoyalty(data.loyalty || null);
      if (!data.canUseInstallments && paymentMethod === "installments") {
        setPaymentMethod("cmi_card");
      }
    } catch (error) {
      console.error("Checkout context error:", error);
    }
  }, [paymentMethod]);

  useEffect(() => {
    fetchAddresses();
    fetchCheckoutContext();
  }, [fetchAddresses, fetchCheckoutContext]);

  const subtotal = getTotalPrice();
  const promoDiscount = promoState?.valid ? promoState.discountAmount : 0;
  const finalTotal = Math.max(0, subtotal - promoDiscount);

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error("Please enter a promo code");
      return;
    }
    try {
      setLoading(true);
      const response = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoCode,
          subtotal,
          paymentMethod,
        }),
      });
      const data = await response.json();
      setPromoState(data);
      if (data.valid) {
        toast.success("Promo code applied");
      } else {
        toast.error(data.message || "Invalid promo code");
      }
    } catch (error) {
      console.error("Promo code validation error:", error);
      toast.error("Failed to validate promo code");
    } finally {
      setLoading(false);
    }
  };

  const handleResetCart = () => {
    const confirmed = window.confirm(
      "Are you sure you want to reset your cart?"
    );
    if (confirmed) {
      resetCart();
      toast.success("Cart reset successfully!");
    }
  };

  const handleCheckout = async () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }
    setLoading(true);
    try {
      const metadata: Metadata = {
        orderNumber: crypto.randomUUID(),
        address: selectedAddress,
        paymentMethod,
        promoCode: promoState?.valid ? promoCode.trim().toUpperCase() : undefined,
        installmentMonths:
          paymentMethod === "installments" ? installmentMonths : undefined,
      };

      if (paymentMethod === "cod" || paymentMethod === "installments") {
        const order = await createManualOrder({
          items: groupedItems,
          address: selectedAddress,
          paymentMethod,
          promoCode: promoState?.valid ? promoCode.trim().toUpperCase() : undefined,
          installmentMonths,
        });
        resetCart();
        toast.success(
          paymentMethod === "cod"
            ? "Order placed with Cash on Delivery"
            : "Installment order created successfully"
        );
        window.location.href = `/success?orderNumber=${order.orderNumber}`;
        return;
      }

      const checkoutUrl = await createCheckoutSession(groupedItems, metadata);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        toast.error("Unable to start checkout");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      const message =
        error instanceof Error ? error.message : "Checkout failed. Please try again.";
      if (
        message.includes("STRIPE_SECRET_KEY") ||
        message.includes("NEXT_PUBLIC_BASE_URL")
      ) {
        toast.error("Card payment is not configured yet. Please check Stripe environment variables.");
      } else {
        toast.error("Checkout failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-gray-50 pb-52 md:pb-10">
      {isSignedIn ? (
        <Container>
          {groupedItems?.length ? (
            <>
              <div className="flex items-center gap-2 py-5">
                <ShoppingBag className="text-darkColor" />
                <Title>Shopping Cart</Title>
              </div>
              <div className="grid lg:grid-cols-3 md:gap-8">
                <div className="lg:col-span-2 rounded-lg">
                  <div className="border bg-white rounded-md">
                    {groupedItems?.map(({ product }) => {
                      const itemCount = getItemCount(product?._id);
                      return (
                        <div
                          key={product?._id}
                          className="border-b p-2.5 last:border-b-0 flex items-center justify-between gap-5"
                        >
                          <div className="flex flex-1 items-start gap-2 h-36 md:h-44">
                            {product?.images && (
                              <Link
                                href={`/product/${product?.slug?.current}`}
                                className="border p-0.5 md:p-1 mr-2 rounded-md
                                 overflow-hidden group"
                              >
                                <Image
                                  src={urlFor(product?.images[0]).url()}
                                  alt="productImage"
                                  width={500}
                                  height={500}
                                  loading="lazy"
                                  className="w-32 md:w-40 h-32 md:h-40 object-cover group-hover:scale-105 hoverEffect"
                                />
                              </Link>
                            )}
                            <div className="h-full flex flex-1 flex-col justify-between py-1">
                              <div className="flex flex-col gap-0.5 md:gap-1.5">
                                <h2 className="text-base font-semibold line-clamp-1">
                                  {product?.name}
                                </h2>
                                <p className="text-sm capitalize">
                                  Variant:{" "}
                                  <span className="font-semibold">
                                    {product?.variant}
                                  </span>
                                </p>
                                <p className="text-sm capitalize">
                                  Status:{" "}
                                  <span className="font-semibold">
                                    {product?.status}
                                  </span>
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <ProductSideMenu
                                        product={product}
                                        className="relative top-0 right-0"
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent className="font-bold">
                                      Add to Favorite
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Trash
                                        onClick={() => {
                                          deleteCartProduct(product?._id);
                                          toast.success(
                                            "Product deleted successfully!"
                                          );
                                        }}
                                        className="w-4 h-4 md:w-5 md:h-5 mr-1 text-gray-500 hover:text-red-600 hoverEffect"
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent className="font-bold bg-red-600">
                                      Delete product
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-start justify-between h-36 md:h-44 p-0.5 md:p-1">
                            <PriceFormatter
                              amount={(product?.price as number) * itemCount}
                              className="font-bold text-lg"
                            />
                            <QuantityButtons product={product} />
                          </div>
                        </div>
                      );
                    })}
                    <Button
                      onClick={handleResetCart}
                      className="m-5 font-semibold"
                      variant="destructive"
                    >
                      Reset Cart
                    </Button>
                  </div>
                </div>
                <div>
                  <div className="lg:col-span-1">
                    <div className="hidden md:inline-block w-full bg-white p-6 rounded-lg border">
                      <h2 className="text-xl font-semibold mb-4">
                        Order Summary
                      </h2>
                      <div className="space-y-4">
                        {loyalty && (
                          <div className="rounded-md border p-3 bg-gray-50">
                            <p className="text-sm font-semibold">Loyalty Card</p>
                            <p className="text-xs text-gray-600">
                              {loyalty.cardNumber} - {loyalty.tier} -{" "}
                              {loyalty.points} pts
                            </p>
                          </div>
                        )}
                        <div className="space-y-2">
                          <span className="text-sm font-medium">Promo Code</span>
                          <div className="flex gap-2">
                            <input
                              value={promoCode}
                              onChange={(event) => setPromoCode(event.target.value)}
                              placeholder="Enter promo code"
                              className="flex-1 border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-shop_dark_green/40"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={applyPromoCode}
                              disabled={loading}
                            >
                              Apply
                            </Button>
                          </div>
                          {promoState && (
                            <p
                              className={`text-xs ${promoState.valid ? "text-green-600" : "text-red-600"}`}
                            >
                              {promoState.valid
                                ? `Applied - discount ${promoState.discountAmount.toFixed(2)} MAD`
                                : promoState.message || "Promo not valid"}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <span className="text-sm font-medium">
                            Payment Method
                          </span>
                          <RadioGroup
                            value={paymentMethod}
                            onValueChange={(value) =>
                              setPaymentMethod(value as PaymentMethod)
                            }
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="cod" id="pay-cod" />
                              <Label htmlFor="pay-cod" className="flex items-center gap-2">
                                <HandCoins size={16} />
                                Cash on Delivery
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="cmi_card" id="pay-cmi" />
                              <Label htmlFor="pay-cmi" className="flex items-center gap-2">
                                <CreditCard size={16} />
                                Card Payment (Stripe)
                              </Label>
                            </div>
                            {canUseInstallments && (
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="installments"
                                  id="pay-installments"
                                />
                                <Label
                                  htmlFor="pay-installments"
                                  className="flex items-center gap-2"
                                >
                                  <Landmark size={16} />
                                  Payment by Installments
                                </Label>
                              </div>
                            )}
                          </RadioGroup>
                          {!canUseInstallments && (
                            <p className="text-xs text-gray-500">
                              Installments are only available for eligible users.
                            </p>
                          )}
                          {paymentMethod === "installments" && (
                            <div className="pt-1">
                              <Label className="text-xs">Installment Plan</Label>
                              <select
                                value={installmentMonths}
                                onChange={(event) =>
                                  setInstallmentMonths(Number(event.target.value))
                                }
                                className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                              >
                                <option value={3}>3 months</option>
                                <option value={6}>6 months</option>
                                <option value={12}>12 months</option>
                              </select>
                              <p className="text-xs text-gray-500 mt-1">
                                Approx monthly:{" "}
                                {(finalTotal / Math.max(installmentMonths, 1)).toFixed(2)} MAD
                              </p>
                            </div>
                          )}
                          {paymentMethod === "cmi_card" && (
                            <p className="text-xs text-gray-500">
                              You will be redirected to Stripe Checkout to enter your card details securely.
                              Card numbers and CVC are not stored in this app.
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span>SubTotal</span>
                          <PriceFormatter amount={subtotal} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Discount</span>
                          <PriceFormatter amount={promoDiscount} />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between font-semibold text-lg">
                          <span>Total</span>
                          <PriceFormatter
                            amount={finalTotal}
                            className="text-lg font-bold text-black"
                          />
                        </div>
                        <Button
                          className="w-full rounded-full font-semibold tracking-wide hoverEffect"
                          size="lg"
                          disabled={loading}
                          onClick={handleCheckout}
                        >
                          {loading
                            ? "Please wait..."
                            : paymentMethod === "cod"
                              ? "Place COD Order"
                              : paymentMethod === "installments"
                                ? "Create Installment Order"
                                : "Proceed to Checkout"}
                        </Button>
                      </div>
                    </div>
                    {addresses && (
                      <div className="bg-white rounded-md mt-5">
                        <Card>
                          <CardHeader>
                            <CardTitle>Delivery Address</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <RadioGroup
                              value={selectedAddress?._id?.toString()}
                              onValueChange={(value) => {
                                const chosen = addresses.find(
                                  (addr) => addr._id.toString() === value
                                );
                                if (chosen) {
                                  setSelectedAddress(chosen);
                                }
                              }}
                            >
                              {addresses?.map((address) => (
                                <div
                                  key={address?._id}
                                  className={`flex items-center space-x-2 mb-4 cursor-pointer ${selectedAddress?._id === address?._id && "text-shop_dark_green"}`}
                                >
                                  <RadioGroupItem
                                    value={address?._id.toString()}
                                    id={`address-${address?._id}`}
                                  />
                                  <Label
                                    htmlFor={`address-${address?._id}`}
                                    className="grid gap-1.5 flex-1"
                                  >
                                    <span className="font-semibold">
                                      {address?.name}
                                    </span>
                                    <span className="text-sm text-black/60">
                                      {address.address}, {address.city},{" "}
                                      {address.state} {address.zip} -{" "}
                                      {(address as Address & { phone?: string }).phone || "N/A"}
                                    </span>
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                            <Dialog
                              open={isAddressDialogOpen}
                              onOpenChange={setIsAddressDialogOpen}
                            >
                              <DialogTrigger asChild>
                                <Button variant="outline" className="w-full mt-4">
                                  Add New Address
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Add Delivery Address</DialogTitle>
                                  <DialogDescription>
                                    Save a new address for your checkout.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-3">
                                  <input
                                    className="border rounded-md px-3 py-2 text-sm"
                                    placeholder="Address Name (Home, Work)"
                                    value={addressForm.name}
                                    onChange={(event) =>
                                      onAddressFieldChange("name", event.target.value)
                                    }
                                  />
                                  <input
                                    className="border rounded-md px-3 py-2 text-sm"
                                    placeholder="Street Address"
                                    value={addressForm.address}
                                    onChange={(event) =>
                                      onAddressFieldChange("address", event.target.value)
                                    }
                                  />
                                  <input
                                    className="border rounded-md px-3 py-2 text-sm"
                                    placeholder="City"
                                    value={addressForm.city}
                                    onChange={(event) =>
                                      onAddressFieldChange("city", event.target.value)
                                    }
                                  />
                                  <div className="grid grid-cols-2 gap-3">
                                    <input
                                      className="border rounded-md px-3 py-2 text-sm"
                                      placeholder="Phone Number"
                                      value={addressForm.phone}
                                      onChange={(event) =>
                                        onAddressFieldChange("phone", event.target.value)
                                      }
                                    />
                                    <input
                                      className="border rounded-md px-3 py-2 text-sm"
                                      placeholder="State (ex: CA)"
                                      value={addressForm.state}
                                      onChange={(event) =>
                                        onAddressFieldChange(
                                          "state",
                                          event.target.value.toUpperCase()
                                        )
                                      }
                                    />
                                  </div>
                                  <input
                                    className="border rounded-md px-3 py-2 text-sm"
                                    placeholder="ZIP"
                                    value={addressForm.zip}
                                    onChange={(event) =>
                                      onAddressFieldChange("zip", event.target.value)
                                    }
                                  />
                                  <label className="flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={addressForm.default}
                                      onChange={(event) =>
                                        onAddressFieldChange("default", event.target.checked)
                                      }
                                    />
                                    Set as default address
                                  </label>
                                </div>
                                <DialogFooter>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsAddressDialogOpen(false)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    type="button"
                                    onClick={createAddress}
                                    disabled={loading}
                                  >
                                    Save Address
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                </div>
                {/* Order summary for mobile view */}
                <div className="md:hidden fixed bottom-0 left-0 w-full bg-white pt-2">
                  <div className="bg-white p-4 rounded-lg border mx-4">
                    <h2>Order Summary</h2>
                    <div className="space-y-4">
                      {loyalty && (
                        <div className="rounded-md border p-3 bg-gray-50">
                          <p className="text-sm font-semibold">Loyalty Card</p>
                          <p className="text-xs text-gray-600">
                            {loyalty.cardNumber} - {loyalty.tier} - {loyalty.points} pts
                          </p>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span>SubTotal</span>
                        <PriceFormatter amount={subtotal} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Discount</span>
                        <PriceFormatter amount={promoDiscount} />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between font-semibold text-lg">
                        <span>Total</span>
                        <PriceFormatter
                          amount={finalTotal}
                          className="text-lg font-bold text-black"
                        />
                      </div>
                      <Button
                        className="w-full rounded-full font-semibold tracking-wide hoverEffect"
                        size="lg"
                        disabled={loading}
                        onClick={handleCheckout}
                      >
                        {loading ? "Please wait..." : "Proceed to Checkout"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <EmptyCart />
          )}
        </Container>
      ) : (
        <NoAccess />
      )}
    </div>
  );
};

export default CartPage;
