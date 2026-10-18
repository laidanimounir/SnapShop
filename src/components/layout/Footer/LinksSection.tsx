import React from "react";
import { FooterLinks } from "./footer.types";
import Link from "next/link";
import { ar } from "@/lib/store/i18n-ar";

const footerLinksData: FooterLinks[] = [
  {
    id: 1,
    title: ar.footer.sections.company.title,
    children: [
      { id: 11, label: ar.footer.sections.company.aboutUs, url: "/about" },
      { id: 12, label: ar.footer.sections.company.contactUs, url: "/contact" },
    ],
  },
  {
    id: 2,
    title: ar.footer.sections.help.title,
    children: [
      { id: 21, label: ar.footer.sections.help.shippingInfo, url: "/shipping" },
      { id: 22, label: ar.footer.sections.help.returnsExchanges, url: "/returns" },
      { id: 23, label: ar.footer.sections.help.termsConditions, url: "/terms" },
      { id: 24, label: ar.footer.sections.help.privacyPolicy, url: "/privacy" },
    ],
  },
  {
    id: 3,
    title: ar.footer.sections.shop.title,
    children: [
      { id: 31, label: ar.footer.sections.shop.allProducts, url: "/shop" },
      { id: 32, label: ar.footer.sections.shop.trackOrder, url: "/track-order" },
      { id: 33, label: ar.footer.sections.shop.yourCart, url: "/cart" },
    ],
  },
];

const LinksSection = () => {
  return (
    <>
      {footerLinksData.map((item) => (
        <section className="flex flex-col mt-5" key={item.id}>
          <h3 className="font-medium text-sm md:text-base mb-6">{item.title}</h3>
          {item.children.map((link) => (
            <Link
              href={link.url}
              key={link.id}
              className="text-black/60 text-sm md:text-base mb-4 w-fit"
            >
              {link.label}
            </Link>
          ))}
        </section>
      ))}
    </>
  );
};

export default LinksSection;
