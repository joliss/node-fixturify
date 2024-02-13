import fs from "node:fs";
import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.215.0/assert/mod.ts";
import { removeTestDir } from "../test_helpers.ts";
import { readSync } from "./readSync.ts";

const CONSOLE_LOG = console.log;

Deno.test("readSync", async () => {
  await removeTestDir();

  fs.mkdirSync("testdir.tmp");
  fs.writeFileSync("testdir.tmp/foo.txt", "foo.txt contents");
  fs.mkdirSync("testdir.tmp/subdir");
  fs.writeFileSync("testdir.tmp/subdir/bar.txt", "bar.txt contents");
  fs.symlinkSync("../foo.txt", "testdir.tmp/subdir/symlink");

  const result = readSync("testdir.tmp");

  // console.log( { result })

  assertEquals(result, {
    "foo.txt": "foo.txt contents",
    subdir: {
      "bar.txt": "bar.txt contents",
      symlink: "foo.txt contents",
    },
  });
});

Deno.test("readSync include", async () => {
  await removeTestDir();

  fs.mkdirSync("testdir.tmp");
  fs.writeFileSync("testdir.tmp/foo.txt", "foo.txt contents");
  fs.mkdirSync("testdir.tmp/subdir");
  fs.writeFileSync("testdir.tmp/subdir/bar.txt", "bar.txt contents");
  fs.symlinkSync("../foo.txt", "testdir.tmp/subdir/symlink");

  try {
    const LOGS: unknown[] = [];
    console.log = (...args: unknown[]) => LOGS.push(args);
    assertEquals(
      readSync("testdir.tmp", {
        globs: ["foo*"],
      }),
      {
        "foo.txt": "foo.txt contents",
      },
    );

    assertEquals(LOGS, []);

    assertEquals(
      readSync("testdir.tmp", {
        include: ["foo*"],
      }),
      {
        "foo.txt": "foo.txt contents",
      },
    );
    assertEquals(LOGS, [
      [
        "fixturify.readSync no longer supports options.include, please use options.globs instead.",
      ],
    ]);
  } finally {
    console.log = CONSOLE_LOG;
  }
});

Deno.test("readSync ignore", async () => {
  await removeTestDir();

  fs.mkdirSync("testdir.tmp");
  fs.writeFileSync("testdir.tmp/foo.txt", "foo.txt contents");
  fs.mkdirSync("testdir.tmp/subdir");
  fs.writeFileSync("testdir.tmp/subdir/bar.txt", "bar.txt contents");
  fs.symlinkSync("../foo.txt", "testdir.tmp/subdir/symlink");

  try {
    const LOGS: unknown[] = [];
    console.log = (...args: unknown[]) => LOGS.push(args);

    assertEquals(
      readSync("testdir.tmp", {
        ignore: ["subdir/bar*"],
      }),
      {
        "foo.txt": "foo.txt contents",
        subdir: {
          symlink: "foo.txt contents",
        },
      },
    );

    assertEquals(LOGS, []);
    assertEquals(
      readSync("testdir.tmp", {
        exclude: ["subdir/bar*"],
      }),
      {
        "foo.txt": "foo.txt contents",
        subdir: {
          symlink: "foo.txt contents",
        },
      },
    );

    assertEquals(LOGS, [
      [
        "fixturify.readSync no longer supports options.exclude, please use options.ignore instead.",
      ],
    ]);
  } finally {
    console.log = CONSOLE_LOG;
  }
});

Deno.test("readSync ignoreEmptyDirs false", async () => {
  await removeTestDir();

  fs.mkdirSync("testdir.tmp");
  fs.mkdirSync("testdir.tmp/emptydir");

  assertEquals(readSync("testdir.tmp"), {
    emptydir: {},
  });
});

Deno.test("readSync ignoreEmptyDirs true", async () => {
  await removeTestDir();

  fs.mkdirSync("testdir.tmp");
  fs.mkdirSync("testdir.tmp/emptydir");

  assertEquals(
    readSync("testdir.tmp", {
      ignoreEmptyDirs: true,
    }),
    {},
  );
});

Deno.test("readSync throws on broken symlinks", async () => {
  await removeTestDir();

  fs.mkdirSync("testdir.tmp");
  fs.symlinkSync("doesnotexist", "testdir.tmp/symlink");

  assertThrows(() => readSync("testdir.tmp"));
});
