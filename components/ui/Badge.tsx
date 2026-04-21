type Variant = 'default' | 'success' | 'warning' | 'danger'

type Props = {
  label: string
  variant?: Variant
}

const styles: Record<Variant, string> = {
  default: 'border-zinc-800 text-zinc-400',
  success: 'border-green-800 text-green-400',
  warning: 'border-yellow-800 text-yellow-400',
  danger: 'border-red-800 text-red-400',
}

export function Badge({ label, variant = 'default' }: Props) {
  return (
    <span
      className={
        'inline-block border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ' +
        styles[variant]
      }
    >
      {label}
    </span>
  )
}
