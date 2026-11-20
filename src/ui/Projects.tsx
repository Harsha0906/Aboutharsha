import { projects } from '../data/profile'
import { Kicker, Reveal, Section } from './Section'

export default function Projects() {
  return (
    <Section id="projects" side="wide">
      <Kicker n={3}>Projects</Kicker>
      <Reveal>
        <h2 className="h2">
          Things I've <em>built</em>
        </h2>
      </Reveal>
      <div className="project-grid">
        {projects.map((p, i) => (
          <Reveal key={p.name} delay={(i % 3) * 0.06}>
            <article className="card project" style={{ ['--accent' as string]: p.accent }}>
              <div className="project-top">
                <span className="project-n">{String(i + 1).padStart(2, '0')}</span>
                <span className="project-year">{p.year}</span>
              </div>
              <h3>{p.name}</h3>
              <p>{p.blurb}</p>
              <ul className="chips">
                {p.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <div className="card-links">
                {p.live && (
                  <a href={p.live} target="_blank" rel="noreferrer" className="btn btn-solid">
                    Live ↗
                  </a>
                )}
                <a href={p.repo} target="_blank" rel="noreferrer" className="btn">
                  Code ↗
                </a>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
