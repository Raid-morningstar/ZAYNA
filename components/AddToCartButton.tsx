"use client";
import { Product } from "@/sanity.types";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";
import useStore from "@/store";
import toast from "react-hot-toast";
import PriceFormatter from "./PriceFormatter";
import QuantityButtons from "./QuantityButtons";

interface Props {
  product: Product;
  className?: string;
}

const AddToCartButton = ({ product, className }: Props) => {
  const { addItem, getItemCount } = useStore();
  const itemCount = getItemCount(product._id);
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = () => {
    if ((product.stock as number) > itemCount) {
      addItem(product);
      toast.success(
        `${product.name?.substring(0, 12)}... ajoute avec succes !`
      );
    } else {
      toast.error("Impossible d'ajouter plus que le stock disponible");
    }
  };
  return (
    <div className="w-full h-12 flex items-center">
      {itemCount ? (
        <div className="text-sm w-full">
          <div className="flex items-center justify-between">
            <span className="text-xs text-darkColor/80">Quantite</span>
            <QuantityButtons product={product} />
          </div>
          <div className="flex items-center justify-between border-t pt-1">
            <span className="text-xs font-semibold">Sous-total</span>
            <PriceFormatter
              amount={product.price ? product.price * itemCount : 0}
            />
          </div>
        </div>
      ) : (
        <Button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={cn(
            "w-full h-auto min-h-10 px-2 sm:px-3 bg-shop_dark_green/80 text-lightBg shadow-none border border-shop_dark_green/80 font-semibold text-[11px] sm:text-sm tracking-normal text-white hover:bg-shop_dark_green hover:border-shop_dark_green hoverEffect",
            className
          )}
        >
          <ShoppingBag className="hidden sm:inline-flex h-4 w-4 shrink-0" />
          <span className="text-center whitespace-normal sm:whitespace-nowrap">
            {isOutOfStock ? "Rupture de stock" : "Ajouter au panier"}
          </span>
        </Button>
      )}
    </div>
  );
};

export default AddToCartButton;
