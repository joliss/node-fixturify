import { readFileSync } from "https://deno.land/std@0.148.0/node/fs.ts";
import { join } from "https://deno.land/std@0.148.0/node/path.ts";
import {
  WalkOptions,
  walkSync,
} from "https://deno.land/std@0.215.0/fs/walk.ts";
import { addFile } from "./addFile.ts";
import { addFolder } from "./addFolder.ts";
import { DirJSON, Options } from "./types.ts";

// merge walkSync.Options + Options for now

export function readSync(
  dir: string,
  options: Options = {},
  _relativeRoot = ""
): DirJSON {
  if ("include" in options) {
    if ("globs" in options) {
      throw new TypeError(
        "fixturify.readSync does not support both options.include and options.globs, please only use options.globs."
      );
    }
    console.log(
      "fixturify.readSync no longer supports options.include, please use options.globs instead."
    );
    options.globs = options.include;
  }

  if ("exclude" in options) {
    if ("ignore" in options) {
      throw new TypeError(
        "fixturify.readSync does not support both options.exclude and options.ignore, please only use options.ignore."
      );
    }
    console.log(
      "fixturify.readSync no longer supports options.exclude, please use options.ignore instead."
    );
    options.ignore = options.exclude;
  }

  const ignoreEmptyDirs = options.ignoreEmptyDirs;

  const obj: DirJSON = {};
  const entriesOptions: WalkOptions = {
    ...options,
    includeDirs: !ignoreEmptyDirs,
  };
  for (const entry of walkSync(dir, entriesOptions)) {
    if (entry.isDirectory === false) {
      addFile(
        obj,
        entry.name,
        readFileSync(join(dir, entry.name), "utf8")
      );
    } else {
      addFolder(obj, entry.name);
    }
  }

  return obj;
}
