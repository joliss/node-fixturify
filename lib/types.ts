import { Minimatch } from "npm:minimatch@9.0.3";

export type IMinimatch = typeof Minimatch;

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
}

export interface Options {
  include?: (IMinimatch | string)[];
  exclude?: (IMinimatch | string)[];
  ignoreEmptyDirs?: boolean;

  globs?: (string | IMinimatch)[];
  ignore?: (string | IMinimatch)[];
  includeDirs?: boolean;
}
