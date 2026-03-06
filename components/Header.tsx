import React from "react";
import Container from "./Container";
import Logo from "./Logo";
import MobileMenu from "./MobileMenu";
import { auth } from "@clerk/nextjs/server";
import { getMyOrdersCount } from "@/sanity/queries";
import HeaderDesktopNav from "./HeaderDesktopNav";

const Header = async () => {
  const { userId } = await auth();
  let ordersCount = 0;
  if (userId) {
    ordersCount = await getMyOrdersCount(userId);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-shop_light_green/15 bg-white/75 py-3.5 backdrop-blur-xl">
      <Container className="flex items-center justify-between gap-3 text-lightColor lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <MobileMenu />
          <Logo />
        </div>
        <HeaderDesktopNav userId={userId} ordersCount={ordersCount} />
      </Container>
    </header>
  );
};

export default Header;
