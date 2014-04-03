var fs = require('fs')

exports.readSync = readSync
function readSync (dir) {
  var obj = {}
  var entries = fs.readdirSync(dir).sort()
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i]
    var fullPath = dir + '/' + entry
    var stats = fs.lstatSync(fullPath)
    if (stats.isFile()) {
      obj[entry] = fs.readFileSync(fullPath, { encoding: 'utf8' })
    } else if (stats.isSymbolicLink()) {
      obj[entry] = [fs.readlinkSync(fullPath)]
    } else if (stats.isDirectory()) {
      obj[entry] = readSync(fullPath)
    } else {
      throw new Error('Stat\'ed ' + fullPath + ' but it is neither file, symlink, nor directory')
    }
  }
  return obj
}

exports.writeSync = writeSync
function writeSync (dir, obj) {
  for (var entry in obj) {
    if (obj.hasOwnProperty(entry)) {
      var fullPath = dir + '/' + entry
      var value = obj[entry]
      if (typeof value === 'string') {
        fs.writeFileSync(fullPath, value, { encoding: 'utf8' })
      } else if (Array.isArray(value)) {
        if (value.length !== 1) throw new Error(entry + ' in ' + dir + ': Expected array to have length 1, got ' + value)
        // symlinkSync supports a third "type" argument on Windows: 'dir',
        // 'file' (default), or 'junction'; I am confused about this
        fs.symlinkSync(value[0], fullPath)
      } else if (typeof value === 'object') {
        fs.mkdirSync(fullPath)
        writeSync(fullPath, value)
      } else {
        throw new Error(entry + ' in ' + dir + ': Expected string, array, or object, got ' + value)
      }
    }
  }
}
