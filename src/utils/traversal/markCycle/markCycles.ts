import { State, StateWithCycleTmp } from '../../../types';
import { getFileChildren } from '../utils/getFileChildren';

type Opts = {
  state: State;
};

export function markCycles({ state }: Opts) {
  const stateWithTmp = state as StateWithCycleTmp;
  const { fileToIsVisited } = stateWithTmp.tmp;

  // Traverse
  const files = Object.keys(state.fileData);
  files.forEach(file => {
    if (!fileToIsVisited[file]) {
      connect(state, file);
    }
  });
}

/**
 * Tarjan's DFS algorithm to find strongly-connected components (cycles)
 * https://en.wikipedia.org/wiki/Tarjan%27s_strongly_connected_components_algorithm
 */
function connect(state: State, file: string) {
  const stateWithTmp = state as StateWithCycleTmp;
  const { fileToIsVisited, fileToCycleData, stack } = stateWithTmp.tmp;

  // Initialize
  const fileId = stateWithTmp.tmp.nextFileId++;
  fileToIsVisited[file] = true;
  fileToCycleData[file] = {
    id: fileId,
    lowLinkId: fileId,
  };
  stack.push(file);

  // Recursively visit children
  const childrenFiles = getFileChildren(state, file);
  childrenFiles.forEach(childrenFile => {
    if (!fileToIsVisited[childrenFile]) {
      // Traverse successors with this node as "root"
      connect(state, childrenFile);
      fileToCycleData[file].lowLinkId = Math.min(
        fileToCycleData[file].lowLinkId,
        fileToCycleData[childrenFile].lowLinkId
      );
    } else if (stack.has(childrenFile)) {
      // Current node is part of the cycle (?) with `childrenFile`
      fileToCycleData[file].lowLinkId = Math.min(
        fileToCycleData[file].lowLinkId,
        fileToCycleData[childrenFile].id
      );
    }
  });

  // If this node is root node of current cycle,
  // keep popping from stack until we get back to this node.
  // All popped nodes are part of current cycle.
  if (fileToCycleData[file].lowLinkId === fileToCycleData[file].id) {
    markCycleComponentsFromRoot(state, file);
  }
}

function markCycleComponentsFromRoot(state: State, rootFile: string) {
  const stateWithTmp = state as StateWithCycleTmp;
  const { fileData } = state;
  const { stack, fileToCycleData } = stateWithTmp.tmp;

  // Keep popping from stack until we get back to the current node.
  // All popped nodes are part of current cycle.
  const cycleComponents = [];
  let top;
  do {
    top = stack.pop();
    cycleComponents.push(top);
  } while (top !== rootFile);

  // lowLink could be different for some nodes in this cycle (depends on traversal order),
  // so we establish `fileToCycleRootId` to flag that these nodes belong to the same cycle.
  if (cycleComponents.length > 1) {
    const cycleRootId = fileToCycleData[rootFile].id;
    cycleComponents.forEach(cycleComponent => {
      fileData[cycleComponent].isInCycle = true;
      fileData[cycleComponent].cycleRootId = cycleRootId;
    });
  }
}
