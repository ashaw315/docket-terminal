'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import type { CardColumn } from '@/types'

export type GeneratedBoard = {
  projectName: string
  description: string
  tasks: Array<{ title: string; column: 'todo' | 'in_progress' | 'done' }>
}

type Props = {
  open: boolean
  onClose: () => void
  generate: (description: string) => Promise<GeneratedBoard>
}

type Stage = 'describe' | 'preview'

const PRESET_COLORS = [
  '#4a9eff',
  '#f97316',
  '#22c55e',
  '#a855f7',
  '#ef4444',
  '#eab308',
] as const

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

const COLUMN_MAP: Record<'todo' | 'in_progress' | 'done', CardColumn> = {
  todo: 'TODO',
  in_progress: 'IN_PROGRESS',
  done: 'DONE',
}

const COLUMN_LABEL: Record<CardColumn, string> = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN PROGRESS',
  DONE: 'DONE',
}

export function GenerateBoardModal({ open, onClose, generate }: Props) {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('describe')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('')
  const [hexInput, setHexInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [board, setBoard] = useState<GeneratedBoard | null>(null)
  const [projectName, setProjectName] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      setStage('describe')
      setDescription('')
      setColor('')
      setHexInput('')
      setLoading(false)
      setError(null)
      setBoard(null)
      setProjectName('')
      setRenaming(false)
      setChecked({})
      setSubmitting(false)
    }
  }, [open])

  useEffect(() => {
    if (renaming) renameInputRef.current?.focus()
  }, [renaming])

  function chooseHex(value: string) {
    setHexInput(value)
    if (HEX_RE.test(value.trim())) setColor(value.trim())
  }

  const canGenerate = description.trim().length >= 10 && !loading

  async function handleGenerate() {
    if (!canGenerate) return
    setLoading(true)
    setError(null)
    try {
      const result = await generate(description.trim())
      setBoard(result)
      setProjectName(result.projectName)
      const initial: Record<number, boolean> = {}
      result.tasks.forEach((_, i) => {
        initial[i] = true
      })
      setChecked(initial)
      setStage('preview')
    } catch {
      setError('COULD NOT GENERATE — TRY AGAIN')
    } finally {
      setLoading(false)
    }
  }

  function handleRegenerate() {
    setStage('describe')
    setBoard(null)
    setError(null)
  }

  function toggle(index: number) {
    setChecked((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  async function handleCreate() {
    if (!board) return
    setSubmitting(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        name: projectName.trim(),
        description: board.description,
      }
      if (color) body.color = color

      const projectRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!projectRes.ok) {
        const data = await projectRes.json().catch(() => ({ error: 'Failed' }))
        setError(typeof data.error === 'string' ? data.error.toUpperCase() : 'COULD NOT CREATE PROJECT')
        setSubmitting(false)
        return
      }
      const projectBody = await projectRes.json()
      const projectId = projectBody.data.id as string

      const selected = board.tasks.filter((_, i) => checked[i])
      for (const task of selected) {
        const cardRes = await fetch(`/api/projects/${projectId}/cards`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ title: task.title, column: COLUMN_MAP[task.column] }),
        })
        if (!cardRes.ok) {
          setError('PROJECT CREATED BUT SOME TASKS FAILED')
          setSubmitting(false)
          router.push(`/projects/${projectId}`)
          return
        }
      }

      router.push(`/projects/${projectId}`)
    } catch {
      setError('COULD NOT CREATE PROJECT')
      setSubmitting(false)
    }
  }

  const grouped: Record<CardColumn, Array<{ title: string; index: number }>> = {
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
  }
  if (board) {
    board.tasks.forEach((t, i) => {
      grouped[COLUMN_MAP[t.column]].push({ title: t.title, index: i })
    })
  }

  return (
    <Modal open={open} onClose={onClose} labelledBy="generate-board-title">
      <h2
        id="generate-board-title"
        className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-zinc-400"
      >
        GENERATE BOARD
      </h2>

      {stage === 'describe' && (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase text-zinc-600">
              Describe your project
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A Next.js app that scrapes daily news, summarizes with Claude, and generates a p5.js sketch for each story…"
              rows={4}
              maxLength={1000}
              className="min-h-[8rem] resize-y border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-100 placeholder:text-zinc-700 focus:border-zinc-500 focus:outline-none"
              autoFocus
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase text-zinc-600">Color</span>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Select color ${c}`}
                  onClick={() => {
                    setColor(c)
                    setHexInput('')
                  }}
                  className={
                    'h-6 w-6 border transition-colors duration-150 ' +
                    (color === c ? 'border-zinc-100' : 'border-zinc-800 hover:border-zinc-600')
                  }
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                aria-label="Custom hex color"
                placeholder="#rrggbb"
                value={hexInput}
                onChange={(e) => chooseHex(e.target.value)}
                className="w-24 border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-xs text-zinc-100 focus:border-zinc-600 focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="font-mono text-xs uppercase text-red-400">{error}</div>
          )}

          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-zinc-800 px-3 py-1 font-mono text-xs uppercase text-zinc-400 hover:bg-zinc-800 transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="border border-zinc-600 px-3 py-1 font-mono text-xs uppercase text-zinc-100 hover:bg-zinc-800 transition-colors duration-150 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              {loading ? 'Thinking…' : 'Generate →'}
            </button>
          </div>
        </div>
      )}

      {stage === 'preview' && board && (
        <div className="flex flex-col gap-4">
          {renaming ? (
            <input
              ref={renameInputRef}
              aria-label="Project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={() => setRenaming(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                  e.preventDefault()
                  setRenaming(false)
                }
              }}
              className="w-full border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-sm uppercase tracking-tight text-zinc-100 focus:border-zinc-500 focus:outline-none"
              maxLength={255}
            />
          ) : (
            <h3
              role="heading"
              aria-level={3}
              onClick={() => setRenaming(true)}
              className="cursor-pointer truncate font-mono text-sm uppercase tracking-tight text-zinc-100 hover:text-zinc-300"
            >
              {projectName.toUpperCase() || 'UNTITLED PROJECT'}
            </h3>
          )}

          <p className="font-mono text-xs text-zinc-500">{board.description}</p>

          <div className="flex flex-col gap-3">
            {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((col) => {
              const items = grouped[col]
              if (items.length === 0) return null
              return (
                <section key={col} className="flex flex-col gap-1">
                  <span className="font-mono text-xs uppercase tracking-wide text-zinc-500">
                    {COLUMN_LABEL[col]} ({items.length})
                  </span>
                  <ul className="flex flex-col gap-1 pl-1">
                    {items.map(({ title, index }) => (
                      <li key={index} className="flex items-start gap-2">
                        <input
                          id={`task-${index}`}
                          type="checkbox"
                          aria-label={title}
                          checked={!!checked[index]}
                          onChange={() => toggle(index)}
                          className="mt-[3px] h-3 w-3 accent-zinc-400"
                        />
                        <label
                          htmlFor={`task-${index}`}
                          className="min-w-0 break-words font-mono text-sm text-zinc-100"
                        >
                          {title}
                        </label>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>

          {error && (
            <div className="font-mono text-xs uppercase text-red-400">{error}</div>
          )}

          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleRegenerate}
              className="border border-zinc-800 px-3 py-1 font-mono text-xs uppercase text-zinc-400 hover:bg-zinc-800 transition-colors duration-150"
            >
              ← Regenerate
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="border border-zinc-800 px-3 py-1 font-mono text-xs uppercase text-zinc-400 hover:bg-zinc-800 transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={submitting || Object.values(checked).every((v) => !v) || !projectName.trim()}
                className="border border-zinc-600 px-3 py-1 font-mono text-xs uppercase text-zinc-100 hover:bg-zinc-800 transition-colors duration-150 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                {submitting ? 'Creating…' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
