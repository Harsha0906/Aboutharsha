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
  const chrome = useTransform(scrollY, [0, 260], [1, 0])

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
      <div className="dots" aria-hidden="true" />

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
        <div className="meta m-r">Scroll to explore</div>
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
