import { backendClient } from "@/sanity/lib/backendClient";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PRODUCTS_BY_CATEGORY_QUERY = `*[_type == "product" && references($categoryId)] | order(name asc){
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
    const categoryId = req.nextUrl.searchParams.get("categoryId")?.trim();
    if (!categoryId) {
      return NextResponse.json(
        { error: "Missing categoryId query parameter" },
        { status: 400 }
      );
    }

    const products = await backendClient.fetch(PRODUCTS_BY_CATEGORY_QUERY, {
      categoryId,
    });

    return NextResponse.json(products ?? []);
  } catch (error) {
    console.error("Failed to fetch products by category:", error);
    return NextResponse.json(
      { error: "Failed to fetch products by category" },
      { status: 500 }
    );
  }
}

