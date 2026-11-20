import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { games, type Game } from '../data/profile'
import { Kicker, Reveal, Section } from './Section'

function useBuiltGames() {
  const [built, setBuilt] = useState<string[] | null>(null)
  useEffect(() => {
    fetch('./play/manifest.json')
      .then((r) => (r.ok ? r.json() : { built: [] }))
      .then((m: { built: string[] }) => setBuilt(m.built))
      .catch(() => setBuilt([]))
  }, [])
  return built
}

export default function Playground() {
  const built = useBuiltGames()
  const [open, setOpen] = useState<Game | null>(null)

  useEffect(() => {
    document.body.classList.toggle('modal-open', !!open)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <Section id="playground" side="wide">
      <Kicker n={4}>Playground</Kicker>
      <Reveal>
        <h2 className="h2">
          Games you can <em>play right here</em>
        </h2>
      </Reveal>
      <Reveal delay={0.05}>
        <p className="lead narrow">Every one of these runs in your browser. Hit play, no downloads, no sign-up.</p>
      </Reveal>
      <div className="game-grid">
        {games.map((g, i) => {
          const playable = built?.includes(g.slug)
          return (
            <Reveal key={g.slug} delay={(i % 3) * 0.07} className={i === 0 ? 'game-feature' : undefined}>
              <article className="card game">
                <button
                  className="game-cover"
                  onClick={() => (playable ? setOpen(g) : window.open(g.live ?? g.repo, '_blank'))}
                  aria-label={`Play ${g.name}`}
                >
                  <img src={g.cover} alt={`${g.name} screenshot`} loading="lazy" />
                  <span className="play-pill">▶ Play</span>
                </button>
                <div className="game-body">
                  <h3>{g.name}</h3>
                  <p>{g.blurb}</p>
                  <ul className="chips">
                    {g.tags.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  <div className="game-foot">
                    <span className="controls">⌨ {g.controls}</span>
                    <a href={g.repo} target="_blank" rel="noreferrer" className="link">
                      Source ↗
                    </a>
                  </div>
                </div>
              </article>
            </Reveal>
          )
        })}
      </div>
      <AnimatePresence>{open && <GameModal game={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </Section>
  )
}

function GameModal({ game, onClose }: { game: Game; onClose: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const t = setTimeout(() => frame.current?.focus(), 400)
    return () => clearTimeout(t)
  }, [])
  return (
    <motion.div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-label={game.name}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        ref={wrap}
        className="modal-box"
        initial={{ scale: 0.94, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 10 }}
        transition={{ type: 'spring', damping: 24, stiffness: 220 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-bar">
          <b>{game.name}</b>
          <span className="controls">⌨ {game.controls}</span>
          <div className="modal-actions">
            <button className="btn" onClick={() => wrap.current?.requestFullscreen?.()}>
              Fullscreen ⤢
            </button>
            <a className="btn" href={game.play} target="_blank" rel="noreferrer">
              New tab ↗
            </a>
            <button className="btn btn-solid" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>
        <iframe
          ref={frame}
          src={game.play}
          title={game.name}
          allow="fullscreen; gamepad; autoplay"
          allowFullScreen
        />
      </motion.div>
    </motion.div>
  )
}
