import { Options, DirJSON } from "./types.ts";
import { addFolder } from "./addFolder.ts";
import { addFile } from "./addFile.ts";

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
  const entriesOptions: walkSync.Options = {
    ...options,
    directories: !ignoreEmptyDirs,
  };
  for (const entry of walkSync.entries(dir, entriesOptions)) {
    if (entry.isDirectory() === false) {
      addFile(
        obj,
        entry.relativePath,
        fs.readFileSync(entry.fullPath, "utf8")
      );
    } else {
      addFolder(obj, entry.relativePath);
    }
  }

  return obj;
}
