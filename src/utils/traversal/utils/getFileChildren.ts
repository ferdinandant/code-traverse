export function getFileChildren(state: State, file: string) {
  const { fileToParseResult } = state;
  const { moduleImports } = fileToParseResult[file];
  return Object.keys(moduleImports);
}
