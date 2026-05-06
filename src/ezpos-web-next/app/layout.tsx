import type { Metadata } from "next";
import "./globals.css";
import ThemeRegistry from "@/components/ThemeRegistry";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";

export const metadata: Metadata = {
  title: "EZPos — Professional POS Licensing Platform",
  description:
    "A clean, premium onboarding experience for one-time POS licensing. Ship-ready UI built for modern deployments — secure, scalable, and portal-ready.",
  keywords: ["EZPos", "POS", "license", "point of sale", "software licensing"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <CookieConsent />
        </ThemeRegistry>
      </body>
    </html>
  );
}
