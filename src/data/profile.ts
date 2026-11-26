// All the words on the site live here. Edit this file to update the portfolio.
// Updated with verified information from Harshavardhan's resume.

export const profile = {
  name: 'Harshavardhan S',
  shortName: 'Harsha',
  title: 'AI Software Engineer',
  phone: '9380643365',
  tagline: 'Creative developer building agentic AI workflows and interactive websites.',
  about: [
    "I'm Harsha, a Computer Science & Engineering undergraduate at Presidency University, creative developer focused on AI-driven software, agentic AI, and building interactive websites.",
    "I build applications that combine multi-agent workflows (LangGraph), interactive websites, and generative AI to solve real-world business problems — from supply-chain recovery platforms to offline-first gamified mobile apps.",
    "Founder of Cultiva (a pre-launch mobile startup) and passionate about turning complex agentic architectures into reliable, human-centered products.",
  ],
  facts: [
    { k: 'Focus', v: 'Agentic AI & Creative Web' },
    { k: 'Education', v: 'Presidency University (2027)' },
    { k: 'Core Stack', v: 'Python · LangGraph · Next.js · React' },
    { k: 'Location', v: 'Bangalore, India' },
  ],
  email: 'harshavardhansachith@gmail.com',
  resumeUrl: './resume.pdf',
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
    when: 'Nov 2026 – Present',
    title: 'Founder & Developer',
    org: 'Cultiva (pre-launch startup)',
    body: 'Building a gamified habit and focus app for Android where finishing real tasks grows a pixel-art farm. Built solo in Flutter & Flame with offline-first SQLite storage, reminder notifications, in-app shop, and accessibility support.',
    kind: 'work',
  },
  {
    when: 'Nov 2026',
    title: 'CascadeZero',
    org: 'AI Supply-Chain Disruption Recovery Platform',
    body: 'Built a full-stack platform turning disruption alerts into cost-optimal recovery plans using MILP optimization and Monte Carlo simulation. Designed multi-agent LangGraph workflows with supplier negotiation and human approval before actions, backed by 650+ tests.',
    kind: 'build',
  },
  {
    when: 'Jun 2025 – Aug 2025',
    title: 'Web Development Intern',
    org: 'Unified Mentor Pvt. Ltd. · Remote',
    body: 'Built responsive web interfaces with emphasis on cross-device responsiveness and usability. Assisted with frontend development, UI enhancement tasks, and interface performance optimization.',
    kind: 'work',
  },
  {
    when: 'Jun 2026',
    title: 'Click',
    org: 'Shared Event Photo Archiver',
    body: 'Developed full-stack event photo archiving platform supporting original-quality storage via Cloudinary, real-time Firestore photo galleries, anonymous authentication, and interactive parallax hero collage.',
    kind: 'build',
  },
  {
    when: '2023 – 2027 (Expected)',
    title: 'B.Tech in Computer Science and Engineering',
    org: 'Presidency University, Bangalore',
    body: 'CGPA: 7.35 · Coursework in Data Structures & Algorithms, Artificial Intelligence, Database Management Systems, and Software Engineering.',
    kind: 'education',
  },
  {
    when: 'Nov 2026',
    title: 'Creative Web & Game Worlds',
    org: 'DUNES · Tiny Planets · Constella',
    body: 'Built procedural 3D browser games and immersive Three.js worlds: an open-world desert survival game, a shared papercraft universe, and a 3D galaxy of human thoughts.',
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
    name: 'CascadeZero',
    blurb:
      'AI Supply-Chain Disruption Recovery Platform: turns supply alerts into cost-optimal recovery plans via MILP optimization, Monte Carlo risk simulation, and LangGraph multi-agent supplier negotiation with a Telegram bot and 650+ tests.',
    tags: ['Python', 'FastAPI', 'LangGraph', 'Next.js', 'PostgreSQL', 'Supabase'],
    repo: gh('cascade0'),
    accent: '#e2a45b',
    year: '2026',
  },
  {
    name: 'Click',
    blurb:
      'Shared Event Photo Archiver: full-stack event photo archiving platform supporting original-quality Cloudinary storage, real-time Firebase Firestore galleries, gated-access routing, and HTML5 Web Share integration.',
    tags: ['Next.js', 'TypeScript', 'Firebase', 'Cloudinary', 'Framer Motion'],
    repo: gh('clickv2'),
    accent: '#c9b79c',
    year: '2026',
  },
  {
    name: 'Cultiva',
    blurb:
      'Gamified habit and focus Android app where completing real-world tasks grows a pixel-art farm. Built solo with Flutter, Flame, offline-first SQLite storage, notifications, and an in-app reward economy.',
    tags: ['Flutter', 'Flame', 'Dart', 'SQLite', 'Android'],
    repo: gh('cultiva'),
    accent: '#88b07a',
    year: '2026',
  },
  {
    name: 'Constella',
    blurb: 'An immersive 3D space experience: a galaxy made of human thoughts that you can fly through.',
    tags: ['React', 'Three.js', 'GSAP', 'WebGL'],
    repo: gh('constella'),
    accent: '#8fa4d8',
    year: '2026',
  },
  {
    name: 'CarbonTwin AI',
    blurb:
      'A personal carbon digital twin with a local LLM: tracks emissions, finds trends and simulates ways to cut them.',
    tags: ['Python', 'Streamlit', 'LLM', 'AI'],
    repo: gh('carbontwin-ai'),
    accent: '#a3b86c',
    year: '2026',
  },
  {
    name: 'Career Mirror',
    blurb:
      'AI career intelligence: skill-gap analysis, an ATS resume scorer, a "what if" simulator and a personal learning roadmap.',
    tags: ['AI', 'Prompt Engineering', 'JavaScript'],
    repo: gh('Career-mirror'),
    accent: '#7fb8a4',
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
    name: 'Screen Time Tracker',
    blurb:
      'A Chrome extension that tracks time per site, with daily stats, notifications, site blocking and an analytics dashboard.',
    tags: ['Chrome Extension', 'JavaScript', 'Analytics'],
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

// Certifications from Harshavardhan's verified credentials
export const badges: Badge[] = [
  {
    title: 'Make AI Agents Work for You',
    issuer: 'IBM SkillsBuild',
    color: '#4a72ec',
    year: '2026',
  },
  {
    title: 'Agents and Workflows',
    issuer: 'OpenAI',
    color: '#10a37f',
    year: '2026',
  },
  {
    title: 'AI Fluency: Framework & Foundations',
    issuer: 'AI Fluency',
    color: '#8e44ad',
    year: '2026',
  },
  {
    title: 'Web Development Fundamentals',
    issuer: 'IBM SkillsBuild',
    color: '#e67e22',
    year: '2025',
  },
  {
    title: 'Cybersecurity Fundamentals',
    issuer: 'IBM SkillsBuild',
    color: '#27ae60',
    year: '2025',
  },
]

export const skills: { group: string; items: string[] }[] = [
  {
    group: 'Programming',
    items: ['Python', 'TypeScript', 'JavaScript', 'SQL', 'Dart', 'HTML5 / CSS3'],
  },
  {
    group: 'AI & Automation',
    items: ['Agentic AI', 'Multi-Agent Workflows', 'LangGraph', 'Generative AI', 'Prompt Engineering', 'AI Automation'],
  },
  {
    group: 'Web & Mobile',
    items: ['React', 'Next.js', 'Flutter', 'Flame', 'Framer Motion', 'Three.js', 'Tailwind CSS'],
  },
  {
    group: 'Backend & Database',
    items: ['FastAPI', 'PostgreSQL (Supabase)', 'Firebase / Firestore', 'SQLite', 'REST APIs', 'Node.js'],
  },
  {
    group: 'Tools & DevOps',
    items: ['Git', 'GitHub', 'Figma', 'Cloudinary', 'Telegram API', 'Vercel'],
  },
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
