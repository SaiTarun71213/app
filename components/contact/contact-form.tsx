"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle, AlertCircle } from "lucide-react"

interface FormData {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus("idle")
    setErrorMessage("")

    try {
      const supabase = createClient()
      const { error } = await supabase.from("contact_messages").insert([
        {
          name: formData.name,
          phone: formData.phone,
          message:
            `Email: ${formData.email}\nSubject: ${formData.subject}\n\n${formData.message}`,
        },
      ])

      if (error) {
        throw error
      }

      setSubmitStatus("success")
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      })
    } catch (error) {
      setSubmitStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitStatus === "success") {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <CheckCircle className="mb-4 size-16 text-green-600" />
          <h3 className="mb-2 text-xl font-semibold text-green-800">Message Sent!</h3>
          <p className="mb-6 text-green-700">
            Thank you for reaching out. We&apos;ll respond to your message as soon as possible.
          </p>
          <Button onClick={() => setSubmitStatus("idle")} variant="outline">
            Send Another Message
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Us a Message</CardTitle>
        <CardDescription>
          Have questions? We&apos;d love to hear from you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Your Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="What's this about?"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="message">Your Message *</Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Tell us more..."
              rows={5}
              required
            />
          </div>

          {submitStatus === "error" && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-destructive">
              <AlertCircle className="size-5" />
              <span className="text-sm">{errorMessage}</span>
            </div>
          )}

          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner className="size-4" />
                Sending...
              </>
            ) : (
              "Send Message"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
