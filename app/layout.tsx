import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import React from "react";

const uthmaniScript = localFont({
  src: "./fonts/UthmaniScript.otf",
  variable: "--font-uthmaniScript",
  weight: "100 900",
});

const rubikRegular = localFont({
  src: "./fonts/Rubik-Regular.ttf",
  variable: "--font-rubikRegular",
});

export const metadata: Metadata = {
  title: "Dream Navigator",
  description:
    "This is an intelligent chatbot developed by the Dream Students Community. You can ask any queries related to the Dream Intensive program of Ustad Nouman Ali Khan and you will be served the desired information along with clickable timestamps.",
  openGraph: {
    title: "Dream Navigator",
    description:
      "An intelligent assistant built for the Dream Students Community",
    url: "https://dream-navigator.in",
    siteName: "Dream Navigator",
    images: [
      {
        url: "/og-image.png", // You'll need to add this image to your public directory
        width: 1200,
        height: 630,
        alt: "Dream Navigator - A Glimpse into Revolutionizing Education",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dream Navigator",
    description:
      "An intelligent assistant built for the Dream Students Community",
    images: ["/og-image.png"], // Same image as OG
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ClerkProvider
        appearance={{
          baseTheme: dark,
        }}
      >
        <body
          className={`${rubikRegular.variable} ${uthmaniScript.variable} bg-dark-100 antialiased`}
        >
          <Toaster position="top-center" reverseOrder={false} />
          {children}
        </body>
      </ClerkProvider>
    </html>
  );
}
