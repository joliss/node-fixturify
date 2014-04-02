var fs = require('fs')
var test = require('tap').test
var rimraf = require('rimraf')

var fixturify = require('./')


var obj = {
  'foo.txt': 'foo.txt contents',
  'subdir': {
    'bar.txt': 'bar.txt contents',
    'symlink': ['../foo.txt']
  }
}

test('writeSync', function (t) {
  fs.mkdirSync('testdir1.tmp')
  fixturify.writeSync('testdir1.tmp', obj)
  t.deepEqual(fs.readdirSync('testdir1.tmp').sort(), ['foo.txt', 'subdir'])
  t.deepEqual(fs.readdirSync('testdir1.tmp/subdir').sort(), ['bar.txt', 'symlink'])
  t.equal(fs.readFileSync('testdir1.tmp/foo.txt', { encoding: 'utf8' }), 'foo.txt contents')
  t.equal(fs.readFileSync('testdir1.tmp/subdir/bar.txt', { encoding: 'utf8' }), 'bar.txt contents')
  t.equal(fs.readlinkSync('testdir1.tmp/subdir/symlink'), '../foo.txt')
  rimraf.sync('testdir1.tmp')
  t.end()
})

test('readSync', function (t) {
  fs.mkdirSync('testdir2.tmp')
  // We'll be lazy and re-use the writeSync method to set up our fixture,
  // since we tested it above
  fixturify.writeSync('testdir2.tmp', obj)
  var newObj = fixturify.readSync('testdir2.tmp')
  t.deepEqual(newObj, obj)
  rimraf.sync('testdir2.tmp')
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

  t.end()
})
