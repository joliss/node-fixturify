import { DirJSON } from "./types.ts";

const CONSOLE_LOG = console.log;



test("writeSync remove", function (t: any) {
  rimraf.sync("testdir.tmp");
  fs.mkdirSync("testdir.tmp");
  fs.writeFileSync("testdir.tmp/foo.txt", "foo.txt contents");
  fs.mkdirSync("testdir.tmp/subdir");
  fs.writeFileSync("testdir.tmp/subdir/bar.txt", "bar.txt contents");
  fs.symlinkSync("../foo.txt", "testdir.tmp/subdir/symlink");

  fixturify.writeSync("testdir.tmp", {
    subdir: {
      symlink: null,
    },
  });

  t.deepEqual(fs.readdirSync("testdir.tmp").sort(), ["foo.txt", "subdir"]);
  t.deepEqual(fs.readdirSync("testdir.tmp/subdir").sort(), ["bar.txt"]);
  t.equal(fs.readFileSync("testdir.tmp/foo.txt", "utf8"), "foo.txt contents");
  t.equal(
    fs.readFileSync("testdir.tmp/subdir/bar.txt", "utf8"),
    "bar.txt contents",
  );

  fixturify.writeSync("testdir.tmp", {
    subdir: {
      "bar.txt": null,
    },
  });

  t.deepEqual(fs.readdirSync("testdir.tmp/").sort(), ["foo.txt", "subdir"]);

  fixturify.writeSync("testdir.tmp", {
    subdir: {
      "bar.txt": "hi",
    },
  });

  t.deepEqual(fs.readdirSync("testdir.tmp/").sort(), ["foo.txt", "subdir"]);
  t.equal(fs.readFileSync("testdir.tmp/subdir/bar.txt", "utf8"), "hi");

  fixturify.writeSync("testdir.tmp", {
    subdir: null,
  });
  t.deepEqual(fs.readdirSync("testdir.tmp/").sort(), ["foo.txt"]);

  rimraf.sync("testdir.tmp");
  t.end();
});

test("error conditions", function (t: any) {
  test("writeSync arguments requires specific input", function (t: any) {
    // @ts-ignore
    t.throws(() => fixturify.writeSync());
    // @ts-ignore
    t.throws(() => fixturify.writeSync(null));
    // @ts-ignore
    t.throws(() => fixturify.writeSync(null, null));
    // @ts-ignore
    t.throws(() => fixturify.writeSync(null, {}));
    t.end();
  });

  test("writeSync guards against misuse that could cause data loss", function (t: any) {
    // Test that we guard against usage errors that might cause data loss
    // through fs.removeSync('' + '/' + '') or similar.
    rimraf.sync("testdir.tmp");
    t.throws(() => fixturify.writeSync("", {}), /non-empty string/);
    t.throws(
      () => fixturify.writeSync("testdir.tmp", { "": "contents" }),
      /non-empty string/,
    );
    t.throws(
      () => fixturify.writeSync("testdir.tmp", { ".": {} }),
      /must not be "\." or "\.\."/,
    );
    t.throws(
      () => fixturify.writeSync("testdir.tmp", { "..": {} }),
      /must not be "\." or "\.\."/,
    );
    t.throws(
      () => fixturify.writeSync("testdir.tmp", { "foo/bar": {} }),
      /must not contain "\/" or "\\"/,
    );
    t.throws(
      () => fixturify.writeSync("testdir.tmp", { "foo\\bar": {} }),
      /must not contain "\/" or "\\"/,
    );
    t.end();
  });

  test("writeSync handles overwriting a file and then creating a new file", function (t: any) {
    rimraf.sync("testdir.tmp");
    fs.mkdirSync("testdir.tmp");

    fixturify.writeSync("testdir.tmp", {
      "a.txt": "a.txt content",
      b: {},
    });

    t.deepEqual(fs.readdirSync("testdir.tmp").sort(), ["a.txt", "b"]);

    fixturify.writeSync("testdir.tmp", {
      "a.txt": "a.txt updated",
      c: {},
    });

    t.deepEqual(fs.readdirSync("testdir.tmp").sort(), ["a.txt", "b", "c"]);

    rimraf.sync("testdir.tmp");
    t.end();
  });

  test("readSync throws on broken symlinks", function (t: any) {
    rimraf.sync("testdir.tmp");
    fs.mkdirSync("testdir.tmp");
    fs.symlinkSync("doesnotexist", "testdir.tmp/symlink");
    t.throws(() => fixturify.readSync("testdir.tmp"));
    rimraf.sync("testdir.tmp");
    t.end();
  });

  t.end();
});
