import { backendClient } from "@/sanity/lib/backendClient";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SEARCH_PRODUCTS_QUERY = `*[_type == "product"
  && ($selectedCategory == "" || references(*[_type == "category" && slug.current == $selectedCategory][0]._id))
  && ($selectedBrand == "" || references(*[_type == "brand" && slug.current == $selectedBrand][0]._id))
  && ($searchPattern == "" || name match $searchPattern || description match $searchPattern)
  && ($hasPriceFilter == false || (price >= $minPrice && price <= $maxPrice))
] | order(name asc) {
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

export async function GET(req: NextRequest) {
  try {
    const selectedCategory = req.nextUrl.searchParams.get("category")?.trim() || "";
    const selectedBrand = req.nextUrl.searchParams.get("brand")?.trim() || "";
    const q = req.nextUrl.searchParams.get("q")?.trim() || "";

    const minPriceParam = req.nextUrl.searchParams.get("minPrice");
    const maxPriceParam = req.nextUrl.searchParams.get("maxPrice");
    const parsedMin = minPriceParam ? Number(minPriceParam) : NaN;
    const parsedMax = maxPriceParam ? Number(maxPriceParam) : NaN;
    const hasPriceFilter = Number.isFinite(parsedMin) && Number.isFinite(parsedMax);

    const minPrice = hasPriceFilter ? parsedMin : 0;
    const maxPrice = hasPriceFilter ? parsedMax : 0;

    const searchPattern = q
      ? `*${q
          .split(/\s+/)
          .filter(Boolean)
          .join("*")}*`
      : "";

    const products = await backendClient.fetch(SEARCH_PRODUCTS_QUERY, {
      selectedCategory,
      selectedBrand,
      searchPattern,
      hasPriceFilter,
      minPrice,
      maxPrice,
    });

    return NextResponse.json(products ?? []);
  } catch (error) {
    console.error("Failed to search products:", error);
    return NextResponse.json(
      { error: "Failed to search products" },
      { status: 500 }
    );
  }
}

