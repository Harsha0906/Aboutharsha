import { badges } from '../data/profile'
import { Kicker, Reveal, Section } from './Section'

export default function Badges() {
  return (
    <Section id="badges" side="wide">
      <Kicker n={5}>Certificates & Badges</Kicker>
      <Reveal>
        <h2 className="h2">
          Proof of <em>practice</em>
        </h2>
      </Reveal>
      <div className="badge-grid">
        {badges.map((b, i) => {
          const inner = (
            <>
              <div className="medal" style={{ ['--c' as string]: b.color }}>
                {b.image ? <img src={b.image} alt="" loading="lazy" /> : <span>★</span>}
              </div>
              <h3>{b.title}</h3>
              <p>
                {b.issuer}
                {b.year ? ` · ${b.year}` : ''}
              </p>
              {b.placeholder && <span className="tag-soon">to be added</span>}
            </>
          )
          return (
            <Reveal key={i} delay={i * 0.06}>
              {b.url ? (
                <a className="card badge" href={b.url} target="_blank" rel="noreferrer">
                  {inner}
                </a>
              ) : (
                <div className={`card badge ${b.placeholder ? 'is-placeholder' : ''}`}>{inner}</div>
              )}
            </Reveal>
          )
        })}
      </div>
    </Section>
  )
}
