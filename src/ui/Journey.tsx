import { timeline } from '../data/profile'
import { Kicker, Reveal, Section } from './Section'

const ICON = { education: '🎓', work: '💼', build: '🛠' } as const

export default function Journey() {
  return (
    <Section id="journey" side="right">
      <Kicker n={2}>Experience & Education</Kicker>
      <Reveal>
        <h2 className="h2">The journey so far</h2>
      </Reveal>
      <ol className="timeline">
        {timeline.map((t, i) => (
          <Reveal key={i} delay={i * 0.05}>
            <li className={`tl-item ${t.placeholder ? 'is-placeholder' : ''}`}>
              <span className="tl-dot" aria-hidden="true">{ICON[t.kind]}</span>
              <div className="tl-when">{t.when}</div>
              <h3 className="tl-title">{t.title}</h3>
              {t.org && <div className="tl-org">{t.org}</div>}
              <p className="tl-body">{t.body}</p>
              {t.placeholder && <span className="tag-soon">to be added</span>}
            </li>
          </Reveal>
        ))}
      </ol>
    </Section>
  )
}
