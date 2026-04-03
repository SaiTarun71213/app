import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-16 text-center md:px-12">
          {/* Decorative elements */}
          <div className="absolute top-4 left-8 size-16 rounded-full bg-primary-foreground/10" />
          <div className="absolute bottom-8 right-12 size-24 rounded-full bg-primary-foreground/10" />
          
          <div className="relative">
            <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl">
              Ready to Give Your Child the Best Start?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-primary-foreground/90 leading-relaxed">
              Join the Little Stars family today and watch your child blossom in our nurturing environment. Limited spots available for the upcoming session!
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/admissions" className="gap-2">
                Apply for Admission
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
