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
  parent_name: string
  child_name: string
  child_dob: string
  age_group: "nursery" | "lkg" | "ukg" | ""
  email: string
  phone: string
  message: string
}

export function EnquiryForm() {
  const [formData, setFormData] = useState<FormData>({
    parent_name: "",
    child_name: "",
    child_dob: "",
    age_group: "",
    email: "",
    phone: "",
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
      const { error } = await supabase.from("enquiries").insert([
        {
          parent_name: formData.parent_name,
          child_name: formData.child_name,
          child_dob: formData.child_dob,
          age_group: formData.age_group,
          email: formData.email,
          phone: formData.phone,
          message: formData.message || null,
        },
      ])

      if (error) {
        throw error
      }

      setSubmitStatus("success")
      setFormData({
        parent_name: "",
        child_name: "",
        child_dob: "",
        age_group: "",
        email: "",
        phone: "",
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
          <h3 className="mb-2 text-xl font-semibold text-green-800">Thank You!</h3>
          <p className="mb-6 text-green-700">
            Your enquiry has been submitted successfully. We&apos;ll get back to you within 24-48 hours.
          </p>
          <Button onClick={() => setSubmitStatus("idle")} variant="outline">
            Submit Another Enquiry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admission Enquiry Form</CardTitle>
        <CardDescription>
          Fill out the form below and our team will contact you shortly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="parent_name">Parent/Guardian Name *</Label>
              <Input
                id="parent_name"
                name="parent_name"
                value={formData.parent_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="child_name">Child&apos;s Name *</Label>
              <Input
                id="child_name"
                name="child_name"
                value={formData.child_name}
                onChange={handleChange}
                placeholder="Enter child's name"
                required
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="child_dob">Child&apos;s Date of Birth *</Label>
              <Input
                id="child_dob"
                name="child_dob"
                type="date"
                value={formData.child_dob}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="age_group">Applying for Class *</Label>
              <select
                id="age_group"
                name="age_group"
                value={formData.age_group}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    age_group: e.target.value as "nursery" | "lkg" | "ukg" | "",
                  }))
                }
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                required
              >
                <option value="">Select class</option>
                <option value="nursery">Nursery</option>
                <option value="lkg">LKG</option>
                <option value="ukg">UKG</option>
              </select>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
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
            <Label htmlFor="message">Additional Message (Optional)</Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Any specific questions or requirements..."
              rows={4}
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
                Submitting...
              </>
            ) : (
              "Submit Enquiry"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
