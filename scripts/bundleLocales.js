const fs = require('fs')
const path = require('path')

const locDir = path.join(__dirname, '../locales/')
const outDir = path.join(__dirname, '../node_modules/strings')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)

const paths = dir =>
  fs
    .readdirSync(dir)
    .map(v => path.join(dir, v))
    .flatMap(v => (fs.statSync(v).isDirectory() ? paths(v) : [v]))

for (const lang of fs.readdirSync(locDir)) {
  if (fs.statSync(path.join(locDir, lang)).isDirectory() && lang !== 'bundled')
    bundleLocale(lang)
}

function bundleLocale(locale) {
  console.log('bundle', locale.toUpperCase())

  const dir = path.join(locDir, locale)
  const strings = {}

  for (const file of paths(dir)) {
    const baseKey = /tokens\.json/.test(file)
      ? ''
      : `@${file
          .slice(dir.length)
          .replace(/^\//, '')
          .replace(/\.json$/, '')
          .replace(/\//g, '.')}.`

    for (const [k, v] of parseFile(file)) {
      const key = baseKey + k
      if (key in strings) throw Error(`duplicate key ${key}`)
      strings[key] = v
    }
  }

  fs.writeFileSync(path.join(outDir, `${locale}.json`), JSON.stringify(strings))
}

function parseFile(file) {
  const obj = require(file)
  return Object.entries(obj).flatMap(([k, v]) =>
    k !== '__self__'
      ? [[k, v]]
      : !Array.isArray(v)
      ? [[v, v]]
      : v.map(w => [w, w])
  )
}
