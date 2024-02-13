import fsNode from "https://deno.land/std@0.148.0/node/fs.ts";
import path from "https://deno.land/std@0.148.0/node/path.ts";
import ensurePosix from "npm:ensure-posix-path@1.1.1";
import MatcherCollection from "npm:matcher-collection@2.0.1";
import {
  Minimatch, MinimatchOptions,
} from "npm:minimatch@9.0.3";
import { IMinimatch } from "./types.ts";

export function entries(
  baseDir: string,
  inputOptions?: Options | (string | IMinimatch)[],
) {
  const options = handleOptions(inputOptions);

  return _walkSync(ensurePosix(baseDir), options, null, []);
}

export interface Options {
  includeBasePath?: boolean;
  globs?: (string | IMinimatch)[];
  ignore?: (string | IMinimatch)[];
  directories?: boolean;
  fs?: typeof fsNode;
  globOptions?: MinimatchOptions;
}

export class Entry {
  relativePath: string;
  basePath: string;
  mode: number;
  size: number;
  mtime: number;

  constructor(
    relativePath: string,
    basePath: string,
    mode: number,
    size: number,
    mtime: number,
  ) {
    this.relativePath = relativePath;
    this.basePath = basePath;
    this.mode = mode;
    this.size = size;
    this.mtime = mtime;
  }

  get fullPath() {
    return `${this.basePath}/${this.relativePath}`;
  }

  isDirectory() {
    return (this.mode & 61440) === 16384;
  }
}

export function walkSync(
  baseDir: string,
  inputOptions?: Options | (string | IMinimatch)[],
) {
  const options = handleOptions(inputOptions);

  let mapFunct: (arg: Entry) => string;
  if (options.includeBasePath) {
    mapFunct = function (entry: Entry) {
      return (
        entry.basePath.split(path.sep).join("/").replace(/\/+$/, "") +
        "/" +
        entry.relativePath
      );
    };
  } else {
    mapFunct = function (entry: Entry) {
      return entry.relativePath;
    };
  }

  return _walkSync(baseDir, options, null, []).map(mapFunct);
}

function getStat(path: string, fs: Options["fs"] = fsNode) {
  try {
    return fs.statSync(path);
  } catch (error) {
    if (
      error !== null &&
      typeof error === "object" &&
      (error.code === "ENOENT" ||
        error.code === "ENOTDIR" ||
        error.code === "EPERM")
    ) {
      return;
    }
    throw error;
  }
}

function isDefined<T>(val: T | undefined): val is T {
  return typeof val !== "undefined";
}

function handleOptions(
  _options?: Options | (string | IMinimatch)[],
): Options {
  let options: Options = {};

  if (Array.isArray(_options)) {
    options.globs = _options;
  } else if (_options) {
    options = _options;
  }

  return options;
}

function applyGlobOptions(
  globs: (string | IMinimatch)[] | undefined,
  options: MinimatchOptions,
) {
  return globs?.map((glob) => {
    if (typeof glob === "string") {
      return new Minimatch(glob, options);
    }

    return glob;
  });
}

function handleRelativePath(_relativePath: string | null) {
  if (_relativePath == null) {
    return "";
  } else if (_relativePath.slice(-1) !== "/") {
    return _relativePath + "/";
  } else {
    return _relativePath;
  }
}

function lexicographically(a: Entry, b: Entry) {
  const aPath = a.relativePath;
  const bPath = b.relativePath;

  if (aPath === bPath) {
    return 0;
  } else if (aPath < bPath) {
    return -1;
  } else {
    return 1;
  }
}

function _walkSync(
  baseDir: string,
  options: Options,
  _relativePath: string | null,
  visited: string[],
): Entry[] {
  const fs = options.fs ?? fsNode;
  // Inside this function, prefer string concatenation to the slower path.join
  // https://github.com/joyent/node/pull/6929
  const relativePath = handleRelativePath(_relativePath);
  const realPath = fs.realpathSync(baseDir + "/" + relativePath);
  if (visited.indexOf(realPath) >= 0) {
    return [];
  } else {
    visited.push(realPath);
  }

  try {
    const globOptions = options.globOptions;
    const ignorePatterns = isDefined(globOptions)
      ? applyGlobOptions(options.ignore, globOptions)
      : options.ignore;
    const globs = isDefined(globOptions)
      ? applyGlobOptions(options.globs, globOptions)
      : options.globs;
    let globMatcher;
    let ignoreMatcher: undefined | InstanceType<typeof MatcherCollection>;
    let results: Entry[] = [];

    if (ignorePatterns) {
      // @ts-expect-error deno-ts(2345)
      ignoreMatcher = new MatcherCollection(ignorePatterns);
    }

    if (globs) {
      // @ts-expect-error deno-ts(2345)
      globMatcher = new MatcherCollection(globs);
    }

    if (globMatcher && !globMatcher.mayContain(relativePath)) {
      return results;
    }

    const names = fs.readdirSync(baseDir + "/" + relativePath);

    const entries = names
      .map((name) => {
        let entryRelativePath = relativePath + name;

        if (ignoreMatcher && ignoreMatcher.match(entryRelativePath)) {
          return;
        }

        let fullPath = baseDir + "/" + entryRelativePath;
        let stats = getStat(fullPath, fs);

        if (stats && stats.isDirectory()) {
          return new Entry(
            entryRelativePath + "/",
            baseDir,
            stats.mode ? stats.mode : 0,
            stats.size,
            stats.mtime ? stats.mtime.getTime(): 0,
          );
        } else {
          return new Entry(
            entryRelativePath,
            baseDir,
            (stats && stats.mode) || 0,
            (stats && stats.size) || 0,
            (stats && stats.mtime && stats.mtime.getTime()) || 0,
          );
        }
      })
      .filter(isDefined);

    const sortedEntries = entries.sort(lexicographically);

    for (let i = 0; i < sortedEntries.length; ++i) {
      let entry = sortedEntries[i];

      if (entry.isDirectory()) {
        if (
          options.directories !== false &&
          (!globMatcher || globMatcher.match(entry.relativePath))
        ) {
          results.push(entry);
        }

        results = results.concat(
          _walkSync(baseDir, options, entry.relativePath, visited),
        );
      } else {
        if (!globMatcher || globMatcher.match(entry.relativePath)) {
          results.push(entry);
        }
      }
    }

    return results;
  } finally {
    visited.pop();
  }
}
