"use client";

import { client } from "@/sanity/lib/client";
import { fetchWithRetry } from "@/sanity/lib/fetchWithRetry";
import { ArrowRight, Loader2, Search, X } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface SearchSuggestion {
  _id: string;
  name?: string;
  slug?: { current?: string };
  price?: number;
  discount?: number;
  stock?: number;
  imageUrl?: string;
}

const moneyFormatter = new Intl.NumberFormat("fr-MA", {
  style: "currency",
  currency: "MAD",
  maximumFractionDigits: 0,
});

const SearchBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const desktopWrapperRef = useRef<HTMLDivElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const searchRequestIdRef = useRef(0);
  const initialQuery = pathname === "/shop" ? searchParams?.get("q") || "" : "";

  const [query, setQuery] = useState(initialQuery);
  const [isDesktopOpen, setIsDesktopOpen] = useState(!!initialQuery);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopFocused, setIsDesktopFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);

  useEffect(() => {
    if (!isDesktopOpen) return;
    const timer = window.setTimeout(() => {
      desktopInputRef.current?.focus();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [isDesktopOpen]);

  useEffect(() => {
    if (!isMobileOpen) return;
    const timer = window.setTimeout(() => {
      mobileInputRef.current?.focus();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [isMobileOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        desktopWrapperRef.current &&
        !desktopWrapperRef.current.contains(event.target as Node)
      ) {
        setIsDesktopFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchValue = query.trim();
    if (!searchValue) return;

    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;

    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      const searchPattern = `*${searchValue.split(/\s+/).filter(Boolean).join("*")}*`;
      try {
        const data = await fetchWithRetry(
          () =>
            client.fetch<SearchSuggestion[]>(
              `*[_type == "product" 
                && defined(slug.current)
                && (name match $searchPattern || description match $searchPattern)
              ] | order(name asc)[0...6] {
                _id,
                name,
                slug,
                price,
                discount,
                stock,
                "imageUrl": images[0].asset->url
              }`,
              { searchPattern }
            ),
          { retries: 1, retryDelayMs: 300 }
        );
        if (searchRequestIdRef.current === requestId) {
          setSuggestions(data || []);
        }
      } catch (error) {
        if (searchRequestIdRef.current === requestId) {
          console.log("Search suggestion fetching Error", error);
          setSuggestions([]);
        }
      } finally {
        if (searchRequestIdRef.current === requestId) {
          setIsSearching(false);
        }
      }
    }, 220);

    return () => window.clearTimeout(timer);
  }, [query]);

  const trimmedQuery = query.trim();
  const hasSearchQuery = trimmedQuery.length > 0;
  const showDesktopDropdown =
    isDesktopOpen && isDesktopFocused && hasSearchQuery;
  const showMobileDropdown = isMobileOpen && hasSearchQuery;

  const getDisplayPrice = (product: SearchSuggestion) => {
    const basePrice = product.price ?? 0;
    if (!product.discount || product.discount <= 0) {
      return basePrice;
    }
    return basePrice - basePrice * (product.discount / 100);
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setSuggestions([]);
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setSuggestions([]);
    setIsSearching(false);
    if (pathname === "/shop") {
      router.push("/shop");
    }
  };

  const goToSearch = () => {
    if (!trimmedQuery) {
      router.push("/shop");
      return;
    }
    setIsDesktopFocused(false);
    router.push(`/shop?q=${encodeURIComponent(trimmedQuery)}`);
  };

  const onDesktopSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    goToSearch();
  };

  const onMobileSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    goToSearch();
    setSuggestions([]);
    setIsMobileOpen(false);
  };

  const handleSuggestionClick = (product: SearchSuggestion) => {
    const slug = product.slug?.current;
    if (!slug) return;
    setQuery("");
    setSuggestions([]);
    setIsSearching(false);
    setIsDesktopFocused(false);
    setIsDesktopOpen(false);
    setIsMobileOpen(false);
    router.push(`/product/${slug}`);
  };

  const openDesktopSearch = () => {
    setIsDesktopOpen(true);
    setIsDesktopFocused(true);
  };

  const closeDesktopWhenEmpty = () => {
    window.setTimeout(() => {
      setIsDesktopFocused(false);
      if (!trimmedQuery) setIsDesktopOpen(false);
    }, 120);
  };

  const renderSuggestions = (mode: "desktop" | "mobile") => {
    const shouldRender =
      mode === "desktop" ? showDesktopDropdown : showMobileDropdown;

    if (!shouldRender) return null;

    return (
      <div
        className={
          mode === "desktop"
            ? "absolute left-0 right-0 top-[calc(100%+10px)] z-50 overflow-hidden rounded-2xl border border-shop_light_green/35 bg-white/95 shadow-[0_24px_44px_-30px_rgba(22,46,110,0.95)] backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
            : "mt-2 overflow-hidden rounded-2xl border border-shop_light_green/35 bg-white shadow-[0_20px_36px_-30px_rgba(22,46,110,0.85)]"
        }
      >
        <div className="max-h-80 overflow-y-auto p-2 scrollbar-hide">
          {isSearching ? (
            <div className="flex items-center justify-center gap-2 p-4 text-sm text-lightColor">
              <Loader2 className="h-4 w-4 animate-spin" />
              Recherche en cours...
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((product) => (
              <button
                key={product._id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSuggestionClick(product)}
                className="group/item flex w-full items-center gap-3 rounded-xl p-2 text-left transition-all duration-200 hover:bg-shop_light_bg/80"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-shop_light_green/30 bg-shop_light_bg">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name || "Produit"}
                      fill
                      sizes="48px"
                      className="object-contain p-1.5 transition-transform duration-300 group-hover/item:scale-105"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-[10px] text-lightColor">
                      No image
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-darkColor">
                    {product.name || "Produit sans nom"}
                  </p>
                  <p className="truncate text-xs text-lightColor">
                    {typeof product.price === "number"
                      ? moneyFormatter.format(getDisplayPrice(product))
                      : "Prix indisponible"}
                    {typeof product.stock === "number"
                      ? ` · Stock ${Math.max(product.stock, 0)}`
                      : ""}
                  </p>
                </div>

                <ArrowRight className="h-3.5 w-3.5 text-lightColor transition-all duration-200 group-hover/item:translate-x-0.5 group-hover/item:text-shop_dark_green" />
              </button>
            ))
          ) : (
            <p className="p-4 text-center text-sm text-lightColor">
              Aucun produit trouve pour &quot;{trimmedQuery}&quot;.
            </p>
          )}
        </div>

        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            goToSearch();
            if (mode === "mobile") {
              setIsMobileOpen(false);
            }
          }}
          className="mx-2 mb-2 mt-1 inline-flex w-[calc(100%-1rem)] items-center justify-center gap-1 rounded-xl border border-shop_light_green/40 bg-shop_light_bg/70 px-3 py-2 text-xs font-semibold text-shop_dark_green transition-colors duration-200 hover:bg-shop_light_bg"
        >
          Voir tous les resultats
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  return (
    <>
      <div ref={desktopWrapperRef} className="relative hidden md:block">
        <form
          onSubmit={onDesktopSubmit}
          className={`group relative flex h-10 items-center overflow-hidden rounded-full border bg-white/85 backdrop-blur-md transition-[width,box-shadow,border-color,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isDesktopOpen
              ? "w-64 xl:w-80 border-shop_dark_green/35 shadow-[0_14px_36px_-24px_rgba(31,60,136,0.85)]"
              : "w-10 border-shop_light_green/45 shadow-[0_10px_24px_-24px_rgba(31,60,136,0.8)] hover:border-shop_light_green/80 hover:shadow-[0_12px_28px_-20px_rgba(77,182,198,0.8)]"
          }`}
        >
          <button
            type="button"
            onClick={() => {
              if (!isDesktopOpen) {
                openDesktopSearch();
                return;
              }
              if (trimmedQuery) {
                goToSearch();
              }
            }}
            className="inline-flex h-10 w-10 items-center justify-center text-lightColor hover:text-shop_dark_green hoverEffect"
            aria-label="Rechercher"
          >
            <Search className="h-4.5 w-4.5 group-hover:scale-105 transition-transform duration-300" />
          </button>
          <input
            ref={desktopInputRef}
            value={query}
            onFocus={() => setIsDesktopFocused(true)}
            onChange={(event) => handleQueryChange(event.target.value)}
            onBlur={closeDesktopWhenEmpty}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setIsDesktopFocused(false);
                setIsDesktopOpen(false);
              }
            }}
            placeholder="Rechercher un produit..."
            className={`h-full bg-transparent text-sm text-darkColor placeholder:text-lightColor/80 outline-none transition-[width,opacity,padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isDesktopOpen ? "w-full pr-20 opacity-100" : "w-0 pr-0 opacity-0"
            }`}
          />
          {isDesktopOpen ? (
            <button
              type="submit"
              className={`absolute right-2 inline-flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-300 ${
                trimmedQuery
                  ? "border-shop_dark_green/30 bg-shop_dark_green text-white hover:bg-shop_btn_dark_green hover:translate-x-0.5"
                  : "border-shop_light_green/35 bg-white text-lightColor"
              }`}
              aria-label="Lancer la recherche"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {isDesktopOpen && query ? (
            <button
              type="button"
              onClick={() => {
                clearSearch();
                desktopInputRef.current?.focus();
              }}
              className="absolute right-10 inline-flex h-6 w-6 items-center justify-center rounded-full text-lightColor hover:bg-shop_light_green/20 hover:text-shop_dark_green hoverEffect"
              aria-label="Effacer la recherche"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </form>
        {renderSuggestions("desktop")}
      </div>

      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-shop_light_green/45 bg-white/90 text-lightColor shadow-[0_10px_26px_-22px_rgba(31,60,136,0.8)] hover:border-shop_light_green hover:text-shop_dark_green hover:shadow-[0_12px_28px_-20px_rgba(77,182,198,0.85)] hoverEffect"
        aria-label="Ouvrir la recherche"
      >
        <Search className="h-4.5 w-4.5" />
      </button>

      {isMobileOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-black/25 backdrop-blur-[1px] md:hidden animate-in fade-in duration-200"
            onClick={() => {
              setIsMobileOpen(false);
              setSuggestions([]);
            }}
            aria-label="Fermer la recherche"
          />
          <div className="fixed left-4 right-4 top-20 z-[70] md:hidden rounded-2xl border border-shop_light_green/40 bg-white/95 p-3 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <form onSubmit={onMobileSubmit} className="flex items-center gap-2">
              <div className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-shop_light_green/35 px-3">
                <Search className="h-4 w-4 text-lightColor" />
                <input
                  ref={mobileInputRef}
                  value={query}
                  onChange={(event) => handleQueryChange(event.target.value)}
                  placeholder="Rechercher un produit..."
                  className="h-full w-full bg-transparent text-sm text-darkColor placeholder:text-lightColor/80 outline-none"
                />
              </div>
              {query ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-shop_light_green/35 text-lightColor hover:text-shop_dark_green hoverEffect"
                  aria-label="Effacer la recherche"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-1 rounded-xl bg-shop_dark_green px-4 text-sm font-semibold text-white hover:bg-shop_btn_dark_green hoverEffect"
              >
                OK
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>
            {renderSuggestions("mobile")}
          </div>
        </>
      ) : null}
    </>
  );
};

export default SearchBar;
