import { getNodeByPath, parseJsonPath } from "@/lib/jsonPath";

export function getValueByPath(root: unknown, path: string): unknown {
  const tokens = parseJsonPath(path);
  return getNodeByPath(root, tokens);
}
