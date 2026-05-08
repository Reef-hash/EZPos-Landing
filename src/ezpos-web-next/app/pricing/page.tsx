import type { Metadata } from "next";
import PricingPage from "./PricingPage";

export const metadata: Metadata = {
  title: "Pricing — EZPos",
  description: "Simple, transparent plans for EZPos POS licensing. One-time purchase with lifetime updates.",
};

export default function Page() {
  return <PricingPage />;
}
