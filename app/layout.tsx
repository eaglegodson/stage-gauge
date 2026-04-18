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
  title: "StageGauge — Reviews for Theatre, Opera and Ballet",
  description: "Aggregated critic and audience reviews for theatre, opera, ballet, musicals and dance across Australia, New Zealand and London.",
  openGraph: {
    title: "StageGauge — Reviews for Theatre, Opera and Ballet",
    description: "Aggregated critic and audience reviews for theatre, opera, ballet, musicals and dance across Australia, New Zealand and London.",
    url: "https://stage-gauge.com",
    siteName: "StageGauge",
    images: [
      {
        url: "https://stage-gauge.com/social-preview.png",
        width: 1200,
        height: 630,
        alt: "StageGauge — live performance reviews for theatre, opera, ballet and more",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StageGauge — Reviews for Theatre, Opera and Ballet",
    description: "Aggregated critic and audience reviews for theatre, opera, ballet, musicals and dance across Australia, New Zealand and London.",
    images: ["https://stage-gauge.com/social-preview.png"],
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
