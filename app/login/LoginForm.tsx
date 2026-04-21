'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export type LoginResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string }

type Props = {
  login: (password: string, from: string) => Promise<LoginResult>
}

function safeFrom(raw: string | null): string {
  if (!raw) return '/'
  if (!raw.startsWith('/')) return '/'
  if (raw.startsWith('//')) return '/'
  return raw
}

export function LoginForm({ login }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const from = safeFrom(params.get('from'))

  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const canSubmit = password.length > 0 && !submitting

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    const res = await login(password, from)
    if (res.success) {
      router.push(res.redirectTo)
      router.refresh()
    } else {
      setError(res.error)
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-stretch justify-center gap-6 bg-zinc-950 px-6 text-zinc-100">
      <div className="flex flex-col items-center gap-1">
        <h1 className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
          DOCKET TERMINAL
        </h1>
        <span className="font-mono text-xs uppercase text-zinc-600">
          ENTER PASSWORD
        </span>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="sr-only">Password</span>
          <input
            ref={inputRef}
            type="password"
            aria-label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={!canSubmit}
          className="border border-zinc-600 px-3 py-2 font-mono text-xs uppercase tracking-wide text-zinc-100 hover:bg-zinc-800 transition-colors duration-150 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Enter
        </button>

        {error && (
          <span className="font-mono text-xs uppercase text-red-400">{error}</span>
        )}
      </form>
    </main>
  )
}
