import { DirJSON } from "./types.ts";
import { addFolder } from "./addFolder.ts";

export function addFile(obj: DirJSON, path: string, content: string) {
  const segments = path.split("/");
  const file = segments.pop();

  if (typeof file !== "string") {
    throw new Error(`invalid file path: '${path}'`);
  }

  addFolder(obj, segments)[file] = content;
}
