import { Geist, Geist_Mono } from "next/font/google";
import { SpaceMono } from "./fonts";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Make My Parchi | India's no.1 Invoice generation app",
  description:
    "Create invoices and PDFs — install as an app and use offline after your first visit.",
  applicationName: "Make My Parchi",
  icons: {
    icon: "/favicon.png",
    apple: "/assets/brand_logo.png",
  },
  appleWebApp: {
    capable: true,
    title: "Make My Parchi",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#18181b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${SpaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-50">{children}</body>
    </html>
  );
}
