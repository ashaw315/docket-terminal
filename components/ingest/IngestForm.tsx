'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export type PushResult =
  | { success: true; created: number; project: string }
  | { success: false; error: string }

type Props = {
  pushToBoard: (payload: string) => Promise<PushResult>
}

type Status = 'idle' | 'loading' | 'success' | 'error'

const PLACEHOLDER = `{
  "project": "Project Name",
  "description": "Optional project description",
  "color": "#4a9eff",
  "tasks": [
    { "title": "Task one", "column": "todo" },
    { "title": "Task two", "column": "todo", "notes": "Optional notes" },
    { "title": "Task in progress", "column": "in_progress" }
  ]
}`

export function IngestForm({ pushToBoard }: Props) {
  const router = useRouter()
  const [payload, setPayload] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<{ created: number; project: string } | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
    }
  }, [])

  const canSubmit = payload.trim().length > 0 && status !== 'loading'

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current)
      clearTimerRef.current = null
    }
    setResult(null)
    setErrorMessage(null)

    try {
      JSON.parse(payload)
    } catch {
      setStatus('error')
      setErrorMessage('INVALID JSON — CHECK YOUR PAYLOAD')
      return
    }

    setStatus('loading')
    const res = await pushToBoard(payload)
    if (res.success) {
      setStatus('success')
      setResult({ created: res.created, project: res.project })
      router.refresh()
      clearTimerRef.current = setTimeout(() => {
        setPayload('')
        setStatus('idle')
        setResult(null)
        clearTimerRef.current = null
      }, 3000)
    } else {
      setStatus('error')
      setErrorMessage(res.error)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="font-mono text-xs uppercase text-zinc-600">
          PASTE INGEST PAYLOAD BELOW
        </span>
        <textarea
          aria-label="Ingest payload"
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          placeholder={PLACEHOLDER}
          rows={12}
          className="min-h-[50vh] w-full resize-y border border-zinc-800 bg-zinc-900 p-3 font-mono text-sm text-zinc-100 placeholder:text-zinc-700 focus:border-zinc-700 focus:outline-none"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="border border-zinc-700 bg-zinc-800 px-4 py-2 font-mono text-xs uppercase text-zinc-100 hover:bg-zinc-700 transition-colors duration-150 disabled:opacity-40 disabled:hover:bg-zinc-800"
        >
          Push
        </button>

        {status === 'loading' && (
          <span className="font-mono text-xs uppercase text-zinc-500 animate-pulse">
            PUSHING…
          </span>
        )}
        {status === 'success' && result && (
          <span className="font-mono text-xs uppercase text-green-500">
            ✓ {result.created} TASKS ADDED TO {result.project.toUpperCase()}
          </span>
        )}
        {status === 'error' && errorMessage && (
          <span className="font-mono text-xs uppercase text-red-400">
            ✗ {errorMessage}
          </span>
        )}
      </div>
    </form>
  )
}
