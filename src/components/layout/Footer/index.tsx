import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";
import React from "react";
import { FaGithub } from "react-icons/fa";
import Link from "next/link";
import LinksSection from "./LinksSection";
import LayoutSpacing from "./LayoutSpacing";
import { BRAND_NAME, CONTACT_PHONE, CONTACT_EMAIL, GITHUB_URL } from "@/lib/config";
import { ar } from "@/lib/store/i18n-ar";

const Footer = () => {
  return (
    <footer className="mt-10">
      <div className="pt-8 md:pt-[50px] bg-[#F0F0F0] px-4 pb-4">
        <div className="max-w-frame mx-auto">
          <nav className="lg:grid lg:grid-cols-12 mb-8">
            <div className="flex flex-col lg:col-span-3 lg:max-w-[248px]">
              <h1
                className={cn([
                  integralCF.className,
                  "text-[28px] lg:text-[32px] mb-6",
                ])}
              >
                {BRAND_NAME}
              </h1>
                <p className="text-black/60 text-sm mb-4">{ar.footer.description}</p>
                <div className="flex items-center mb-4">
                  <Link
                    href={GITHUB_URL}
                    className="bg-white hover:bg-[#C9A24B] hover:text-white transition-all me-3 w-7 h-7 rounded-full border border-black/20 flex items-center justify-center p-1.5"
                  >
                    <FaGithub />
                  </Link>
                </div>
                <div className="text-sm text-black/60 space-y-1">
                  <p>
                    <span className="font-medium text-black">
                      {ar.footer.phoneWhatsApp}
                    </span>{" "}
                    {CONTACT_PHONE}
                  </p>
                  <p>
                    <span className="font-medium text-black">{ar.footer.email}:</span>{" "}
                    {CONTACT_EMAIL}
                  </p>
                </div>
              </div>
              <div className="hidden lg:grid col-span-9 lg:grid-cols-4 lg:ps-10">
              <LinksSection />
            </div>
            <div className="grid lg:hidden grid-cols-2 sm:grid-cols-4">
              <LinksSection />
            </div>
          </nav>

          <hr className="h-[1px] border-t-black/10 mb-6" />
          <div className="flex flex-col sm:flex-row justify-center sm:justify-between items-center mb-2">
            <p className="text-sm text-center sm:text-start text-black/60 mb-4 sm:mb-0 sm:me-1">
              &copy; {new Date().getFullYear()} {BRAND_NAME} &mdash; {ar.footer.allRights}
            </p>
          </div>
        </div>
        <LayoutSpacing />
      </div>
    </footer>
  );
};

export default Footer;
