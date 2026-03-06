"use client";
import { BRANDS_QUERYResult, Category, Product } from "@/sanity.types";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Container from "./Container";
import Title from "./Title";
import CategoryList from "./shop/CategoryList";
import { useRouter, useSearchParams } from "next/navigation";
import BrandList from "./shop/BrandList";
import PriceList from "./shop/PriceList";
import { Loader2 } from "lucide-react";
import NoProductAvailable from "./NoProductAvailable";
import ProductCard from "./ProductCard";
import { fetchWithRetry } from "@/sanity/lib/fetchWithRetry";

interface Props {
  categories: Category[];
  brands: BRANDS_QUERYResult;
}
const Shop = ({ categories, brands }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const brandParams = searchParams?.get("brand");
  const categoryParams = searchParams?.get("category");
  const searchTerm = searchParams?.get("q")?.trim() || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    categoryParams || null
  );
  const [selectedBrand, setSelectedBrand] = useState<string | null>(
    brandParams || null
  );
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    setSelectedCategory(categoryParams || null);
  }, [categoryParams]);

  useEffect(() => {
    setSelectedBrand(brandParams || null);
  }, [brandParams]);

  const fetchProducts = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);
    try {
      let minPrice: number | null = null;
      let maxPrice: number | null = null;
      if (selectedPrice) {
        const [min, max] = selectedPrice.split("-").map(Number);
        minPrice = Number.isFinite(min) ? min : null;
        maxPrice = Number.isFinite(max) ? max : null;
      }

      const params = new URLSearchParams();
      if (selectedCategory) {
        params.set("category", selectedCategory);
      }
      if (selectedBrand) {
        params.set("brand", selectedBrand);
      }
      if (searchTerm) {
        params.set("q", searchTerm);
      }
      if (minPrice !== null && maxPrice !== null) {
        params.set("minPrice", String(minPrice));
        params.set("maxPrice", String(maxPrice));
      }

      const data = await fetchWithRetry(
        async () => {
          const res = await fetch(`/api/products/search?${params.toString()}`, {
            cache: "no-store",
          });

          if (!res.ok) {
            throw new Error(`Failed to fetch products: ${res.status}`);
          }

          return (await res.json()) as Product[];
        },
        { retries: 1, retryDelayMs: 400 }
      );
      if (requestIdRef.current === requestId) {
        setProducts(data || []);
      }
    } catch (error) {
      if (requestIdRef.current === requestId) {
        console.log("Shop product fetching Error", error);
        setProducts([]);
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [selectedCategory, selectedBrand, selectedPrice, searchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  return (
    <div className="border-t">
      <Container className="mt-5">
        <div className="sticky top-0 z-10 mb-5">
          <div className="flex items-center justify-between">
            <Title className="text-lg uppercase tracking-wide">
              Trouvez les produits selon vos besoins
            </Title>
            {(selectedCategory !== null ||
              selectedBrand !== null ||
              selectedPrice !== null ||
              !!searchTerm) && (
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedBrand(null);
                  setSelectedPrice(null);
                  if (searchTerm) {
                    router.push("/shop");
                  }
                }}
                className="text-shop_dark_green underline text-sm mt-2 font-medium hover:text-darkRed hoverEffect"
              >
                Reinitialiser les filtres
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-5 border-t border-t-shop_dark_green/50">
          <div className="md:sticky md:top-20 md:self-start md:h-[calc(100vh-160px)] md:overflow-y-auto md:min-w-64 pb-5 md:border-r border-r-shop_btn_dark_green/50 scrollbar-hide">
            <CategoryList
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />
            <BrandList
              brands={brands}
              setSelectedBrand={setSelectedBrand}
              selectedBrand={selectedBrand}
            />
            <PriceList
              setSelectedPrice={setSelectedPrice}
              selectedPrice={selectedPrice}
            />
          </div>
          <div className="flex-1 pt-5">
            <div className="h-[calc(100vh-160px)] overflow-y-auto pr-2 scrollbar-hide">
              {loading ? (
                <div className="p-20 flex flex-col gap-2 items-center justify-center bg-white">
                  <Loader2 className="w-10 h-10 text-shop_dark_green animate-spin" />
                  <p className="font-semibold tracking-wide text-base">
                    Chargement des produits . . .
                  </p>
                </div>
              ) : products?.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {products?.map((product) => (
                    <ProductCard key={product?._id} product={product} />
                  ))}
                </div>
              ) : (
                <NoProductAvailable className="bg-white mt-0" />
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Shop;
