import fs = require('fs-extra');
import { IMinimatch } from 'minimatch';
import walkSync from 'walk-sync';

namespace fixturify {
  /**
   A recursive JSON representation of a directory. This representation includes
   both files, their contents and directories which can contain both files and
   directories.

   ```ts
    const files : DirJSON = {
      'index.js': 'content',
      'foo.txt': 'content',
      'folder': {
        'index.js': 'content',
        'apple.js': 'content',
        'other-folder': { }
      },
    }
    ```
 */
  export interface DirJSON {
    [filename: string]: DirJSON | string | null;
  };

  export interface Options {
    include?: (IMinimatch | string)[];
    exclude?: (IMinimatch | string)[];
    ignoreEmptyDirs?: boolean,

    globs?: (string|IMinimatch)[],
    ignore?: (string|IMinimatch)[],
    directories?: boolean
  }

  // merge walkSync.Options + Options for now
  export function readSync(dir: string, options: Options = {}, _relativeRoot= '') : DirJSON {
    if ('include' in options) {
      if ('globs' in options) {
        throw new TypeError('fixturify.readSync does not support both options.include and options.globs, please only use options.globs.')
      }
      console.log('fixturify.readSync no longer supports options.include, please use options.globs instead.')
      options.globs = options.include;
    }


    if ('exclude' in options) {
      if ('ignore' in options) {
        throw new TypeError('fixturify.readSync does not support both options.exclude and options.ignore, please only use options.ignore.')
      }
      console.log('fixturify.readSync no longer supports options.exclude, please use options.ignore instead.')
      options.ignore = options.exclude;
    }

    const ignoreEmptyDirs = options.ignoreEmptyDirs;

    const obj: DirJSON = {};
    for (const entry of walkSync.entries(dir, {...options, directories:  !ignoreEmptyDirs})) {
      if (entry.isDirectory() === false) {
        addFile(obj, entry.relativePath, fs.readFileSync(entry.fullPath, 'UTF8'));
      } else {
        addFolder(obj, entry.relativePath);
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
              // This is to support, re-applying (append-only) of fixtures
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

function addFile(obj: fixturify.DirJSON, path: string, content: string) {
  const segments = path.split('/');
  const file = segments.pop();

  if (typeof file !== 'string') {
    throw new Error(`invalid file path: '${path}'`);
  }

   addFolder(obj, segments)[file] = content;
}

function addFolder(obj: fixturify.DirJSON, path: string | string[]) {
  const segments = Array.isArray(path) ? path : path.split('/');

  for (const segment of segments) {
    if (segment === '') {
      break;
    }
    const entry = obj[segment];
    if (entry === undefined) {
      obj = obj[segment] = {};
    } else {
      if (typeof entry === 'object' && entry !== null) {
        obj = entry;
      } else {
        throw new Error(`expected no existing directory entry for '${path}' but got '${entry}'`);
      }
    }
  }

  return obj;
}

export = fixturify;
