import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { EnquiryForm } from "@/components/admissions/enquiry-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, FileText, Users, CheckCircle } from "lucide-react"

const admissionSteps = [
  {
    icon: FileText,
    title: "Submit Enquiry",
    description: "Fill out our enquiry form with your details and we'll reach out to schedule a visit.",
  },
  {
    icon: Calendar,
    title: "School Visit",
    description: "Tour our facilities, meet our teachers, and see our programs in action.",
  },
  {
    icon: Users,
    title: "Interaction Session",
    description: "A brief session where we get to know your child and understand their needs.",
  },
  {
    icon: CheckCircle,
    title: "Enrollment",
    description: "Complete the registration process and welcome your child to the Little Stars family!",
  },
]

export default function AdmissionsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-secondary/30 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">Admissions</h1>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
                Begin your child&apos;s journey with Little Stars Playschool. We&apos;re excited to welcome new families to our community!
              </p>
            </div>
          </div>
        </section>

        {/* Admission Process */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-8 text-center text-2xl font-bold text-foreground md:text-3xl">
              Admission Process
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {admissionSteps.map((step, index) => (
                <Card key={step.title} className="relative">
                  <CardHeader className="pb-2">
                    <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                      {index + 1}
                    </div>
                    <div className="mb-2 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                      <step.icon className="size-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Enquiry Form Section */}
        <section className="bg-secondary/30 py-16">
          <div className="mx-auto max-w-2xl px-4">
            <EnquiryForm />
          </div>
        </section>

        {/* Important Info */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-8 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Age Eligibility</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-muted-foreground">
                  <p><strong className="text-foreground">Playgroup:</strong> 1.5 to 2.5 years</p>
                  <p><strong className="text-foreground">Nursery:</strong> 2.5 to 3.5 years</p>
                  <p><strong className="text-foreground">Junior KG:</strong> 3.5 to 4.5 years</p>
                  <p><strong className="text-foreground">Senior KG:</strong> 4.5 to 5.5 years</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Documents Required</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-2 text-muted-foreground">
                    <li>Birth Certificate (original and copy)</li>
                    <li>Passport-size photographs (4 nos.)</li>
                    <li>Aadhaar Card of child and parents</li>
                    <li>Immunization records</li>
                    <li>Address proof</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
