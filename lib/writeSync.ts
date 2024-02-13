import { ensureDirSync } from "https://deno.land/std@0.215.0/fs/ensure_dir.ts";
import { unlinkSync } from "https://deno.land/std@0.148.0/node/fs.ts";

import { DirJSON } from "./types.ts";

export function writeSync(dir: string, obj: DirJSON) {
  if ("string" !== typeof dir || dir === "") {
    throw new TypeError("writeSync first argument must be a non-empty string");
  }

  if ("object" !== typeof obj && obj !== null) {
    throw new TypeError("writeSync second argument must be an object");
  }
  ensureDirSync(dir);

  for (const [entry, value] of Object.entries(obj)) {
    if ("string" !== typeof entry || entry === "") {
      throw new Error("Directory entry must be a non-empty string");
    }
    if (entry === "." || entry === "..") {
      throw new Error('Directory entry must not be "." or ".."');
    }
    if (entry.indexOf("/") !== -1 || entry.indexOf("\\") !== -1) {
      throw new Error('Directory entry must not contain "/" or "\\"');
    }
    const fullPath = `${dir}/${entry}`;
    let stat;

    try {
      stat = Deno.statSync(fullPath);
    } catch {
      stat = undefined;
    }

    if (typeof value === "string") {
      if (stat && stat.isDirectory) {
        Deno.removeSync(fullPath);
      }

      Deno.writeFileSync(fullPath, new TextEncoder().encode(value));
    } else if (typeof value === "object") {
      if (value === null) {
        Deno.removeSync(fullPath);
      } else {
        try {
          if (stat && stat.isFile) {
            unlinkSync(fullPath);
          }
          ensureDirSync(fullPath);
        } catch (e) {
          // if the directory already exists, carry on.
          // This is to support, re-applying (append-only) of fixtures
          if (!(typeof e === "object" && e !== null && e.code === "EEXIST")) {
            throw e;
          }
        }
        writeSync(fullPath, value);
      }
    } else {
      throw new Error(
        `${entry} in ${dir} : Expected string or object, got ${value}`,
      );
    }
  }
}
