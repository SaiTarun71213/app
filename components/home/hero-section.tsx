import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-secondary/30 py-20 md:py-28">
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 size-20 rounded-full bg-accent/20" />
      <div className="absolute bottom-20 right-20 size-32 rounded-full bg-primary/10" />
      <div className="absolute top-1/2 left-1/4 size-8 rounded-full bg-accent/30" />
      
      <div className="relative mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
            <Sparkles className="size-4 text-primary" />
            <span className="text-sm font-medium text-primary">Where Learning Meets Fun</span>
          </div>
          
          <h1 className="mb-6 max-w-3xl text-balance text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Nurturing Young Minds, One Star at a Time
          </h1>
          
          <p className="mb-8 max-w-2xl text-pretty text-lg text-muted-foreground leading-relaxed">
            At Little Stars Playschool, we create a safe, loving environment where children discover the joy of learning through play, creativity, and exploration.
          </p>
          
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/admissions">Start Your Journey</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Get in Touch</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
