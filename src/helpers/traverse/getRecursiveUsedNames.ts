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
  // File is not handled (e.g. doesn't match `config.extensions`)
  // Mark everything of this file as used
  if (!state.fileData[file]) {
    const cacheKey = encodeToCacheKey({ file, name: '*' });
    return new Set<string>([cacheKey]);
  }
  visitedCacheKeys.add(cacheKey);

  // Process a single name
  if (name !== '*') {
    const {
      topLevelDeclarations,
      moduleImports,
      externalImports,
      exportMap,
      reexportMap,
    } = state.fileData[file];
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
      // Process anonymous imports (imports that are only used for side-effect)
      // They don't have local name, so treat it as import from *
      const anonymousImportPaths = [
        ...getAnonymousImports(externalImports),
        ...getAnonymousImports(moduleImports),
      ];
      anonymousImportPaths.forEach(importPath => {
        const recursiveDependencies = getRecursiveDependencies(importPath, '*');
        recursiveDependencies.forEach(cacheKey => {
          allRecursiveNames.add(cacheKey);
        });
      });
      // Process dependencies of `name`
      exportNameDependencies.forEach(topLevelName => {
        processTopLevelName(allRecursiveNames, file, topLevelName);
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
  const allRecursiveNames = new Set<string>();
  const {
    topLevelDeclarations,
    externalImports,
    moduleImports,
  } = state.fileData[file];
  // Look for anonymous imports
  const anonymousImportPaths = [
    ...getAnonymousImports(externalImports),
    ...getAnonymousImports(moduleImports),
  ];
  anonymousImportPaths.forEach(importPath => {
    const recursiveDependencies = getRecursiveDependencies(importPath, '*');
    recursiveDependencies.forEach(cacheKey => {
      allRecursiveNames.add(cacheKey);
    });
  });
  // Look for non re-export local names
  Object.keys(topLevelDeclarations).forEach(topLevelName => {
    processTopLevelName(allRecursiveNames, file, topLevelName);
  });
  return (cacheKeyToRecursiveNames[cacheKey] = allRecursiveNames);
}

// ================================================================================
// HELPERS
// ================================================================================

function processTopLevelName(
  allRecursiveNames: Set<string>,
  file: string,
  topLevelName: string
) {
  const matchingModuleImport = hasMathingImport(
    state.fileData[file].moduleImports,
    topLevelName
  );
  // We don't mark `topLevelName` as used here
  // (it will be added as used by the children file)
  if (matchingModuleImport) {
    const { file: importedFile, name: importedName } = matchingModuleImport;
    const recursiveDependencies = getRecursiveDependencies(
      importedFile,
      importedName
    );
    recursiveDependencies.forEach(cacheKey => {
      allRecursiveNames.add(cacheKey);
    });
    return;
  }
  // Mark the current name as used
  const matchingExternalImport = hasMathingImport(
    state.fileData[file].externalImports,
    topLevelName
  );
  if (matchingExternalImport) {
    const cacheKey = encodeToCacheKey({
      file: matchingExternalImport.file,
      name: matchingExternalImport.name,
    });
    allRecursiveNames.add(cacheKey);
  } else {
    const cacheKey = encodeToCacheKey({ file, name: topLevelName });
    allRecursiveNames.add(cacheKey);
  }
}

function getAnonymousImports(importedRequestMap: ImportedRequestMap) {
  return Object.keys(importedRequestMap).filter(importPath => {
    return importedRequestMap[importPath].hasAnonymousImport;
  });
}

function hasMathingImport(
  importedRequestMap: ImportedRequestMap,
  localName: string
): FileAndNamePair | null {
  // Each `name` should only appear once as a local name inside `moduleImports`
  // (can't declare the same local name twice). So we only need to find one entry.
  for (const importFrom in importedRequestMap) {
    const { importedNameMap } = importedRequestMap[importFrom];
    for (const importName in importedNameMap) {
      const { localNames } = importedNameMap[importName];
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
