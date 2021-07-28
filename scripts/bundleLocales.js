const fs = require('fs')
const path = require('path')

const locDir = path.join(__dirname, '../locales/')
const outDir = path.join(__dirname, '../src/i18n/strings')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

const paths = dir =>
  fs
    .readdirSync(dir)
    .map(v => path.join(dir, v))
    .flatMap(v => (fs.statSync(v).isDirectory() ? paths(v) : [v]))

// output: [key, value][]
const parser = {
  json: content =>
    Object.entries(JSON.parse(content)).flatMap(([k, v]) =>
      k !== '__self__'
        ? [[k, v]]
        : !Array.isArray(v)
        ? [[v, v]]
        : v.map(w => [w, w])
    ),
  smap: content =>
    content
      // remove comments
      .replace(/^[#=].*$/gm, '')
      // trim end of line
      .replace(/\s*(?=$)/gm, '')
      // inline multiline
      .replace(/\n\s+/gm, ' ')
      .split('\n')
      .filter(Boolean)
      .map(line => line.split(':').map(v => v.trim()))
      .map(([k, v]) => [k || v, (v || '').replace(/\\s/g, ' ')]),
}

for (const lang of fs.readdirSync(locDir)) {
  if (fs.statSync(path.join(locDir, lang)).isDirectory() && lang !== 'bundled')
    bundleLocale(lang)
}

function bundleLocale(locale) {
  console.log('bundle', locale.toUpperCase())

  const dir = path.join(locDir, locale)
  const strings = {}

  for (const file of paths(dir)) {
    const baseKey = /tokens\.[a-z0-9]+$/.test(file)
      ? ''
      : `@${file
          .slice(dir.length)
          .replace(/^\//, '')
          .replace(/\.[a-z0-9]+$/, '')
          .replace(/\//g, '.')}.`

    for (const [k, v] of parseFile(file)) {
      const key = baseKey + k
      if (key in strings) throw Error(`duplicate key ${key}`)
      strings[key] = v
    }
  }

  fs.writeFileSync(
    path.join(outDir, `${locale}.json`),
    JSON.stringify(sortKeys(strings))
  )
}

function parseFile(file) {
  const ext = file.split('.').pop()
  if (typeof parser[ext] !== 'function') throw Error(`can't parse .${ext} file`)
  return parser[ext](fs.readFileSync(file, 'utf8'))
}

function sortKeys(obj) {
  return Object.fromEntries(
    Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))
  )
}
