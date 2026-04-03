import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ContactForm } from "@/components/contact/contact-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, Mail, MapPin, Clock } from "lucide-react"

const contactInfo = [
  {
    icon: Phone,
    title: "Phone",
    details: ["+91 98765 43210", "+91 98765 43211"],
  },
  {
    icon: Mail,
    title: "Email",
    details: ["hello@littlestars.edu", "admissions@littlestars.edu"],
  },
  {
    icon: MapPin,
    title: "Address",
    details: ["123 Rainbow Lane,", "Sunshine City, India - 400001"],
  },
  {
    icon: Clock,
    title: "Office Hours",
    details: ["Monday - Friday: 8:00 AM - 5:00 PM", "Saturday: 9:00 AM - 1:00 PM"],
  },
]

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-secondary/30 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">Contact Us</h1>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
                We&apos;re here to answer any questions you have about Little Stars Playschool. Reach out and let&apos;s talk!
              </p>
            </div>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {contactInfo.map((info) => (
                <Card key={info.title}>
                  <CardHeader className="pb-2">
                    <div className="mb-3 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                      <info.icon className="size-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{info.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {info.details.map((detail, index) => (
                      <p key={index} className="text-sm text-muted-foreground">
                        {detail}
                      </p>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="bg-secondary/30 py-16">
          <div className="mx-auto max-w-2xl px-4">
            <ContactForm />
          </div>
        </section>

        {/* Map Section */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-8 text-center text-2xl font-bold text-foreground md:text-3xl">
              Find Us Here
            </h2>
            <div className="aspect-video overflow-hidden rounded-xl border bg-muted">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d241317.11609823277!2d72.74109995709657!3d19.08219783958221!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c6306644edc1%3A0x5da4ed8f8d648c69!2sMumbai%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1699000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Little Stars Playschool Location"
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
