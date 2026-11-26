import { useEffect, useRef, type ReactNode } from 'react'
import { registerReveal } from '../motion'

export function Section({
  id,
  side = 'right',
  className = '',
  children,
}: {
  id: string
  side?: 'left' | 'right' | 'center' | 'wide'
  className?: string
  children: ReactNode
}) {
  return (
    <section id={id} data-stop className={`section side-${side} ${className}`}>
      <div className="section-inner">{children}</div>
    </section>
  )
}

export function Kicker({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="kicker">
      <span className="kicker-n">{String(n).padStart(2, '0')}</span>
      <span className="kicker-line" />
      <span>{children}</span>
    </div>
  )
}

// Fades and lifts in as the camera arrives at this section, and out as it leaves.
// `delay` (seconds) is kept from the old API and becomes the stagger order (~60 ms per step).
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    return registerReveal(ref.current, Math.round(delay / 0.06) + 1)
  }, [delay])
  return (
    <div ref={ref} className={className ? `reveal ${className}` : 'reveal'}>
      {children}
    </div>
  )
}
