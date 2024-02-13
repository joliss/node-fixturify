import { DirJSON } from "./main.ts";


export function addFolder(obj: DirJSON, path: string | string[]) {
  const segments = Array.isArray(path) ? path : path.split("/");

  for (const segment of segments) {
    if (segment === "") {
      break;
    }
    const entry = obj[segment];
    if (entry === undefined) {
      obj = obj[segment] = {};
    } else {
      if (typeof entry === "object" && entry !== null) {
        obj = entry;
      } else {
        throw new Error(
          `expected no existing directory entry for '${path}' but got '${entry}'`
        );
      }
    }
  }

  return obj;
}
