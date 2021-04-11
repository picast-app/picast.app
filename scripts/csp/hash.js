const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const buildDir = path.join(__dirname, '../../build')

const html = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf-8')

const scripts = html.match(/(?<=<script[^>]*>)[^<].+?(?=<\/script>)/g)

console.log(`${scripts.length} scripts found\n`)

const algo = 'sha256'
const hashes = scripts.map(script =>
  crypto.createHash(algo).update(script).digest('base64')
)

hashes.forEach((v, i) => console.log(`[${i}]: ${v}`))

let headers = fs.readFileSync(path.join(buildDir, '_headers'), 'utf-8')
headers = headers.replace(
  /\{\{\s*SCRIPT_HASHES\s*\}\}/i,
  hashes.map(v => `'${algo}-${v}'`).join(' ')
)

console.log(`\nbuild/_headers:\n\n${headers}\n`)
fs.writeFileSync(path.join(buildDir, '_headers'), headers)
