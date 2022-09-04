export function getInitFileData(): FileStateData {
  return {
    // --- traversal ---
    parents: new Set<string>(),
    // --- parse ---
    topLevelDeclarations: Object.create(null),
    externalImports: Object.create(null),
    moduleImports: Object.create(null),
    exportMap: Object.create(null),
    // --- cycle ---
    isInCycle: false,
    cycleRootId: -1,
  };
}
