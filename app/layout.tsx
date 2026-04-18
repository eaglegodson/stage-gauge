import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StageGauge",
  description: "Live performance reviews — theatre, opera, ballet, dance and more.",
  openGraph: {
    title: "StageGauge",
    description: "You care about what you see. So do we.",
    url: "https://stage-gauge.com",
    siteName: "StageGauge",
    images: [
      {
        url: "https://stage-gauge.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "StageGauge — live performance reviews",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StageGauge",
    description: "You care about what you see. So do we.",
    images: ["https://stage-gauge.com/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="fo-verify" content="46efc777-01f5-424a-9c1e-1b356c52a311" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}