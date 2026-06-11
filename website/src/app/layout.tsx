import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "City Tools - سيتي تولز", template: "%s - City Tools" },
  description: "Your Trusted Source for Professional Tools & Equipment in Egypt",
  icons: { icon: "/icon.png", apple: "/icon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
