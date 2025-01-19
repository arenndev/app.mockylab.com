import { Inter } from "next/font/google";
import type { Metadata } from "next";
import Providers from "./providers";

// Global styles
import "./globals.css";
import "@/css/satoshi.css";
import "@/css/style.css";
import "jsvectormap/dist/jsvectormap.css";
import "flatpickr/dist/flatpickr.min.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MockyLab",
  description: "MockyLab - Mockup Generator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true} className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
