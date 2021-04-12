const path = require('path')
const fs = require('fs')

module.exports = {
  http: path.join(__dirname, '../../http'),
  build: path.join(__dirname, '../../build'),
  join: path.join,
  read: (...segs) => fs.readFileSync(path.join(...segs), 'utf-8'),
}
