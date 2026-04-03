import type { LucideIcon } from 'lucide-react'
import { House, ClipboardCheck, NotebookPen } from 'lucide-react'

export type TeacherNavItem = {
  href: string
  label: string
  Icon: LucideIcon
}

export const teacherNavItems: TeacherNavItem[] = [
  { href: '/teacher/dashboard', label: 'Dashboard', Icon: House },
  { href: '/teacher/attendance', label: 'Attendance', Icon: ClipboardCheck },
  { href: '/teacher/diary', label: 'Diary', Icon: NotebookPen },
]

