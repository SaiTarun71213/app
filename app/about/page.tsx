import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

export default function AboutPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
          <h1 className="text-3xl font-bold text-foreground">About Little Stars Playschool</h1>
          <p className="text-muted-foreground">
            Little Stars Playschool is a warm, nurturing space where children learn through play,
            curiosity, and meaningful relationships with teachers and friends.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-[#FFF6D9] p-5">
              <h2 className="text-lg font-semibold text-foreground">Our Philosophy</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                We focus on social–emotional development, early literacy, creativity, and movement
                in a safe, loving environment.
              </p>
            </div>

            <div className="rounded-xl bg-[#E3F4FF] p-5">
              <h2 className="text-lg font-semibold text-foreground">Age Group</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                We welcome children from 1.5 to 5 years, with age-appropriate programs and
                activities.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

