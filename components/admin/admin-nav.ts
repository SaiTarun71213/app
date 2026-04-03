import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardCheck,
  BadgeIndianRupee,
  Megaphone,
  ListChecks,
} from 'lucide-react'

export type AdminNavItem = {
  href: string
  label: string
  Icon: LucideIcon
}

export const adminNavItems: AdminNavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/admin/students', label: 'Students', Icon: Users },
  { href: '/admin/teachers', label: 'Teachers', Icon: GraduationCap },
  { href: '/admin/attendance', label: 'Attendance', Icon: ClipboardCheck },
  { href: '/admin/fees', label: 'Fees', Icon: BadgeIndianRupee },
  { href: '/admin/announcements', label: 'Announcements', Icon: Megaphone },
  { href: '/admin/enquiries', label: 'Enquiries', Icon: ListChecks },
]

