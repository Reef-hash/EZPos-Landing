import type { Metadata } from "next";
import PricingPage from "./PricingPage";

export const metadata: Metadata = {
  title: "Pricing — EZPos & CrossxPos",
  description: "Complete pricing for EZPos desktop and CrossxPos restaurant licenses, including plan differences and activation flow.",
};

export default function Page() {
  return <PricingPage />;
}
