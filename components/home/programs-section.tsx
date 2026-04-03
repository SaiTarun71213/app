import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Palette, Music, Book, Users } from "lucide-react"

const programs = [
  {
    icon: Palette,
    title: "Creative Arts",
    description: "Painting, crafts, and hands-on activities that spark imagination and develop fine motor skills.",
    age: "Ages 2-5",
  },
  {
    icon: Music,
    title: "Music & Movement",
    description: "Songs, dance, and rhythm activities that promote coordination and self-expression.",
    age: "Ages 2-5",
  },
  {
    icon: Book,
    title: "Early Literacy",
    description: "Story time, phonics, and language activities that build a foundation for reading and communication.",
    age: "Ages 3-5",
  },
  {
    icon: Users,
    title: "Social Skills",
    description: "Group activities and play that teach sharing, cooperation, and building friendships.",
    age: "Ages 2-5",
  },
]

export function ProgramsSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Our Programs</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground leading-relaxed">
            We offer a variety of engaging programs designed to nurture every aspect of your child&apos;s development.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {programs.map((program) => (
            <Card key={program.title} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="mb-3 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                  <program.icon className="size-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{program.title}</CardTitle>
                <CardDescription className="text-xs font-medium text-accent">{program.age}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{program.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
