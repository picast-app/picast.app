const crypto = require('crypto')
const paths = require('./paths')
const fs = require('fs')

const HASH_ALGO = 'sha256'

const inlineScripts = () =>
  paths
    .read(paths.build, 'index.html')
    .match(/(?<=<script[^>]*>)[^<].+?(?=<\/script>)/g)

const hashScript = script =>
  crypto.createHash(HASH_ALGO).update(script).digest('base64')

function inlineScriptHashes(csp) {
  const hashes = inlineScripts().map(hashScript)
  if (!hashes.length) throw Error(`couldn't find any inline scripts`)
  const cspHashStr = hashes.map(v => `'${HASH_ALGO}-${v}'`).join(' ')
  const newCSP = csp.replace(/\{\{\s*SCRIPT_HASHES\s*\}\}/i, cspHashStr)
  if (!newCSP.includes(cspHashStr))
    throw Error(`couldn't place csp script hashes`)
  return newCSP
}

const compile = () =>
  paths
    .read(paths.http, 'csp')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/(\s+\w+-src)/g, ';$1')

function writeHeader(csp) {
  const headers = paths.read(paths.build, '_headers')
  if (/Content-Security-Policy/i.test(headers))
    throw Error('_headers already includes csp header')

  const lines = headers.split('\n').filter(Boolean)
  lines.push(
    lines[1].match(/^\s+/) + `Content-Security-Policy: ${csp.trim()}`,
    ''
  )

  fs.writeFileSync(paths.join(paths.build, '_headers'), lines.join('\n'))
}

module.exports = { inlineScriptHashes, compile, writeHeader }
