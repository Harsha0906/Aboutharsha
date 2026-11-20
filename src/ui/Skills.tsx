import { skills } from '../data/profile'
import { Kicker, Reveal, Section } from './Section'

export default function Skills() {
  return (
    <Section id="skills" side="left">
      <Kicker n={6}>Skills</Kicker>
      <Reveal>
        <h2 className="h2">
          My <em>toolbox</em>
        </h2>
      </Reveal>
      <div className="skills">
        {skills.map((g, i) => (
          <Reveal key={g.group} delay={i * 0.07}>
            <div className="skill-group">
              <h3>{g.group}</h3>
              <ul className="keys">
                {g.items.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
