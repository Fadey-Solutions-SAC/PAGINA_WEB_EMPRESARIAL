import { useReveal } from "../hooks/useReveal";
import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { RestoFadey } from "../components/RestoFadey";
import { ERP } from "../components/ERP";
import { WebDevelopment } from "../components/WebDevelopment";
import { Maintenance } from "../components/Maintenance";
import { SolutionsModel } from "../components/SolutionsModel";
import { CTA } from "../components/CTA";
import { Footer } from "../components/Footer";
import { WhatsAppFloat } from "../components/WhatsAppFloat";

export function LandingPage() {
  useReveal();

  return (
    <>
      <Header />
      <main>
        <Hero />
        <RestoFadey />
        <ERP />
        <WebDevelopment />
        <Maintenance />
        <SolutionsModel />
        <CTA />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
