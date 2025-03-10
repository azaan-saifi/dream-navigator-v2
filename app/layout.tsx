import type { Metadata } from "next";
import localFont from "next/font/local";
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

const uthmaniScript = localFont({
  src: "./fonts/UthmaniScript.otf",
  variable: "--font-uthmaniScript",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Dream Navigator",
  description:
    "This is an intelligent chatbot developed by the Dream Students Community. You can ask any queries related to the Dream Intensive program of Ustad Nouman Ali Khan and you will be served the desired information along with clickable timestamps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${uthmaniScript.variable} bg-dark-100 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
