import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { profile, sections } from './data/profile'
import { remeasure, scroll } from './state'
import Grain from './ui/Grain'
import Loader from './ui/Loader'
import Nav from './ui/Nav'
import { About, Hero } from './ui/Hero'
import Journey from './ui/Journey'
import Projects from './ui/Projects'
import Playground from './ui/Playground'
import Badges from './ui/Badges'
import Skills from './ui/Skills'
import Contact from './ui/Contact'

const Experience = lazy(() => import('./scene/Experience'))

export default function App() {
  const [ready, setReady] = useState(false)
  const { scrollY } = useScroll()
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const chrome = useTransform(scrollY, [0, 260], [1, 0])
  const scrim = useTransform(scrollY, [vh * 1.15, vh * 1.8], [0, 1]) // only after the avatar has risen

  useEffect(() => {
    remeasure()
    const id = setInterval(remeasure, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <Loader done={ready} />

      <div className="stage" aria-hidden="true">
        <Suspense fallback={null}>
          <Experience onReady={() => setReady(true)} />
        </Suspense>
      </div>
      <motion.div className="scrim" style={{ opacity: scrim }} aria-hidden="true" />
      <Fog />

      <motion.div className="chrome" style={{ opacity: chrome }} aria-hidden="true">
        <div className="frame" />
        <span className="mark tl">+</span>
        <span className="mark tr">+</span>
        <span className="mark bl">+</span>
        <span className="mark br">+</span>
        <div className="meta m-tl">
          <b>{profile.name}</b>
          <span>{profile.title}</span>
        </div>
        <div className="meta m-tr">Portfolio — {new Date().getFullYear()}</div>
        <div className="meta m-bl">Code · Play · Build</div>
        <div className="meta m-r">Move your cursor · I'm watching</div>
      </motion.div>

      <Nav />
      <Grain />

      <main className="content">
        <Hero />
        <About />
        <Journey />
        <Projects />
        <Playground />
        <Badges />
        <Skills />
        <Contact />
      </main>
      <noscript>
        {profile.name} · {profile.title}. {sections.length} sections.
      </noscript>
    </>
  )
}

// Dims and softens the 3D scene behind the full-width sections (projects, playground, badges).
function Fog() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    const ss = (a: number, b: number, x: number) => {
      const k = Math.min(1, Math.max(0, (x - a) / (b - a)))
      return k * k * (3 - 2 * k)
    }
    const tick = () => {
      const t = scroll.t
      const v = ss(2.45, 2.95, t) * (1 - ss(5.1, 5.6, t))
      if (ref.current) ref.current.style.opacity = v.toFixed(3)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return <div ref={ref} className="fog" aria-hidden="true" />
}
