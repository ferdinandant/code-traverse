export function getFileChildren(state: State, file: string) {
  const { moduleImports } = state.fileData[file];
  return Object.keys(moduleImports);
}
