import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";
import Link from "next/link";
import React from "react";
import { NavMenu } from "../navbar.types";
import { MenuList } from "./MenuList";
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { MenuItem } from "./MenuItem";
import Image from "next/image";
import InputGroup from "@/components/ui/input-group";
import ResTopNavbar from "./ResTopNavbar";
import { BRAND_NAME } from "@/lib/config";
import { ar } from "@/lib/store/i18n-ar";

const data: NavMenu = [
  {
    id: 1,
    label: ar.nav.shop,
    type: "MenuList",
    children: [
      {
        id: 11,
        label: ar.nav.menuChildren.mensClothes,
        url: "/shop#men-clothes",
        description: ar.nav.menuChildren.mensClothesDesc,
      },
      {
        id: 12,
        label: ar.nav.menuChildren.womensClothes,
        url: "/shop#women-clothes",
        description: ar.nav.menuChildren.womensClothesDesc,
      },
      {
        id: 13,
        label: ar.nav.menuChildren.kidsClothes,
        url: "/shop#kids-clothes",
        description: ar.nav.menuChildren.kidsClothesDesc,
      },
      {
        id: 14,
        label: ar.nav.menuChildren.bagsShoes,
        url: "/shop#bag-shoes",
        description: ar.nav.menuChildren.bagsShoesDesc,
      },
    ],
  },
  {
    id: 2,
    type: "MenuItem",
    label: ar.nav.onSale,
    url: "/shop#on-sale",
    children: [],
  },
  {
    id: 3,
    type: "MenuItem",
    label: ar.nav.newArrivals,
    url: "/shop#new-arrivals",
    children: [],
  },
  {
    id: 4,
    type: "MenuItem",
    label: ar.nav.brands,
    url: "/shop#brands",
    children: [],
  },
];

const TopNavbar = () => {
  return (
    <nav className="sticky top-0 bg-white z-20">
      <div className="flex relative max-w-frame mx-auto items-center justify-between md:justify-start py-5 md:py-6 px-4 xl:px-0">
        <div className="flex items-center">
          <div className="block md:hidden me-4">
            <ResTopNavbar data={data} />
          </div>
          <Link
            href="/"
            className={cn([
              integralCF.className,
              "text-2xl lg:text-[32px] mb-2 me-3 lg:me-10",
            ])}
          >
            {BRAND_NAME}
          </Link>
        </div>
        <NavigationMenu className="hidden md:flex me-2 lg:me-7">
          <NavigationMenuList>
            {data.map((item) => (
              <React.Fragment key={item.id}>
                {item.type === "MenuItem" && (
                  <MenuItem label={item.label} url={item.url} />
                )}
                {item.type === "MenuList" && (
                  <MenuList data={item.children} label={item.label} />
                )}
              </React.Fragment>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <form action="/search" method="get" className="hidden md:flex bg-[#F0F0F0] me-3 lg:me-10 rounded-full">
          <InputGroup className="bg-[#F0F0F0]">
            <InputGroup.Text>
              <Image
                priority
                src="/icons/search.svg"
                height={20}
                width={20}
                alt={ar.a11y.search}
                className="min-w-5 min-h-5"
              />
            </InputGroup.Text>
            <InputGroup.Input
              type="search"
              name="q"
              placeholder={ar.nav.searchPlaceholder}
              className="bg-transparent placeholder:text-black/40"
            />
          </InputGroup>
        </form>
        <div className="flex items-center">
          <Link href="/search" className="block md:hidden me-[14px] p-1">
            <Image
              priority
              src="/icons/search-black.svg"
              height={100}
              width={100}
              alt={ar.a11y.search}
              className="max-w-[22px] max-h-[22px]"
            />
          </Link>
          <Link href="/#signin" className="p-1">
            <Image
              priority
              src="/icons/user.svg"
              height={100}
              width={100}
              alt={ar.a11y.user}
              className="max-w-[22px] max-h-[22px]"
            />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;
