import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function GalleryPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-secondary/30 py-16">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">Gallery</h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              A glimpse into classroom moments, activities, and celebrations at Little Stars.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <Card>
              <CardHeader>
                <CardTitle>Photos coming soon</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Gallery module is connected to admin uploads. Once photos are added from admin
                  panel, they will appear here.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

