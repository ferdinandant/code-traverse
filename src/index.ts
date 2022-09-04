import { parseConfig } from './utils/config/parseConfig';
import { getEmptyState } from './utils/state/getEmptyState';
import { parseAllPackageJson } from './utils/init/parseAllPackageJson';
import { visitFile } from './utils/traversal/visitFile';
import { markCycles } from './utils/traversal/markCycle/markCycles';
import { squashCyclicNodes } from './utils/traversal/markCycle/squashCyclicNodes';

export { saveState } from './helpers/state/saveState';
export { loadState } from './helpers/state/loadState';

export default async function main(rawConfig: Config) {
  const config = parseConfig(rawConfig);
  const userState = {} as any;
  const state = getEmptyState();

  // Initialize
  await parseAllPackageJson({ state, config });
  if (config.onAfterInitialization) {
    config.onAfterInitialization({ userState, libState: state });
  }

  // Begin traversing
  const { entries } = config;
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
  // Detect cycles
  markCycles({ state });
  squashCyclicNodes({ state });
  console.log(state);

  // Done
  if (config.onDone) {
    config.onDone({ userState, libState: state });
  }
}
