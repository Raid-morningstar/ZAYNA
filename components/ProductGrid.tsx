"use client";

import React, { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { motion, AnimatePresence } from "motion/react";
import { client } from "@/sanity/lib/client";
import NoProductAvailable from "./NoProductAvailable";
import { Loader2 } from "lucide-react";
import Container from "./Container";
import HomeTabbar from "./HomeTabbar";
import { Category, Product } from "@/sanity.types";
import { fetchWithRetry } from "@/sanity/lib/fetchWithRetry";

type HomeCategory = Pick<Category, "_id" | "title" | "slug">;

const ProductGrid = ({ categories }: { categories: HomeCategory[] }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const tabCategories = (categories || []).filter(
    (category): category is HomeCategory & { slug: { current: string } } =>
      Boolean(category?._id && category?.title && category?.slug?.current)
  );

  const [selectedCategoryId, setSelectedCategoryId] = useState(
    tabCategories[0]?._id || ""
  );

  useEffect(() => {
    if (!selectedCategoryId && tabCategories.length) {
      setSelectedCategoryId(tabCategories[0]._id);
    }
  }, [selectedCategoryId, tabCategories]);

  useEffect(() => {
    if (!selectedCategoryId) {
      setProducts([]);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const query = `*[_type == "product" && references($categoryId)] | order(name asc){
  _id,
  name,
  slug,
  images,
  description,
  price,
  discount,
  stock,
  status,
  "categories": categories[]->title
}`;
        const params = { categoryId: selectedCategoryId };
        const response = await fetchWithRetry(
          () => client.fetch<Product[]>(query, params),
          { retries: 1, retryDelayMs: 400 }
        );

        if (!cancelled) {
          setProducts(response || []);
        }
      } catch (error) {
        if (!cancelled) {
          console.log("Product fetching Error", error);
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    fetchData();

    return () => {
      cancelled = true;
    };
  }, [selectedCategoryId]);

  const selectedCategoryTitle =
    tabCategories.find((category) => category._id === selectedCategoryId)
      ?.title || "Cette categorie";

  return (
    <Container id="categories" className="flex flex-col lg:px-0 my-10 scroll-mt-28">
      <HomeTabbar
        categories={tabCategories.map((category) => ({
          _id: category._id,
          title: category.title || "",
          slug: category.slug.current,
        }))}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={setSelectedCategoryId}
      />
      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 min-h-80 space-y-4 text-center bg-gray-100 rounded-lg w-full mt-10">
          <motion.div className="flex items-center space-x-2 text-blue-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Chargement des produits...</span>
          </motion.div>
        </div>
      ) : products?.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-10">
          <>
            {products?.map((product) => (
              <AnimatePresence key={product?._id}>
                <motion.div
                  layout
                  initial={{ opacity: 0.2 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ProductCard key={product?._id} product={product} />
                </motion.div>
              </AnimatePresence>
            ))}
          </>
        </div>
      ) : (
        <NoProductAvailable selectedTab={selectedCategoryTitle} />
      )}
    </Container>
  );
};

export default ProductGrid;
