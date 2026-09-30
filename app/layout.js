import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import WebsitePreloader from "@/components/layout/WebsitePreloader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "PharmaPulse SaaS - Pharmacy POS & Management",
  description: "Enterprise Multi-Tenant Pharmacy SaaS & POS System",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <WebsitePreloader />
        {children}
      </body>
    </html>
  );
}
