import path from 'path';
import { State, StandardizedConfig, StateWithVisitTmp } from '../../types';
import { getInitFileData } from '../state/getInitFileData';
import { processFile } from './process/processFile';

type Opts = {
  state: State;
  config: StandardizedConfig;
  // sourceFile: null | string;
  targetFile: string;
};

export async function visitFile({ state, config, targetFile }: Opts) {
  const { debug } = config;
  const stateWithTmp = state as StateWithVisitTmp;
  if (!targetFile.startsWith('/')) {
    throw new Error(`Expects file to be an absolute path: ${targetFile}`);
  }
  if (debug) {
    console.log(`[visit] ${targetFile}`);
  }
  const { fileToIsVisited } = stateWithTmp.tmp;
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
  const { fileData } = state;
  const resolvedParseResult = await processFile({
    state,
    config,
    targetFile,
  });
  if (!fileData[targetFile]) {
    fileData[targetFile] = getInitFileData();
  }
  Object.assign(fileData[targetFile], resolvedParseResult);

  const children = Object.keys(resolvedParseResult.moduleImports);
  for (const childFile of children) {
    // Register parent
    fileData[targetFile].parents.add(targetFile);
    // Mark visit
    if (!fileToIsVisited[childFile]) {
      fileToIsVisited[childFile] = true;
      await visitFile({
        state,
        config,
        targetFile: childFile,
      });
    }
  }
}
