import React from "react";
import Container from "./Container";
import FooterTop from "./FooterTop";
import Logo from "./Logo";
import SocialMedia from "./SocialMedia";
import { SubText, SubTitle } from "./ui/text";
import { quickLinksData } from "@/constants/data";
import Link from "next/link";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { getFooterCategories } from "@/sanity/queries";

const Footer = async () => {
  const categories = await getFooterCategories(8);

  return (
    <footer className="border-t border-shop_light_green/20 bg-gradient-to-b from-white to-shop_light_bg/40">
      <Container>
        <FooterTop />

        <div className="py-10 md:py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          <div className="rounded-xl border border-shop_light_green/20 bg-white p-5 md:p-6 shadow-sm">
            <Logo />
            <SubText className="mt-4">
              Decouvrez nos collections selectionnees avec soin, alliant style
              et confort pour votre quotidien.
            </SubText>
            <SocialMedia
              className="mt-4 text-darkColor/60"
              iconClassName="border-darkColor/30 hover:border-shop_light_green hover:text-shop_light_green"
              tooltipClassName="bg-darkColor text-white"
            />
          </div>

          <div className="rounded-xl border border-shop_light_green/20 bg-white p-5 md:p-6 shadow-sm">
            <SubTitle>Liens rapides</SubTitle>
            <ul className="space-y-2.5 mt-4 text-sm">
              {quickLinksData?.map((item) => (
                <li key={item?.title}>
                  <Link
                    href={item?.href}
                    className="font-medium text-gray-700 hover:text-shop_light_green hoverEffect"
                  >
                    {item?.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-shop_light_green/20 bg-white p-5 md:p-6 shadow-sm">
            <SubTitle>Categories</SubTitle>
            <ul className="space-y-2.5 mt-4 text-sm">
              {categories?.map((item) => (
                <li key={item?._id}>
                  <Link
                    href={`/category/${item?.slug?.current}`}
                    className="font-medium text-gray-700 hover:text-shop_light_green hoverEffect capitalize"
                  >
                    {item?.title || "Categorie"}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-shop_light_green/20 bg-white p-5 md:p-6 shadow-sm space-y-4">
            <SubTitle>Newsletter</SubTitle>
            <SubText>
              Abonnez-vous pour recevoir nos nouveautes et offres exclusives.
            </SubText>
            <form className="space-y-3">
              <Input
                placeholder="Entrez votre e-mail"
                type="email"
                required
                className="bg-white"
              />
              <Button className="w-full bg-shop_dark_green hover:bg-shop_dark_green/90">
                S&apos;abonner
              </Button>
            </form>
          </div>
        </div>

        <div className="py-5 border-t border-shop_light_green/20 text-center text-xs md:text-sm text-gray-600">
          © {new Date().getFullYear()} Hey Para. Tous droits reserves.
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
