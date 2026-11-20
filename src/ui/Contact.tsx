import { profile } from '../data/profile'
import { Kicker, Reveal, Section } from './Section'

export default function Contact() {
  return (
    <Section id="contact" side="center" className="contact">
      <Kicker n={7}>Contact</Kicker>
      <Reveal>
        <h2 className="contact-title">Let's build something fun.</h2>
      </Reveal>
      <Reveal delay={0.1}>
        <p className="lead">Open to roles, freelance work and collaborations. The fastest way to reach me is below.</p>
      </Reveal>
      <Reveal delay={0.18}>
        <div className="contact-links">
          {profile.email && (
            <a className="btn btn-solid btn-lg" href={`mailto:${profile.email}`}>
              Say hello ✉
            </a>
          )}
          <a className="btn btn-lg" href={profile.links.linkedin} target="_blank" rel="noreferrer">
            LinkedIn ↗
          </a>
          <a className="btn btn-lg" href={profile.links.github} target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
          {profile.resumeUrl && (
            <a className="btn btn-lg" href={profile.resumeUrl} download>
              Resume ↓
            </a>
          )}
        </div>
      </Reveal>
      <footer className="footer">
        © {new Date().getFullYear()} {profile.name} · Built with React Three Fiber
      </footer>
    </Section>
  )
}
