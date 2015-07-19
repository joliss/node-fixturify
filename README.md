# node-fixturify

[![Build Status](https://travis-ci.org/joliss/node-fixturify.png?branch=master)](https://travis-ci.org/joliss/node-fixturify)

Convert JSON objects into directory structures on the file system, and back
again. This package is primarily useful for writing tests.

## Installation

```bash
npm install --save-dev fixturify
```

## Usage

```js
var fixturify = require('fixturify')

fs.mkdirSync('testdir')

var obj = {
  'foo.txt': 'foo.txt contents',
  'subdir': {
    'bar.txt': 'bar.txt contents',
    'symlink': ['../foo.txt']
  }
}

fixturify.writeSync('testdir', obj) // write it to disk

fixturify.readSync('testdir') // => deep-equals obj
```

File contents are decoded and encoded with UTF-8.

Symlinks are represented as arrays of length 1. It does not matter whether the
symlink target exists.

## Limitations

To keep the API simple, node-fixturify has the following limitations:

* Reading or setting file stats (last-modified time, permissions, etc.) is
  not supported.

* Special files like FIFOs, sockets, or devices are not supported.

* File contents are automatically encoded/decoded into strings. Binary files
  are not supported.

* Symlinks are represented as arrays of length 1. We do this because symlinks
  are important to support, and arrays, though ugly, are an easy way to
  represent them.

* There currently isn't an option to follow symlinks. This might be worth
  adding.
