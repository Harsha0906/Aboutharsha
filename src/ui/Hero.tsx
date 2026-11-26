import { motion, useScroll, useTransform } from 'framer-motion'
import { profile } from '../data/profile'
import { Kicker, Reveal, Section } from './Section'
import StickerPeel from './StickerPeel'

export function Hero() {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, -90])
  const spacing = useTransform(scrollY, [0, 500], ['0em', '0.3em'])
  const opacity = useTransform(scrollY, [0, 380], [1, 0])
  const blur = useTransform(scrollY, [0, 380], ['blur(0px)', 'blur(14px)'])
  // the sticker layout is drawn for a ~1200px wide screen; pull it in (and shrink it) on narrower ones
  const k = typeof window === 'undefined' ? 1 : Math.min(1, window.innerWidth / 1200)
  const pos = (x: number, y: number) => ({ x: Math.round(x * Math.max(0.36, k)), y: Math.round(y * Math.max(0.6, k)) })
  const size = (w: number) => Math.round(w * Math.max(0.55, k))
  return (
    <section id="hero" data-stop className="hero">
      <div className="hero-pin">
        {/* Interactive peelable holographic stickers on the concrete wall */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <StickerPeel
              imageSrc="./stickers/holo-party-smiley.png"
              width={size(150)}
              finish="holo"
              initialPosition={pos(280, -130)}
              rotate={-8}
              peelBackHoverPct={30}
              peelBackActivePct={48}
              curlRadius={14}
              lightingIntensity={0.75}
              shadowIntensity={0.65}
              draggable
              intro
            />
            <StickerPeel
              imageSrc="./stickers/holo-compass-star.png"
              width={size(145)}
              finish="holo"
              initialPosition={pos(-280, -120)}
              rotate={10}
              peelBackHoverPct={28}
              peelBackActivePct={45}
              curlRadius={13}
              lightingIntensity={0.7}
              shadowIntensity={0.6}
              draggable
              intro
            />
            <StickerPeel
              imageSrc="./stickers/holo-sparkle.png"
              width={size(110)}
              finish="holo"
              initialPosition={pos(330, 60)}
              rotate={15}
              peelBackHoverPct={35}
              peelBackActivePct={50}
              curlRadius={10}
              lightingIntensity={0.8}
              shadowIntensity={0.5}
              draggable
              intro
            />
            <StickerPeel
              imageSrc="./stickers/holo-sunflower.png"
              width={size(130)}
              finish="holo"
              initialPosition={pos(-340, 60)}
              rotate={-12}
              peelBackHoverPct={25}
              peelBackActivePct={40}
              curlRadius={12}
              lightingIntensity={0.7}
              shadowIntensity={0.6}
              draggable
              intro
            />
            <StickerPeel
              imageSrc="./stickers/holo-pinwheel.png"
              width={size(140)}
              finish="holo"
              initialPosition={pos(-440, -220)}
              rotate={-16}
              peelBackHoverPct={30}
              peelBackActivePct={46}
              curlRadius={14}
              lightingIntensity={0.75}
              shadowIntensity={0.6}
              draggable
              intro
            />
            <StickerPeel
              imageSrc="./stickers/holo-checkered-diamond.png"
              width={size(140)}
              finish="holo"
              initialPosition={pos(440, -210)}
              rotate={14}
              peelBackHoverPct={28}
              peelBackActivePct={45}
              curlRadius={13}
              lightingIntensity={0.75}
              shadowIntensity={0.6}
              draggable
              intro
            />
            <StickerPeel
              imageSrc="./stickers/holo-atom-heart.png"
              width={size(135)}
              finish="holo"
              initialPosition={pos(430, 210)}
              rotate={-10}
              peelBackHoverPct={30}
              peelBackActivePct={46}
              curlRadius={12}
              lightingIntensity={0.8}
              shadowIntensity={0.6}
              draggable
              intro
            />
          </div>
        </div>

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
      </div>
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
