import path = require('path');
import fs = require('fs-extra');
import MatcherCollection = require('matcher-collection');
import { IMinimatch } from 'minimatch';

namespace fixturify {
  export interface DirJSON {
    [filename: string]: DirJSON | string | null;
  };

  export interface Options {
    include?: (IMinimatch | string)[];
    exclude?: (IMinimatch | string)[];
    ignoreEmptyDirs?: boolean;
  }

  export function readSync(dir: string, options: Options = {}, relativeRoot= '') : DirJSON {
    const include = options.include;
    const exclude = options.exclude;
    const ignoreEmptyDirs = options.ignoreEmptyDirs;

    let includeMatcher;
    let excludeMatcher;

    if (include) {
      includeMatcher = new MatcherCollection(include);
    }
    if (exclude) {
      excludeMatcher = new MatcherCollection(exclude);
    }

    const obj: DirJSON = {};
    const entries = fs.readdirSync(dir).sort();
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const relativePath = path.join(relativeRoot, entry);

      if (includeMatcher && !includeMatcher.match(relativePath)) {
        continue;
      }

      if (excludeMatcher && excludeMatcher.match(relativePath)) {
        continue;
      }

      const fullPath = path.join(dir, entry);
      const stats = fs.statSync(fullPath); // stat, unlike lstat, follows symlinks
      if (stats.isFile()) {
        obj[entry] = fs.readFileSync(fullPath, { encoding: 'utf8' });
      } else if (stats.isDirectory()) {
        obj[entry] = readSync(fullPath, options, relativePath);

        if (ignoreEmptyDirs && !Object.keys(obj[entry] as DirJSON).length) {
          delete obj[entry];
        }
      } else {
        throw new Error(`Stat'ed ${fullPath} but it is neither file, symlink, nor directory`);
      }
    }
    return obj;
  }

  export function writeSync(dir: string, obj: DirJSON) {
    fs.mkdirpSync(dir);

    if ('string' !== typeof dir || dir === '') {
      throw new TypeError('writeSync first argument must be a non-empty string');
    }

    if ('object' !== typeof obj && obj !== null) {
      throw new TypeError('writeSync second argument must be an object');
    }

    for (let entry in obj) {
      if (obj.hasOwnProperty(entry)) {
        if ('string' !== typeof entry || entry === '') {
          throw new Error('Directory entry must be a non-empty string');
        }
        if (entry === '.' || entry === '..') {
          throw new Error('Directory entry must not be "." or ".."');
        }
        if (entry.indexOf('/') !== -1 || entry.indexOf('\\') !== -1) {
          throw new Error('Directory entry must not contain "/" or "\\"');
        }
        const fullPath =`${dir}/${entry}`;
        const value = obj[entry];
        let stat;

        try {
          stat = fs.statSync(fullPath);
        } catch (e) {
          stat = undefined;
        }

        if (typeof value === 'string') {
          if (stat && stat.isDirectory()) {
            fs.removeSync(fullPath);
          }

          fs.writeFileSync(fullPath, value, 'UTF8');
        } else if (typeof value === 'object') {
          if (value === null) {
            fs.removeSync(fullPath);
          } else {
            try {
              if (stat && stat.isFile()) {
                fs.unlinkSync(fullPath);
              }
              fs.mkdirSync(fullPath);
            } catch (e) {
              // if the directory already exists, carry on.
              // This is to support, re-appling (append-only) of fixtures
              if (!(typeof e === 'object' && e !== null && e.code === 'EEXIST')) {
                throw e;
              }
            }
            writeSync(fullPath, value);
          }
        } else {
          throw new Error(`${entry} in ${dir} : Expected string or object, got ${value}`);
        }
      }
    }
  }
}

export = fixturify;
