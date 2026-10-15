import React from "react";
import { FooterLinks } from "./footer.types";
import Link from "next/link";

const footerLinksData: FooterLinks[] = [
  {
    id: 1,
    title: "company",
    children: [
      { id: 11, label: "about us", url: "/about" },
      { id: 12, label: "contact us", url: "/contact" },
    ],
  },
  {
    id: 2,
    title: "help",
    children: [
      { id: 21, label: "shipping info", url: "/shipping" },
      { id: 22, label: "returns & exchanges", url: "/returns" },
      { id: 23, label: "terms & conditions", url: "/terms" },
      { id: 24, label: "privacy policy", url: "/privacy" },
    ],
  },
  {
    id: 3,
    title: "shop",
    children: [
      { id: 31, label: "all products", url: "/shop" },
      { id: 32, label: "track your order", url: "/track-order" },
      { id: 33, label: "your cart", url: "/cart" },
    ],
  },
];

const LinksSection = () => {
  return (
    <>
      {footerLinksData.map((item) => (
        <section className="flex flex-col mt-5" key={item.id}>
          <h3 className="font-medium text-sm md:text-base uppercase tracking-widest mb-6">
            {item.title}
          </h3>
          {item.children.map((link) => (
            <Link
              href={link.url}
              key={link.id}
              className="text-black/60 text-sm md:text-base mb-4 w-fit capitalize"
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
