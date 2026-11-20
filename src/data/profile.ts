// All the words on the site live here. Edit this file to update the portfolio.
// Entries marked `placeholder: true` are waiting for real details and render as "to be added" slots.

export const profile = {
  name: 'Harshavardhan S',
  shortName: 'Harsha',
  title: 'Software Developer',
  tagline: 'I build web apps, 3D experiences and games that run right in your browser.',
  about: [
    "I'm Harsha, a software developer who likes turning ideas into things people can click, play and explore.",
    'Most of my work lives on the web: React and TypeScript apps, Three.js worlds, AI-powered tools, Chrome extensions and browser games built from scratch, with every model, sound and shader made in code.',
  ],
  facts: [
    { k: 'Focus', v: 'Web, 3D & games' },
    { k: 'Stack', v: 'TypeScript · React · Three.js' },
    { k: 'Shipped', v: '19+ projects' },
  ],
  email: '', // add a public email to show a "Say hello" button
  resumeUrl: '', // e.g. './resume.pdf' after adding the file to /public
  links: {
    github: 'https://github.com/Harsha0906',
    linkedin: 'https://www.linkedin.com/in/harshavardhan-s-440725278/',
  },
}

export type TimelineItem = {
  when: string
  title: string
  org?: string
  body: string
  kind: 'education' | 'work' | 'build'
  placeholder?: boolean
}

export const timeline: TimelineItem[] = [
  {
    when: 'Education',
    title: 'Your degree goes here',
    org: 'College name · years',
    body: 'Degree, major, years and grade (if you want it shown).',
    kind: 'education',
    placeholder: true,
  },
  {
    when: 'Experience',
    title: 'Internship or role',
    org: 'Company · dates',
    body: 'What you did and the results, in two or three lines.',
    kind: 'work',
    placeholder: true,
  },
  {
    when: 'Nov 2026',
    title: 'Shipped two browser games in a week',
    org: 'DUNES · Tiny Planets',
    body: 'An open-world desert survival game and a shared papercraft universe, both in Three.js with procedural art and audio.',
    kind: 'build',
  },
  {
    when: 'Nov 2026',
    title: 'Cascade',
    org: 'Factory operations platform',
    body: 'A live 2.5D node flowchart that connects WhatsApp alerts, machine logs, weather and traffic APIs and Tally/Excel sheets for small factories.',
    kind: 'build',
  },
  {
    when: 'Aug – Sep 2026',
    title: 'Cybersecurity awareness, made playable',
    org: 'CyberVillage · CyberCo',
    body: 'A pixel-art village game with timed threat challenges, followed by a full awareness training system.',
    kind: 'build',
  },
  {
    when: 'Jun 2026',
    title: 'A month of creative web',
    org: 'Constella · Petalink · Click · Neotype',
    body: 'A 3D galaxy of thoughts, a digital bouquet builder, an editorial photo space and a typing tester.',
    kind: 'build',
  },
  {
    when: 'Feb – Apr 2026',
    title: 'AI tools and first extensions',
    org: 'CarbonTwin AI · Career Mirror · Chrome extension',
    body: 'A personal carbon digital twin with a local LLM, an AI career platform with an ATS resume scorer, and a screen-time tracker.',
    kind: 'build',
  },
]

export type Project = {
  name: string
  blurb: string
  tags: string[]
  repo: string
  live?: string
  accent: string
  year: string
}

const gh = (r: string) => `https://github.com/Harsha0906/${r}`

export const projects: Project[] = [
  {
    name: 'Cascade',
    blurb:
      'An "air traffic control tower" for small factories: WhatsApp alerts, machine logs, weather and traffic APIs and accounting sheets on one live 2.5D node flowchart.',
    tags: ['Next.js', 'Supabase', 'React Flow', 'Python'],
    repo: gh('cascade0'),
    accent: '#e2a45b',
    year: '2026',
  },
  {
    name: 'Constella',
    blurb: 'An immersive 3D space experience: a galaxy made of human thoughts that you can fly through.',
    tags: ['React', 'Three.js', 'GSAP'],
    repo: gh('constella'),
    accent: '#8fa4d8',
    year: '2026',
  },
  {
    name: 'Petalink',
    blurb:
      'A digital bouquet builder. Arrange flowers and hide links, messages, photos and music inside a handcrafted floral gift.',
    tags: ['React', 'TypeScript', 'Vercel'],
    repo: gh('petalink'),
    live: 'https://petalink-five.vercel.app',
    accent: '#e48f9e',
    year: '2026',
  },
  {
    name: 'Click',
    blurb:
      'A cinematic, editorial photo-sharing space with raw quality, zero compression and automatic 7-day archival.',
    tags: ['Next.js', 'Firebase', 'Cloudinary'],
    repo: gh('clickv2'),
    accent: '#c9b79c',
    year: '2026',
  },
  {
    name: 'Career Mirror',
    blurb:
      'AI career intelligence: skill-gap analysis, an ATS resume scorer, a "what if" simulator and a personal learning roadmap.',
    tags: ['AI', 'HTML', 'JavaScript'],
    repo: gh('Career-mirror'),
    accent: '#7fb8a4',
    year: '2026',
  },
  {
    name: 'CarbonTwin AI',
    blurb:
      'A personal carbon digital twin with a local LLM: tracks emissions, finds trends and simulates ways to cut them.',
    tags: ['Python', 'Streamlit', 'LLM'],
    repo: gh('carbontwin-ai'),
    accent: '#a3b86c',
    year: '2026',
  },
  {
    name: 'Cultiva',
    blurb: 'A productivity app built with Flutter.',
    tags: ['Dart', 'Flutter'],
    repo: gh('cultiva'),
    accent: '#88b07a',
    year: '2026',
  },
  {
    name: 'Screen Time Tracker',
    blurb:
      'A Chrome extension that tracks time per site, with daily stats, notifications, site blocking and an analytics dashboard.',
    tags: ['Chrome Extension', 'JavaScript'],
    repo: gh('internet-usage-analyzer'),
    accent: '#d7a36f',
    year: '2026',
  },
]

export type Game = {
  slug: string
  name: string
  blurb: string
  controls: string
  cover: string
  repo: string
  /** playable copy bundled into this site at build time (see scripts/build-games.mjs) */
  play: string
  live?: string
  tags: string[]
}

export const games: Game[] = [
  {
    slug: 'dunes',
    name: 'DUNES',
    blurb:
      'Open-world desert survival. Harvest sunglass shards while a cathedral-sized ray hunts you by vibration beneath the sand.',
    controls: 'WASD + mouse, gamepad or touch',
    cover: './playground/dunes.jpg',
    repo: gh('DUNE-'),
    play: './play/dunes/index.html',
    tags: ['Three.js', 'Procedural', 'Survival'],
  },
  {
    slug: 'tiny-planets',
    name: 'Tiny Planets',
    blurb:
      'A cozy papercraft sandbox. Build your own tiny 3D paper planet, then fly across a shared universe to visit everyone else’s.',
    controls: 'Mouse or touch',
    cover: './playground/tiny-planets.jpg',
    repo: gh('TINY-PLANETS'),
    play: './play/tiny-planets/index.html',
    tags: ['Three.js', 'Multiplayer', 'Sandbox'],
  },
  {
    slug: 'cybervillage',
    name: 'CyberVillage',
    blurb:
      'A retro pixel-art village where every building hides a real cyber threat. Learn security by making timed decisions.',
    controls: 'Arrow keys / WASD',
    cover: './playground/cybervillage.jpg',
    repo: gh('CyberVillage-'),
    play: './play/cybervillage/index.html',
    tags: ['Canvas', 'Pixel art', 'Edu-game'],
  },
  {
    slug: 'cyberco',
    name: 'Cyber Co',
    blurb:
      'Day 1 as a junior security analyst. Explore the office, question staff and trace a social engineering attack before it spreads.',
    controls: 'WASD / arrow keys + mouse',
    cover: './playground/cyberco.jpg',
    repo: gh('CyberCo'),
    play: './play/cyberco/index.html',
    tags: ['Phaser 3', 'React', 'TypeScript'],
  },
  {
    slug: 'neotype',
    name: 'Neotype',
    blurb: 'A clean typing speed tester. How fast are you, really?',
    controls: 'Keyboard',
    cover: './playground/neotype.jpg',
    repo: gh('neotype'),
    play: './play/neotype/index.html',
    live: 'https://neotype-delta.vercel.app',
    tags: ['JavaScript', 'Typing'],
  },
]

export type Badge = {
  title: string
  issuer: string
  year?: string
  url?: string
  image?: string
  color: string
  placeholder?: boolean
}

// Add certificates and badges here. `image` can point to a file in /public/certificates.
export const badges: Badge[] = [
  { title: 'Your certificate', issuer: 'Issuer', color: '#e2a45b', placeholder: true },
  { title: 'Hackathon or award', issuer: 'Event', color: '#8fa4d8', placeholder: true },
  { title: 'Course badge', issuer: 'Platform', color: '#e48f9e', placeholder: true },
  { title: 'Certification', issuer: 'Issuer', color: '#7fb8a4', placeholder: true },
]

export const skills: { group: string; items: string[] }[] = [
  { group: 'Languages', items: ['TypeScript', 'JavaScript', 'Python', 'Java', 'Dart', 'PHP', 'SQL', 'HTML/CSS'] },
  { group: 'Frontend & 3D', items: ['React', 'Next.js', 'Three.js', 'React Three Fiber', 'GSAP', 'Tailwind CSS', 'Vite'] },
  { group: 'Backend & data', items: ['Node.js', 'Supabase', 'MySQL', 'REST APIs', 'Streamlit'] },
  { group: 'AI & tools', items: ['LLM integration', 'Prompt design', 'Chrome Extensions', 'Flutter', 'Git & GitHub', 'Vercel', 'Netlify'] },
]

export const sections = [
  { id: 'hero', label: 'Hello' },
  { id: 'about', label: 'About' },
  { id: 'journey', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'playground', label: 'Playground' },
  { id: 'badges', label: 'Certificates' },
  { id: 'skills', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
] as const
