import Link from "next/link"
import { Star, Phone, Mail, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-secondary/50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary">
                <Star className="size-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Little Stars</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nurturing young minds through play, creativity, and exploration. Where every child is a star!
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-foreground">Quick Links</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <Link href="/admissions" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Admissions
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Contact Us
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-foreground">Contact Us</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="size-4" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="size-4" />
                <span>hello@littlestars.edu</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4 mt-0.5 shrink-0" />
                <span>123 Rainbow Lane, Sunshine City, India - 400001</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Little Stars Playschool. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
