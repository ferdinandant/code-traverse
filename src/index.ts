import { parseConfig } from './utils/config/parseConfig';
// --- state init ---
import { getEmptyState } from './utils/state/getEmptyState';
import { initStateWithVisitTmp } from './utils/state/initStateWithVisitTmp';
import { initStateWithCycleTmp } from './utils/state/initStateWithCycleTmp';
// --- processing utils ---
import { parseAllPackageJson } from './utils/init/parseAllPackageJson';
import { visitFile } from './utils/traversal/visitFile';
import { markCycles } from './utils/traversal/markCycle/markCycles';
import { squashCyclicNodes } from './utils/traversal/markCycle/squashCyclicNodes';
import { resolveExportNames } from './utils/traversal/resolveExport/resolveExportNames';

// ================================================================================
// MAIN
// ================================================================================

export { saveState } from './helpers/state/saveState';
export { loadState } from './helpers/state/loadState';

export default async function main(rawConfig: Config) {
  const config = parseConfig(rawConfig);
  const userState = {} as any;

  // --------------------------------------------------------------------------------
  // Initialize
  // --------------------------------------------------------------------------------

  const state = getEmptyState();
  await parseAllPackageJson({ state, config });
  if (config.onAfterInitialization) {
    config.onAfterInitialization({ userState, libState: state });
  }

  // --------------------------------------------------------------------------------
  // Main work
  // --------------------------------------------------------------------------------

  // Begin traversing
  const { entries } = config;
  initStateWithVisitTmp(state);
  for (const chunkName in entries) {
    const entryFiles = entries[chunkName];
    for (const entryFile of entryFiles) {
      const targetFile = entryFile;
      await visitFile({
        state,
        userState,
        config,
        targetFile,
      });
    }
  }
  delete state.tmp;

  // Detect cycles
  initStateWithCycleTmp(state);
  markCycles({ state });
  squashCyclicNodes({ state });
  delete state.tmp;

  // Resolve export names
  resolveExportNames({ state });

  // --------------------------------------------------------------------------------
  // Done
  // --------------------------------------------------------------------------------

  if (config.onDone) {
    config.onDone({ userState, libState: state });
  }
}
