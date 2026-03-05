"use client";
import Link from "next/link";
import { getCategoryIcon } from "@/lib/category-icons";
import { ArrowRight } from "lucide-react";

type HomeCategoryTab = {
  _id: string;
  title: string;
  slug: string;
};

interface Props {
  categories: HomeCategoryTab[];
  selectedCategoryId: string;
  onCategorySelect: (categoryId: string) => void;
}

const HomeTabbar = ({
  categories,
  selectedCategoryId,
  onCategorySelect,
}: Props) => {
  if (!categories.length) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 sm:justify-between">
      <div className="flex items-center gap-2 text-sm font-semibold overflow-x-auto pb-1.5 no-scrollbar">
        {categories.map((category) => {
          const Icon = getCategoryIcon(category.title);

          return (
            <div key={category._id} className="shrink-0">
              <button
                onClick={() => onCategorySelect(category._id)}
                className={`inline-flex items-center gap-2 border px-4 py-2 md:px-5 rounded-full hoverEffect ${selectedCategoryId === category._id ? "border-shop_dark_green bg-shop_dark_green text-white shadow-sm" : "border-shop_light_green/30 bg-shop_light_green/10 hover:bg-shop_light_green hover:border-shop_light_green hover:text-white"}`}
              >
                <Icon className="h-4 w-4" />
                {category.title}
              </button>
            </div>
          );
        })}
      </div>
      <Link
        href={"/shop"}
        className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-shop_dark_green bg-shop_dark_green px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-shop_btn_dark_green hover:border-shop_btn_dark_green"
      >
        <span>Voir tout</span>
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
      </Link>
    </div>
  );
};

export default HomeTabbar;
