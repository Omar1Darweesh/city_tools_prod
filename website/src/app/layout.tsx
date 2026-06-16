import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://citytools.org"),
  title: { default: "City Tools | سيتي تولز", template: "%s | City Tools" },
  description: "Egypt's trusted store for professional tools & equipment. سيتي تولز - مصدرك الموثوق للأدوات والمعدات المهنية في مصر.",
  icons: {
    icon: "/assets/CT Logo.png",
    apple: "/assets/CT Logo.png",
    shortcut: "/assets/CT Logo.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
