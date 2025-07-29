import ContactUs from "@/components/mvpblocks/contact-us";
import Faq from "@/components/mvpblocks/faq";
import Feature from "@/components/mvpblocks/feature";
import Footer from "@/components/mvpblocks/footer";
import GradioHero from "@/components/mvpblocks/gradient-hero";
import Pricing from "@/components/mvpblocks/pricing";
import Testimonials from "@/components/mvpblocks/testimonials";
import Navbar from "@/components/navbar";
import { Separator } from "@/components/ui/separator";

// The structure is correct for a Next.js page component.
// All imported components are used: Navbar, GradioHero, Feature, Faq, Pricing, ContactUs, Separator.
// No components are missing based on your imports.

const HomePage = async () => {
  return (
    <>
      <Navbar />
      <GradioHero />
      <Separator />
      <Testimonials />
      <Separator />
      <Feature />
      <Separator />
      <Pricing />
      <Separator />
      <Faq />
      <ContactUs />
      <Separator className="bottom-0" />
      <Footer />
    </>
  );
};

export default HomePage;
