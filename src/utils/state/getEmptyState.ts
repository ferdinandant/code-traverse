export function getEmptyState(overrides: any = {}): State {
  const baseState: State = {
    // --- resolve ---
    packageNameToBasePath: Object.create(null),
    externals: new Set<string>(),
    // --- file states ---
    fileToIsVisited: Object.create(null),
    fileToParseResult: Object.create(null),
    fileToRecursiveExternalDependencies: Object.create(null),
    fileToRecursiveDependencies: Object.create(null),
    fileToParents: Object.create(null),
    // --- cycle data ---
    fileToId: Object.create(null),
    fileToLowLinkId: Object.create(null),
    fileToCycleRootId: Object.create(null),
    fileToIsInCycle: Object.create(null),
  };

  return {
    ...baseState,
    ...overrides,
  };
}
