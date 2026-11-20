import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

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

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: 0.8, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}
