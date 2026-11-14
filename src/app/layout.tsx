import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import { Suspense, type ReactNode } from "react";
import "./globals.css";
import { AuthSync } from "@/components/auth-sync";
import { CartProvider } from "@/components/cart-provider";
import { CompareBar } from "@/components/compare-bar";
import { CompareProvider } from "@/components/compare-provider";
import { WishlistProvider } from "@/components/wishlist-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

const siteDescription =
  "خرید آنلاین هدفون، ساعت هوشمند، موبایل، لپ‌تاپ و گجت‌های گیمینگ با گارانتی اصالت، ارسال سریع و ۷ روز ضمانت بازگشت کالا.";

export const metadata: Metadata = {
  metadataBase: new URL("https://hadi-digital.ir"),
  applicationName: "Hadi Digital",
  title: {
    default: "Hadi Digital | فروشگاه گجت و کالای دیجیتال",
    template: "%s | Hadi Digital",
  },
  description: siteDescription,
  keywords: ["Hadi Digital", "HadiDigital", "گجت", "کالای دیجیتال", "فروشگاه اینترنتی", "هدفون", "ساعت هوشمند"],
  openGraph: {
    title: "Hadi Digital | فروشگاه گجت و کالای دیجیتال",
    description: siteDescription,
    siteName: "Hadi Digital",
    locale: "fa_IR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" data-scroll-behavior="smooth" className={`${vazirmatn.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <CartProvider>
          <WishlistProvider>
            <CompareProvider>
              <SiteHeader />
              <Suspense fallback={null}>
                <AuthSync />
              </Suspense>
              <main className="flex-1">{children}</main>
              <SiteFooter />
              <CompareBar />
            </CompareProvider>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
