import path from 'path';
import { processFile } from './process/processFile';
type Opts = {
  state: State;
  userState: any;
  config: StandardizedConfig;
  // sourceFile: null | string;
  targetFile: string;
};

export async function visitFile({
  state,
  userState,
  config,
  targetFile,
}: Opts) {
  const { debug } = config;
  if (!targetFile.startsWith('/')) {
    throw new Error(`Expects file to be an absolute path: ${targetFile}`);
  }
  if (debug) {
    console.log(`[visit] ${targetFile}`);
  }
  const { fileToIsVisited } = state;
  fileToIsVisited[targetFile] = true;

  // Check if the file needs to be handled
  const { baseDir, extensions, includeRegexes, excludeRegexes } = config;
  const relativeFilePath = path.relative(baseDir, targetFile);
  const shouldHandleFile =
    extensions.some(ext => targetFile.endsWith(ext)) &&
    (!includeRegexes ||
      includeRegexes.some(regex => {
        return relativeFilePath.match(regex);
      })) &&
    (!excludeRegexes ||
      excludeRegexes.every(regex => {
        return !relativeFilePath.match(regex);
      }));
  if (!shouldHandleFile) {
    return;
  }

  // Open file and parse the file
  const { fileToParseResult, fileToParents } = state;
  const resolvedParseResult = await processFile({
    state,
    userState,
    config,
    targetFile,
  });
  fileToParseResult[targetFile] = resolvedParseResult;

  const children = Object.keys(resolvedParseResult.moduleImports);
  for (const childFile of children) {
    // Register parent
    if (!fileToParents[childFile]) {
      fileToParents[childFile] = new Set<string>();
    }
    fileToParents[childFile].add(targetFile);
    // Mark visit
    if (!fileToIsVisited[childFile]) {
      fileToIsVisited[childFile] = true;
      await visitFile({
        state,
        userState,
        config,
        targetFile: childFile,
      });
    }
  }
}
