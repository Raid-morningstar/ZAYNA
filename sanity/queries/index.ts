import { sanityFetch } from "../lib/live";
import {
  BLOG_CATEGORIESResult,
  BRAND_QUERYResult,
  BRANDS_QUERYResult,
  Category,
  DEAL_PRODUCTSResult,
  GET_ALL_BLOGResult,
  LATEST_BLOG_QUERYResult,
  MY_ORDERS_QUERYResult,
  OTHERS_BLOG_QUERYResult,
  PRODUCT_BY_SLUG_QUERYResult,
  SINGLE_BLOG_QUERYResult,
} from "@/sanity.types";
import {
  BLOG_CATEGORIES,
  BRAND_QUERY,
  BRANDS_QUERY,
  DEAL_PRODUCTS,
  GET_ALL_BLOG,
  LATEST_BLOG_QUERY,
  MY_ORDERS_QUERY,
  OTHERS_BLOG_QUERY,
  PRODUCT_BY_SLUG_QUERY,
  SINGLE_BLOG_QUERY,
} from "./query";

const getCategories = async (quantity?: number, revalidate?: number) => {
  try {
    const query = quantity
      ? `*[_type == 'category'] | order(title asc) [0...$quantity] {
          ...,
          "productCount": count(*[_type == "product" && references(^._id)])
        }`
      : `*[_type == 'category'] | order(title asc) {
          ...,
          "productCount": count(*[_type == "product" && references(^._id)])
        }`;
    const { data } = await sanityFetch<Array<Category & { productCount: number }>>({
      query,
      params: quantity ? { quantity } : {},
      ...(typeof revalidate === "number" ? { revalidate } : {}),
    });
    return data;
  } catch (error) {
    console.log("Error fetching categories", error);
    return [];
  }
};

const getAllBrands = async () => {
  try {
    const { data } = await sanityFetch<BRANDS_QUERYResult>({ query: BRANDS_QUERY });
    return data ?? [];
  } catch (error) {
    console.log("Error fetching all brands:", error);
    return [];
  }
};

const getLatestBlogs = async () => {
  try {
    const { data } = await sanityFetch<LATEST_BLOG_QUERYResult>({ query: LATEST_BLOG_QUERY });
    return data ?? [];
  } catch (error) {
    console.log("Error fetching latest Blogs:", error);
    return [];
  }
};
const getDealProducts = async () => {
  try {
    const { data } = await sanityFetch<DEAL_PRODUCTSResult>({ query: DEAL_PRODUCTS });
    return data ?? [];
  } catch (error) {
    console.log("Error fetching deal Products:", error);
    return [];
  }
};
const getProductBySlug = async (slug: string) => {
  try {
    const product = await sanityFetch<PRODUCT_BY_SLUG_QUERYResult>({
      query: PRODUCT_BY_SLUG_QUERY,
      params: {
        slug,
      },
    });
    return product?.data || null;
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    return null;
  }
};
const getBrand = async (slug: string) => {
  try {
    const product = await sanityFetch<BRAND_QUERYResult>({
      query: BRAND_QUERY,
      params: {
        slug,
      },
    });
    return product?.data || null;
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    return null;
  }
};
const getMyOrders = async (userId: string) => {
  try {
    const orders = await sanityFetch<MY_ORDERS_QUERYResult>({
      query: MY_ORDERS_QUERY,
      params: { userId },
      revalidate: 20,
    });
    const rawOrders = orders?.data || [];
    const byKey = new Map<string, MY_ORDERS_QUERYResult[number]>();

    for (const order of rawOrders) {
      const key = order.orderNumber || order._id;
      const existing = byKey.get(key);

      if (!existing) {
        byKey.set(key, order);
        continue;
      }

      const existingUpdatedAt = existing?._updatedAt
        ? new Date(existing._updatedAt as string).getTime()
        : 0;
      const currentUpdatedAt = order?._updatedAt
        ? new Date(order._updatedAt as string).getTime()
        : 0;

      const existingOrderDate = existing?.orderDate
        ? new Date(existing.orderDate as string).getTime()
        : 0;
      const currentOrderDate = order?.orderDate
        ? new Date(order.orderDate as string).getTime()
        : 0;

      if (
        currentUpdatedAt > existingUpdatedAt ||
        (currentUpdatedAt === existingUpdatedAt &&
          currentOrderDate >= existingOrderDate)
      ) {
        byKey.set(key, order);
      }
    }

    const deduped = [...byKey.values()];

    return deduped;
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    return null;
  }
};

const getFooterCategories = async (quantity?: number, revalidate = 60) => {
  try {
    const query = quantity
      ? `*[_type == "category" && defined(slug.current)] | order(title asc) [0...$quantity]{
      _id,
      title,
      slug
    }`
      : `*[_type == "category" && defined(slug.current)] | order(title asc){
      _id,
      title,
      slug
    }`;
    const { data } = await sanityFetch<Array<Pick<Category, "_id" | "title" | "slug">>>({
      query,
      params: quantity ? { quantity } : {},
      revalidate,
    });
    return data ?? [];
  } catch (error) {
    console.log("Error fetching footer categories", error);
    return [];
  }
};

const getMyOrdersCount = async (userId: string) => {
  try {
    const { data } = await sanityFetch<number>({
      query: `count(*[_type == "order" && clerkUserId == $userId])`,
      params: { userId },
      revalidate: 30,
    });
    return data ?? 0;
  } catch (error) {
    console.error("Error fetching orders count:", error);
    return 0;
  }
};
const getAllBlogs = async (quantity: number) => {
  try {
    const { data } = await sanityFetch<GET_ALL_BLOGResult>({
      query: GET_ALL_BLOG,
      params: { quantity },
    });
    return data ?? [];
  } catch (error) {
    console.log("Error fetching all brands:", error);
    return [];
  }
};

const getSingleBlog = async (slug: string) => {
  try {
    const { data } = await sanityFetch<SINGLE_BLOG_QUERYResult>({
      query: SINGLE_BLOG_QUERY,
      params: { slug },
    });
    return data ?? null;
  } catch (error) {
    console.log("Error fetching all brands:", error);
    return null;
  }
};
const getBlogCategories = async () => {
  try {
    const { data } = await sanityFetch<BLOG_CATEGORIESResult>({
      query: BLOG_CATEGORIES,
    });
    return data ?? [];
  } catch (error) {
    console.log("Error fetching all brands:", error);
    return [];
  }
};

const getOthersBlog = async (slug: string, quantity: number) => {
  try {
    const { data } = await sanityFetch<OTHERS_BLOG_QUERYResult>({
      query: OTHERS_BLOG_QUERY,
      params: { slug, quantity },
    });
    return data ?? [];
  } catch (error) {
    console.log("Error fetching all brands:", error);
    return [];
  }
};
export {
  getCategories,
  getFooterCategories,
  getAllBrands,
  getLatestBlogs,
  getDealProducts,
  getProductBySlug,
  getBrand,
  getMyOrders,
  getMyOrdersCount,
  getAllBlogs,
  getSingleBlog,
  getBlogCategories,
  getOthersBlog,
};
