const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const html = fs.readFileSync(
  path.join(__dirname, '../../public/index.html'),
  'utf-8'
)
const script = html.split('<script>').pop().split('</script>')[0]

const algo = 'sha256'

console.log(`---
${script}
---

hash: ${algo}-${crypto
  .createHash(algo)
  .update(script)
  .digest('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')}`)
