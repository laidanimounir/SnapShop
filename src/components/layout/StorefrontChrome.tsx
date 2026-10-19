"use client";

import React from "react";
import { usePathname } from "next/navigation";
import TopNavbar from "./Navbar/TopNavbar";
import Footer from "./Footer";

// Hides the storefront navbar/footer on admin routes (including
// /admin/login), where the admin shell — or the isolated login
// layout — provides the surrounding chrome, and on landing pages
// (/p/*), which are standalone ad-style pages with no store chrome.
export default function StorefrontChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/p/")) {
    return <>{children}</>;
  }
  return (
    <>
      <TopNavbar />
      {children}
      <Footer />
    </>
  );
}
