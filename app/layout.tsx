import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "sonner";
import Script from "next/script";

import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | TwitchClone",
    default: "TwitchClone",
  },
  description: "Twitch Clone with Next.js, React.js, TailWindCSS & TypeScript.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"), // Fallback for dev
  openGraph: {
    title: "TwitchClone",
    description: "A modern Twitch Clone built with Next.js",
    url: "/",
    siteName: "TwitchClone",
    images: [
      {
        url: "/logo.png", // Ensure you have a logo image in public folder or use a placeholder
        width: 1200,
        height: 630,
        alt: "TwitchClone",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TwitchClone",
    description: "A modern Twitch Clone built with Next.js",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            forcedTheme="dark"
            storageKey="gamehub-theme"
          >
            <Toaster theme="light" position="bottom-center" />
            {children}
          </ThemeProvider>
          {/* Razorpay Checkout Script */}
          <Script
            src="https://checkout.razorpay.com/v1/checkout.js"
            strategy="lazyOnload"
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
