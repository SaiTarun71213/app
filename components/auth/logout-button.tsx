'use client'

import { useFormStatus } from 'react-dom'
import { logoutAction } from '@/app/logout/actions'

type Props = {
  className?: string
}

function LogoutSubmit({ className }: Props) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        'rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70'
      }
    >
      {pending ? 'Signing out…' : 'Logout'}
    </button>
  )
}

export function LogoutButton({ className }: Props) {
  return (
    <form action={logoutAction}>
      <LogoutSubmit className={className} />
    </form>
  )
}

