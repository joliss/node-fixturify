# fixturify

Deno-compatible fork of
[node-fixturify](https://github.com/joliss/node-fixturify)

Convert JSON objects into directory structures on the file system, and back
again. This package is primarily useful for writing tests.

## Usage

```js
import { readSync, writeSync } from "https://deno.land/x/fixturify";

const obj = {
  "foo.txt": "foo.txt contents",
  "subdir": {
    "bar.txt": "bar.txt contents",
  },
};

writeSync("testdir", obj); // write it to disk

readSync("testdir"); // => deep-equals obj

readSync("testdir", { globs: ["foo*"] }); // glob support
// => { foo.txt: 'foo.text contents' }

readSync("testdir", { ignore: ["foo*"] }); // glob support
// => { subdir: { bar.txt: 'bar.text contents' } }

writeSync("testDir", {
  "subdir": { "bar.txt": null },
}); // remove subdir/bar.txt

readSync("testdir"); // => { foo.txt: 'foo.text contents' }

writeSync("testDir", {
  "subdir": null,
}); // remove subdir/
```

```js
import { readSync, writeSync } from "https://deno.land/x/fixturify";

const obj = {
  "subdir": {
    "foo.txt": "foo.txt contents",
  },
  "emptydir": {},
};

writeSync("testdir", obj); // write it to disk

readSync("testdir", { ignoreEmptyDirs: true });
// => { subdir: { foo.txt': 'foo.txt contents' } }
```

File contents are decoded and encoded with UTF-8.

`readSync` follows symlinks. It throws an error if it encounters a broken
symlink.

## Limitations

To keep the API simple, node-fixturify has the following limitations:

- Reading or setting file stats (last-modified time, permissions, etc.) is not
  supported.

- Creating symlinks is not supported. Symlinks are traversed when reading.
  Broken symlinks throw.

- Special files like FIFOs, sockets, or devices are not supported.

- File contents are automatically encoded/decoded into strings. Binary files are
  not supported.
