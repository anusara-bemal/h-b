import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/navbar";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { getCartItemsCount } from "./cart-actions";
import { Providers } from "./providers";
import Footer from "@/components/ui/footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Herbal Shop - Natural Products",
  description: "Shop for premium herbal and natural products",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  const cartItemsCount = await getCartItemsCount();
  
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Navbar 
              userRole={session?.user?.role as string} 
              userEmail={session?.user?.email as string}
              cartItemsCount={cartItemsCount} 
            />
            <div className="pt-16 flex-grow">
              {children}
            </div>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
