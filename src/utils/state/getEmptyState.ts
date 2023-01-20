import { State } from '../../types';

export function getEmptyState(overrides: any = {}): State {
  const baseState: State = {
    packageNameToBasePath: Object.create(null),
    externals: new Set<string>(),
    fileData: Object.create(null),
    cycleRootIdToCycleData: Object.create(null),
  };

  return {
    ...baseState,
    ...overrides,
  };
}
