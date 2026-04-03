import type { ComponentType } from 'react'

export type ParentNavItem = {
  href: string
  label: string
}

export const parentNavItems: ParentNavItem[] = [
  { href: '/parent/dashboard', label: '🏠 Dashboard' },
  { href: '/parent/child', label: '👶 My Child' },
  { href: '/parent/diary', label: '📓 Diary' },
  { href: '/parent/fees', label: '💰 Fees' },
  { href: '/parent/announcements', label: '📢 Notices' },
]

