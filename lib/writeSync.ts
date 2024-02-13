import fs from "https://deno.land/std@0.148.0/node/fs.ts";
import { DirJSON } from "./types.ts";

export function writeSync(dir: string, obj: DirJSON) {
  if ("string" !== typeof dir || dir === "") {
    throw new TypeError("writeSync first argument must be a non-empty string");
  }

  if ("object" !== typeof obj && obj !== null) {
    throw new TypeError("writeSync second argument must be an object");
  }
  fs.mkdirSync(dir, { recursive: true });

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
      stat = fs.statSync(fullPath);
    } catch (e) {
      stat = undefined;
    }

    if (typeof value === "string") {
      if (stat && stat.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true });
      }

      fs.writeFileSync(fullPath, value, "utf8");
    } else if (typeof value === "object") {
      if (value === null) {
        fs.rmSync(fullPath, { recursive: true });
      } else {
        try {
          if (stat && stat.isFile()) {
            fs.unlinkSync(fullPath);
          }
          fs.mkdirSync(fullPath);
        } catch (e) {
          // if the directory already exists, carry on.
          // This is to support, re-applying (append-only) of fixtures
          if (
            !(
              typeof e === "object" &&
              e !== null &&
              (e as any).code === "EEXIST"
            )
          ) {
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
