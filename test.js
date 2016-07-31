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
  t.equal(fs.readFileSync('testdir.tmp/foo.txt', 'UTF8'), 'foo.txt contents')
  t.equal(fs.readFileSync('testdir.tmp/subdir/bar.txt', 'UTF8'), 'bar.txt contents')

  fixturify.writeSync('testdir.tmp', {
    'something': 'foo.txt contents',
    'else': {
      'bar.txt': 'bar.txt contents'
    }
  })

  t.deepEqual(fs.readdirSync('testdir.tmp').sort(), ['else', 'foo.txt', 'something', 'subdir'])
  t.deepEqual(fs.readdirSync('testdir.tmp/subdir').sort(), ['bar.txt'])
  t.deepEqual(fs.readdirSync('testdir.tmp/else').sort(), ['bar.txt'])

  t.equal(fs.readFileSync('testdir.tmp/foo.txt', 'UTF8'), 'foo.txt contents')
  t.equal(fs.readFileSync('testdir.tmp/subdir/bar.txt', 'UTF8'), 'bar.txt contents')
  t.equal(fs.readFileSync('testdir.tmp/else/bar.txt',  'UTF8'), 'bar.txt contents')

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

test('removeSync', function (t) {
  rimraf.sync('testdir.tmp')
  fs.mkdirSync('testdir.tmp')
  fs.writeFileSync('testdir.tmp/foo.txt', 'foo.txt contents')
  fs.mkdirSync('testdir.tmp/subdir')
  fs.writeFileSync('testdir.tmp/subdir/bar.txt', 'bar.txt contents')
  fs.symlinkSync('../foo.txt', 'testdir.tmp/subdir/symlink')

  fixturify.removeSync('testdir.tmp', {
    'subdir': {
      'symlink': 'foo.txt contents'
    }
  })

  t.deepEqual(fs.readdirSync('testdir.tmp').sort(), ['foo.txt', 'subdir'])
  t.deepEqual(fs.readdirSync('testdir.tmp/subdir').sort(), ['bar.txt'])
  t.equal(fs.readFileSync('testdir.tmp/foo.txt', 'UTF8'), 'foo.txt contents')
  t.equal(fs.readFileSync('testdir.tmp/subdir/bar.txt', 'UTF8'), 'bar.txt contents')

  // no way to easily disambiguate between empty directory and removing it \w
  // removeSync. Instead of leaking empty diretories, or forcing multiple
  // removeSync, if a directory becomes empty due to removeSync we also remove this.
  //
  // We could change this, so that empty directories remain, but require
  // multiple removeSync to purge.  Although this approach, appears to be a
  // reasonable balance
  fixturify.removeSync('testdir.tmp', {
    'subdir': {
      'bar.txt': ''
    }
  })

  t.deepEqual(fs.readdirSync('testdir.tmp/').sort(), ['foo.txt'])

  rimraf.sync('testdir.tmp')
  t.end()
})

test('error conditions', function (t) { test('writeSync requires directory to exist, if given non-empty object', function (t) {
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
