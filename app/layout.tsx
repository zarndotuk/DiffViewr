import type { ReactNode } from "react";
import { Space_Grotesk, Source_Code_Pro } from "next/font/google";
import "./globals.css";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
});

const monoFont = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-mono"
});

export const metadata = {
  title: "JSON Reorder Tool",
  description: "Reorder JSON arrays/objects at a path based on a reference JSON."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${displayFont.variable} ${monoFont.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen w-full flex justify-center">
        {children}
      </body>
    </html>
  );
}
