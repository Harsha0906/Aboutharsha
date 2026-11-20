import { useEffect, useState } from 'react'
import { sections } from '../data/profile'
import { scroll } from '../state'

export default function Nav() {
  const [active, setActive] = useState(0)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const i = Math.round(scroll.t)
      setActive((a) => (a === i ? a : i))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <nav className="nav" aria-label="Sections">
      {sections.map((s, i) => (
        <a key={s.id} href={`#${s.id}`} className={i === active ? 'on' : ''} aria-current={i === active ? 'true' : undefined}>
          <span className="nav-label">{s.label}</span>
          <span className="nav-dot" />
        </a>
      ))}
    </nav>
  )
}
