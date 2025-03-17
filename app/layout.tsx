import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";
import { Toaster } from "sonner";

const uthmaniScript = localFont({
  src: "./fonts/UthmaniScript.otf",
  variable: "--font-uthmaniScript",
  weight: "100 900",
});

const rubikRegular = localFont({
  src: "./fonts/Rubik-Regular.ttf",
  variable: "--font-rubikRegular",
});

export const fontVariables = `${rubikRegular.variable} ${uthmaniScript.variable}`;

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
      <ClerkProvider
        appearance={{
          baseTheme: dark,
        }}
      >
        <body className={`${fontVariables} bg-dark-100 antialiased`}>
          <Toaster position="top-center" richColors />
          {children}
        </body>
      </ClerkProvider>
    </html>
  );
}
