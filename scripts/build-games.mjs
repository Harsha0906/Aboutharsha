// Pulls Harsha's web games from their own GitHub repos and drops a playable copy
// into public/play/<slug>/ so the Playground can run them inside the portfolio.
// Runs in CI before `vite build`; run locally with `npm run games`.
import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const CACHE = join(ROOT, '.games-cache')
const OUT = join(ROOT, 'public', 'play')

const GAMES = [
  { slug: 'dunes', repo: 'DUNE-', kind: 'vite' },
  { slug: 'tiny-planets', repo: 'TINY-PLANETS', kind: 'static', exclude: ['README.md', 'netlify.toml', '.git'] },
  { slug: 'cybervillage', repo: 'CyberVillage-', kind: 'static', exclude: ['.git', 'CyberQuest_Design_Doc.md', 'cyberquest.code-workspace'] },
  { slug: 'cyberco', repo: 'CyberCo', kind: 'vite' },
  { slug: 'neotype', repo: 'neotype', kind: 'static', exclude: ['.git'] },
]

const sh = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit' })

// Rewrite root-absolute paths ("/assets/x") to relative ones so a game works under /play/<slug>/.
function relativize(dir, exts) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (name === 'node_modules' || name === '.git') continue
    if (statSync(p).isDirectory()) relativize(p, exts)
    else if (exts.some((e) => name.endsWith(e))) {
      const src = readFileSync(p, 'utf8')
      const out = src
        .replace(/(["'(])\/(assets|src|vendor|style\.css|og\.png|music|images|sounds|audio)\b/g, '$1./$2')
      if (out !== src) writeFileSync(p, out)
    }
  }
}

mkdirSync(CACHE, { recursive: true })
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

for (const g of GAMES) {
  const dir = join(CACHE, g.slug)
  console.log(`\n▶ ${g.slug} (${g.repo})`)
  try {
    rmSync(dir, { recursive: true, force: true })
    sh(`git clone --depth 1 https://github.com/Harsha0906/${g.repo}.git ${dir}`)
    if (g.kind === 'vite') {
      relativize(join(dir, 'src'), ['.ts', '.tsx', '.js', '.jsx'])
      sh('npm ci --no-audit --no-fund', dir)
      sh(`npx vite build --base ./ --outDir ${join(OUT, g.slug)} --emptyOutDir`, dir)
    } else {
      relativize(dir, ['.html', '.js', '.css'])
      cpSync(dir, join(OUT, g.slug), {
        recursive: true,
        filter: (src) => !g.exclude.some((x) => src.endsWith('/' + x)),
      })
    }
    console.log(`✓ ${g.slug}`)
  } catch (e) {
    // A broken game should never break the portfolio build; its card falls back to the source link.
    console.warn(`✗ ${g.slug} skipped: ${e.message}`)
    rmSync(join(OUT, g.slug), { recursive: true, force: true })
  }
}

const built = GAMES.filter((g) => existsSync(join(OUT, g.slug, 'index.html'))).map((g) => g.slug)
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify({ built }, null, 2))
console.log(`\nPlayable: ${built.join(', ') || 'none'}`)
