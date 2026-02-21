import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://porseo-lms.vercel.app'),
  title: {
    default: "PORSEO LMS - プロフェッショナル学習管理システム",
    template: "%s | PORSEO LMS",
  },
  description: "PORSEO LMSは、動画学習、Discord連携、AIによる学習サポートを提供するプロフェッショナル向け学習管理システムです。最先端の技術を駆使して、効率的な学習体験を提供します。",
  keywords: [
    "LMS",
    "学習管理システム",
    "オンライン学習",
    "動画学習",
    "Discord",
    "AI学習",
    "プログラミング学習",
    "PORSEO",
    "eラーニング",
    "オンライン教育",
  ],
  authors: [{ name: "PORSEO" }],
  creator: "PORSEO",
  publisher: "PORSEO",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "/",
    siteName: "PORSEO LMS",
    title: "PORSEO LMS - プロフェッショナル学習管理システム",
    description: "動画学習、Discord連携、AIによる学習サポートを提供するプロフェッショナル向け学習管理システム",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PORSEO LMS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PORSEO LMS - プロフェッショナル学習管理システム",
    description: "動画学習、Discord連携、AIによる学習サポートを提供するプロフェッショナル向け学習管理システム",
    images: ["/og-image.png"],
    creator: "@porseo",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Google Search Console verification (環境変数から取得)
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

import ConvexClientProvider from "../../providers/ConvexClientProvider";
import { StructuredData } from "@/components/structured-data";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning className="scroll-smooth overflow-x-hidden">
      <head>
        <StructuredData />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          forcedTheme="light"
          disableTransitionOnChange
        >
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
