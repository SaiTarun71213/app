import { Shield, Heart, Award, Clock } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "Safe Environment",
    description: "Secure facilities with trained staff ensuring your child&apos;s safety at all times.",
  },
  {
    icon: Heart,
    title: "Caring Teachers",
    description: "Passionate educators who nurture each child with love and individual attention.",
  },
  {
    icon: Award,
    title: "Quality Curriculum",
    description: "Research-based learning approach that prepares children for future academic success.",
  },
  {
    icon: Clock,
    title: "Flexible Hours",
    description: "Morning and afternoon sessions to accommodate working parents&apos; schedules.",
  },
]

export function WhyChooseSection() {
  return (
    <section className="bg-secondary/30 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Why Choose Little Stars?</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground leading-relaxed">
            We&apos;re committed to providing the best early education experience for your little one.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="flex flex-col items-center text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary">
                <feature.icon className="size-8 text-primary-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
