const fs = require('fs')

const env = process.env.SCHEMA_TAG
  ? process.env
  : fs.existsSync('.env')
  ? Object.fromEntries(
      fs
        .readFileSync('.env', 'utf-8')
        .split('\n')
        .map(v => v.split('='))
    )
  : {}

const tagName =
  env.LOCAL_SCHEMA === 'true'
    ? `local-${require('os').userInfo().username}`
    : `${env.SCHEMA_TAG || 'current'}`

console.log(`load schema version echo@${tagName}`)

module.exports = {
  client: {
    service: {
      name: 'echo',
      tagName,
    },
  },
}
