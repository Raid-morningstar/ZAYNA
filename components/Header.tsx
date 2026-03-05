import React from "react";
import Container from "./Container";
import Logo from "./Logo";
import HeaderMenu from "./HeaderMenu";
import SearchBar from "./SearchBar";
import CartIcon from "./CartIcon";
import FavoriteButton from "./FavoriteButton";
import SignIn from "./SignIn";
import MobileMenu from "./MobileMenu";
import { auth } from "@clerk/nextjs/server";
import { ClerkLoaded, SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Logs } from "lucide-react";
import { getMyOrdersCount } from "@/sanity/queries";

const Header = async () => {
  const { userId } = await auth();
  let ordersCount = 0;
  if (userId) {
    ordersCount = await getMyOrdersCount(userId);
  }

  return (
    <header className="sticky top-0 z-50 py-5 bg-white/70 backdrop-blur-md">
      <Container className="flex items-center gap-3 lg:gap-5 text-lightColor">
        <div className="w-auto lg:w-[12rem] xl:w-[14rem] flex items-center gap-2.5 justify-start lg:gap-0">
          <MobileMenu />
          <Logo />
        </div>
        <div className="min-w-0 flex-1">
          <HeaderMenu />
        </div>
        <div className="w-auto lg:w-[24rem] xl:w-[29rem] flex items-center justify-end gap-2.5 sm:gap-4 lg:gap-3 xl:gap-5">
          <SearchBar />
          <CartIcon />
          <FavoriteButton />

          {userId && (
            <Link
              href={"/orders"}
              className="group relative hover:text-shop_light_green hoverEffect"
            >
              <Logs />
              <span className="absolute -top-1 -right-1 bg-shop_btn_dark_green text-white h-3.5 w-3.5 rounded-full text-xs font-semibold flex items-center justify-center">
                {ordersCount}
              </span>
            </Link>
          )}

          <ClerkLoaded>
            <SignedIn>
              <UserButton />
            </SignedIn>
            {!userId && <SignIn />}
          </ClerkLoaded>
        </div>
      </Container>
    </header>
  );
};

export default Header;
