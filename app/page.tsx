import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/home/hero-section"
import { ProgramsSection } from "@/components/home/programs-section"
import { WhyChooseSection } from "@/components/home/why-choose-section"
import { CTASection } from "@/components/home/cta-section"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <ProgramsSection />
        <WhyChooseSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
