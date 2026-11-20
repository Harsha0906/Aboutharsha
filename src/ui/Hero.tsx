import { motion, useScroll, useTransform } from 'framer-motion'
import { profile } from '../data/profile'
import { Kicker, Reveal, Section } from './Section'

export function Hero() {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, -90])
  const spacing = useTransform(scrollY, [0, 500], ['0em', '0.3em'])
  const opacity = useTransform(scrollY, [0, 380], [1, 0])
  const blur = useTransform(scrollY, [0, 380], ['blur(0px)', 'blur(14px)'])
  return (
    <section id="hero" data-stop className="hero">
      <motion.div className="hero-copy" style={{ opacity, filter: blur }}>
        <motion.h1 className="hero-title" style={{ y, letterSpacing: spacing }}>
          <span className="hero-hi">Hi, I'm</span> {profile.shortName}
        </motion.h1>
        <motion.p className="hero-sub" style={{ y: useTransform(scrollY, [0, 500], [0, -50]) }}>
          {profile.title} · {profile.tagline}
        </motion.p>
      </motion.div>
      <motion.a href="#about" className="scroll-cue" style={{ opacity }}>
        <span>Scroll</span>
        <i>
          <b />
        </i>
      </motion.a>
    </section>
  )
}

export function About() {
  return (
    <Section id="about" side="right">
      <Kicker n={1}>About</Kicker>
      <Reveal>
        <h2 className="h2">
          Code that you can <em>play with.</em>
        </h2>
      </Reveal>
      {profile.about.map((p, i) => (
        <Reveal key={i} delay={0.1 + i * 0.08}>
          <p className="lead">{p}</p>
        </Reveal>
      ))}
      <Reveal delay={0.3}>
        <dl className="facts">
          {profile.facts.map((f) => (
            <div key={f.k}>
              <dt>{f.k}</dt>
              <dd>{f.v}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </Section>
  )
}
