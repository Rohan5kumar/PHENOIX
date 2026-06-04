import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Project Phoenix",
  description: "Autonomous MLOps observability dashboard. Zero downtime. Zero manual intervention.",
  openGraph: {
    title: "Project Phoenix | Autonomous MLOps",
    description: "Zero downtime. Zero manual intervention. Project Phoenix automatically detects drift and heals your machine learning models in production.",
    url: "https://project-phoenix.dev",
    siteName: "Project Phoenix",
    images: [
      {
        url: "https://project-phoenix.dev/og-image.jpg", // Mock URL, you would replace this with your actual OG image
        width: 1200,
        height: 630,
        alt: "Project Phoenix Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Project Phoenix | Autonomous MLOps",
    description: "Zero downtime. Zero manual intervention. Project Phoenix automatically detects drift and heals your machine learning models in production.",
    images: ["https://project-phoenix.dev/og-image.jpg"],
  },
};

import { MouseGlow } from "@/components/ui/MouseGlow";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-gray-900 font-sans selection:bg-emerald-500/20 selection:text-emerald-900" suppressHydrationWarning>
        <MouseGlow />
        {children}
      </body>
    </html>
  );
}
