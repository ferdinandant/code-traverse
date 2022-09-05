/**
 * Encoded file and name pair:
 * e.g. 'myVariable@/path/to/file'
 */
type CacheKey = string;

type FileAndNamePair = {
  file: string;
  name: string;
};

let state: State;
let visitedCacheKeys: Set<CacheKey>;
let cacheKeyToRecursiveNames: Record<CacheKey, Set<CacheKey>>;

// ================================================================================
// MAIN
// ================================================================================

export function getRecursiveUsedNames(passedState: State, file: string) {
  // Reset state
  state = passedState;
  visitedCacheKeys = new Set<string>();
  cacheKeyToRecursiveNames = Object.create(null);

  // Traverse
  const recursiveDependencies = getRecursiveDependencies(file, '*');
  return Array.from(recursiveDependencies).map(cacheKey =>
    decodeFromCacheKey(cacheKey)
  );
}

function getRecursiveDependencies(file: string, name: string): Set<CacheKey> {
  // Get from cache
  const cacheKey = encodeToCacheKey({ file, name });
  if (cacheKeyToRecursiveNames[cacheKey]) {
    return cacheKeyToRecursiveNames[cacheKey];
  }
  // Prevent invinite loop
  if (visitedCacheKeys.has(cacheKey)) {
    return new Set<string>();
  }
  visitedCacheKeys.add(cacheKey);

  // Process a single name
  if (name !== '*') {
    const { topLevelDeclarations, exportMap, reexportMap } = state.fileData[
      file
    ];
    if (exportMap[name]) {
      const allRecursiveNames = new Set<string>();
      allRecursiveNames.add(cacheKey);
      // Get which names `name` depends on
      // Store result on `exportNameDependencies`
      const { dependencies: exportNameDeps } = exportMap[name];
      const exportNameDependencies = new Set<string>();
      exportNameDeps.forEach(dependentName => {
        const { recursiveDependencies } = topLevelDeclarations[dependentName];
        // This `dependentName` is used
        exportNameDependencies.add(dependentName);
        // So does all of its dependencies
        recursiveDependencies.forEach(dep => {
          exportNameDependencies.add(dep);
        });
      });
      // Process dependencies of `name`
      exportNameDependencies.forEach(topLevelName => {
        const matchingImport = getMatchingImportForName(file, topLevelName);
        if (matchingImport) {
          // Traverse referenced import
          // We don't mark `topLevelName` as used here
          // (it will be added as used by the children file)
          const { file: importedFile, name: importedName } = matchingImport;
          const recursiveDependencies = getRecursiveDependencies(
            importedFile,
            importedName
          );
          recursiveDependencies.forEach(cacheKey => {
            allRecursiveNames.add(cacheKey);
          });
        } else {
          // Mark the current name as used
          const cacheKey = encodeToCacheKey({ file, name: topLevelName });
          allRecursiveNames.add(cacheKey);
        }
      });
      return (cacheKeyToRecursiveNames[cacheKey] = allRecursiveNames);
    } else if (reexportMap[name]) {
      // Reexport case: just traverse one dependent file
      const { file: childrenFile } = reexportMap[name];
      const allRecursiveNames = getRecursiveDependencies(childrenFile, name);
      cacheKeyToRecursiveNames[cacheKey] = allRecursiveNames;
    } else {
      const ctxStr = JSON.stringify({ file, name }, null, 2);
      throw new Error(`Did not find export name: ${ctxStr}`);
    }
  }

  // Process name of '*'
  // We only need to look at the export names
  // (because a file is only usable from its exported names :s)
  const nonReexportExportNames = getNonReexportExportNames(file);
  const allRecursiveNames = new Set<string>();
  nonReexportExportNames.forEach(exportName => {
    const recursiveName = getRecursiveDependencies(file, exportName);
    recursiveName.forEach(name => {
      allRecursiveNames.add(name);
    });
  });
  return (cacheKeyToRecursiveNames[cacheKey] = allRecursiveNames);
}

// ================================================================================
// HELPERS
// ================================================================================

function getNonReexportExportNames(file: string) {
  const { exportMap } = state.fileData[file];
  // Excludes those that are re-export
  return Object.keys(exportMap).filter(name => {
    return !exportMap[name].isReexport;
  });
}

function getMatchingImportForName(
  file: string,
  localName: string
): FileAndNamePair | null {
  const { moduleImports } = state.fileData[file];
  // Each `name` should only appear once as a local name inside `moduleImports`
  // (can't declare the same local name twice). So we only need to find one entry.
  for (const importFrom in moduleImports) {
    const { importedNameToLocalNames } = moduleImports[importFrom];
    for (const importName in importedNameToLocalNames) {
      const localNames = importedNameToLocalNames[importName];
      if (localNames.includes(localName)) {
        return { file: importFrom, name: importName };
      }
    }
  }
  return null;
}

function encodeToCacheKey(obj: FileAndNamePair) {
  const { file, name } = obj;
  return `${name}@${file}`;
}

function decodeFromCacheKey(cacheKey: string) {
  // Just in case `fileSegments` contains '@'
  const [name, ...fileSegments] = cacheKey.split('@');
  return { name, file: fileSegments.join('@') };
}
