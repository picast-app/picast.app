const fs = require('fs')
const csp = require('./csp')
const paths = require('./paths')

function moveFiles() {
  const files = fs.readdirSync(paths.http)
  for (const file of files)
    if (/^_/.test(file))
      fs.copyFileSync(
        paths.join(paths.http, file),
        paths.join(paths.build, file)
      )
}

moveFiles()
csp.writeHeader(csp.inlineScriptHashes(csp.compile()))
