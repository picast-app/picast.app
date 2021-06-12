const fs = require('fs')
const path = require('path')

const typeDir = path.join(__dirname, '../types/gql')

let schema = fs.readFileSync(`${typeDir}/schema.ts`, 'utf-8')

schema
  .match(/export\s(?:type|enum)\s\w+/g)
  .map(v => v.split(' ').pop())
  .forEach(file => {
    if (fs.existsSync(`${typeDir}/${file}.ts`))
      fs.unlinkSync(`${typeDir}/${file}.ts`)
  })
;(schema.match(/enum[^}]+\}/gs) || [])
  .map(v => [
    v.match(/enum\s(\w+)/)[1],
    v.match(/(?<=\s*')([^']+)/g).filter((_, i) => !(i % 2)),
    v,
  ])
  .forEach(([name, values, match]) => {
    schema = schema.replace(
      match,
      `type ${name} = ${values.map(v => `'${v}'`).join(' | ')}`
    )
  })

fs.writeFileSync(`${typeDir}/schema.ts`, schema)

const types = fs
  .readdirSync(typeDir)
  .filter(v => !/globalTypes/.test(v) && /\.ts$/.test(v))
  .flatMap(v =>
    (
      fs
        .readFileSync(path.join(typeDir, v), 'utf-8')
        .match(/export\s(type|interface)\s\w+(?=\s*=?(\{|extends}))/g) || []
    )
      .map(v => v.split(' ').pop())
      .map(t => `${t}: import('./${v.replace(/\.ts$/, '')}').${t}`)
  )

fs.writeFileSync(
  `${typeDir}/index.ts`,
  `${fs
    .readdirSync(typeDir)
    .filter(v => !/globalTypes/.test(v) && /\.ts$/.test(v))
    .map(file => `export * from './${file.split('.').slice(0, -1).join('.')}'`)
    .join('\n')}
    
type Collective = {${types.join('\n')}}
export default Collective`
)
