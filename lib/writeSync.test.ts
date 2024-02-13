import fs from "https://deno.land/std@0.148.0/node/fs.ts";
import { DirJSON } from "./types.ts";
import { writeSync } from "./writeSync.ts";
import { assertEquals } from "https://deno.land/std@0.215.0/assert/mod.ts";

async function removeTestDir() {
  try {
    await Deno.remove("testdir.tmp", { recursive: true });
  } catch {}
}

Deno.test("writeSync", async () => {
  await removeTestDir();
  
  const dir: DirJSON = {
    "foo.txt": "foo.txt contents",
    subdir: {
      "bar.txt": "bar.txt contents",
    },
  };

  writeSync("testdir.tmp", dir);

  assertEquals(fs.readdirSync("testdir.tmp").sort(), ["foo.txt", "subdir"]);
  assertEquals(fs.readdirSync("testdir.tmp/subdir").sort(), ["bar.txt"]);
  assertEquals(
    fs.readFileSync("testdir.tmp/foo.txt", "utf8"),
    "foo.txt contents",
  );
  assertEquals(
    fs.readFileSync("testdir.tmp/subdir/bar.txt", "utf8"),
    "bar.txt contents",
  );

  writeSync("testdir.tmp", {
    something: "foo.txt contents",
    else: {
      "bar.txt": "bar.txt contents",
    },
  });

  assertEquals(fs.readdirSync("testdir.tmp").sort(), [
    "else",
    "foo.txt",
    "something",
    "subdir",
  ]);
  assertEquals(fs.readdirSync("testdir.tmp/subdir").sort(), ["bar.txt"]);
  assertEquals(fs.readdirSync("testdir.tmp/else").sort(), ["bar.txt"]);

  assertEquals(
    fs.readFileSync("testdir.tmp/foo.txt", "utf8"),
    "foo.txt contents",
  );
  assertEquals(
    fs.readFileSync("testdir.tmp/subdir/bar.txt", "utf8"),
    "bar.txt contents",
  );
  assertEquals(
    fs.readFileSync("testdir.tmp/else/bar.txt", "utf8"),
    "bar.txt contents",
  );

  writeSync("testdir.tmp", {
    else: "else is now a file",
  });

  assertEquals(
    fs.readFileSync("testdir.tmp/else", "utf8"),
    "else is now a file",
  );
  writeSync("testdir.tmp", {
    "empty-dir": {},
  });

  assertEquals(fs.readdirSync("testdir.tmp/empty-dir").sort(), []);
});
