import Hero from "@/components/Hero";
import ProductsShowcase from "@/components/ProductsShowcase";
import FeaturesGrid from "@/components/FeaturesGrid";
import PricingSection from "@/components/PricingSection";
import CtaSection from "@/components/CtaSection";

export default function Home() {
  return (
    <>
      <Hero />
      <ProductsShowcase />
      <FeaturesGrid />
      <PricingSection />
      <CtaSection />
    </>
  );
}
