import Container from "@/components/Container";
import HomeBanner from "@/components/HomeBanner";
import LoyaltyCardPromo from "@/components/LoyaltyCardPromo";
import ProductGrid from "@/components/ProductGrid";
import ShopByBrands from "@/components/ShopByBrands";
import { getCategories } from "@/sanity/queries";

import React from "react";

const Home = async () => {
  const categories = await getCategories(8, 60);

  return (
    <Container className="bg-shop-light-pink">
      <HomeBanner />
      <LoyaltyCardPromo />
      <ProductGrid categories={categories} />
      <ShopByBrands />
    </Container>
  );
};

export default Home;
