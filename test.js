var fs = require('fs')
var test = require('tap').test
var rimraf = require('rimraf')

var fixturify = require('./')


test('writeSync', function (t) {
  rimraf.sync('testdir.tmp')
  fs.mkdirSync('testdir.tmp')
  fixturify.writeSync('testdir.tmp', {
    'foo.txt': 'foo.txt contents',
      'subdir': {
        'bar.txt': 'bar.txt contents'
      }
    })

  t.deepEqual(fs.readdirSync('testdir.tmp').sort(), ['foo.txt', 'subdir'])
  t.deepEqual(fs.readdirSync('testdir.tmp/subdir').sort(), ['bar.txt'])
  t.equal(fs.readFileSync('testdir.tmp/foo.txt', { encoding: 'utf8' }), 'foo.txt contents')
  t.equal(fs.readFileSync('testdir.tmp/subdir/bar.txt', { encoding: 'utf8' }), 'bar.txt contents')

  rimraf.sync('testdir.tmp')
  t.end()
})

test('readSync', function (t) {
  rimraf.sync('testdir.tmp')
  fs.mkdirSync('testdir.tmp')
  fs.writeFileSync('testdir.tmp/foo.txt', 'foo.txt contents')
  fs.mkdirSync('testdir.tmp/subdir')
  fs.writeFileSync('testdir.tmp/subdir/bar.txt', 'bar.txt contents')
  fs.symlinkSync('../foo.txt', 'testdir.tmp/subdir/symlink')

  t.deepEqual(fixturify.readSync('testdir.tmp'), {
    'foo.txt': 'foo.txt contents',
      'subdir': {
        'bar.txt': 'bar.txt contents',
        'symlink': 'foo.txt contents'
      }
    })

  rimraf.sync('testdir.tmp')
  t.end()
})

test('error conditions', function (t) {
  test('writeSync requires directory to exist, if given non-empty object', function (t) {
    t.throws(function () {
      fixturify.writeSync('doesnotexist', { 'foo.txt': 'contents' })
    })
    t.end()
  })

  test('readSync requires directory to exist', function (t) {
    t.throws(function () {
      fixturify.readSync('doesnotexist')
    })
    t.end()
  })

  test('readSync throws on broken symlinks', function(t) {
    rimraf.sync('testdir.tmp')
    fs.mkdirSync('testdir.tmp')
    fs.symlinkSync('doesnotexist', 'testdir.tmp/symlink')
    t.throws(function() {
      fixturify.readSync('testdir.tmp')
    })
    rimraf.sync('testdir.tmp')
    t.end()
  })

  t.end()
})
