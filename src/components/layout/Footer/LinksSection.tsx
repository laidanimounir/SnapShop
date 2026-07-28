import React from "react";
import { FooterLinks } from "./footer.types";
import Link from "next/link";
import { cn } from "@/lib/utils";

const footerLinksData: FooterLinks[] = [
  {
    id: 1,
    title: "company",
    children: [
      { id: 11, label: "about us", url: "#" },
      { id: 12, label: "contact us", url: "#" },
      { id: 13, label: "careers", url: "#" },
    ],
  },
  {
    id: 2,
    title: "help",
    children: [
      { id: 21, label: "customer support", url: "#" },
      { id: 22, label: "delivery details", url: "#" },
      { id: 23, label: "terms & conditions", url: "#" },
      { id: 24, label: "privacy policy", url: "#" },
    ],
  },
  {
    id: 3,
    title: "faq",
    children: [
      { id: 31, label: "account", url: "#" },
      { id: 32, label: "manage deliveries", url: "#" },
      { id: 33, label: "orders", url: "#" },
      { id: 34, label: "payment methods", url: "#" },
    ],
  },
  {
    id: 4,
    title: "quick links",
    children: [
      { id: 41, label: "size guide", url: "#" },
      { id: 42, label: "shipping info", url: "#" },
      { id: 43, label: "returns & exchanges", url: "#" },
      { id: 44, label: "gift cards", url: "#" },
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
