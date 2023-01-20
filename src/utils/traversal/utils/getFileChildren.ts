import { State } from '../../../types';

export function getFileChildren(state: State, file: string) {
  // Some files may not be defined inside `state.fileData[file]`
  // (e.g. those that were imported from, but not processed
  // because they don't match `config.extensions`)
  if (state.fileData[file]) {
    return [];
  }
  const { moduleImports } = state.fileData[file];
  return Object.keys(moduleImports);
}
