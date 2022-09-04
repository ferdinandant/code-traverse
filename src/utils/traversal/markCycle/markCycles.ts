import { Stack } from '../../../struct/Stack';
import { getFileChildren } from '../utils/getFileChildren';

// ================================================================================
// TYPES/CONST
// ================================================================================

type Opts = {
  state: State;
};

let nextFileId: number;
let isFileVisited: Record<string, boolean>;
let stack: Stack<string>;

// ================================================================================
// MAIN
// ================================================================================

export function markCycles({ state }: Opts) {
  // Reset state
  nextFileId = 0;
  isFileVisited = Object.create(null);
  stack = new Stack<string>();

  // Traverse
  const files = Object.keys(state.fileToIsVisited);
  files.forEach(file => {
    if (!isFileVisited[file]) {
      connect(state, file);
    }
  });
}

// ================================================================================
// HELPERS
// ================================================================================

/**
 * Tarjan's DFS algorithm to find strongly-connected components (cycles)
 * https://en.wikipedia.org/wiki/Tarjan%27s_strongly_connected_components_algorithm
 */
function connect(state: State, file: string) {
  // Initialize
  isFileVisited[file] = true;
  state.fileToId[file] = nextFileId++;
  state.fileToLowLinkId[file] = state.fileToId[file];
  stack.push(file);
  // Recursively visit children
  const childrenFiles = getFileChildren(state, file);
  childrenFiles.forEach(childrenFile => {
    if (!isFileVisited[childrenFile]) {
      // Traverse successors with this node as "root"
      connect(state, childrenFile);
      state.fileToLowLinkId[file] = Math.min(
        state.fileToLowLinkId[file],
        state.fileToLowLinkId[childrenFile]
      );
    } else if (stack.has(childrenFile)) {
      // Current node is part of the cycle (?) with `childrenFile`
      state.fileToLowLinkId[file] = Math.min(
        state.fileToLowLinkId[file],
        state.fileToId[childrenFile]
      );
    }
  });
  // If this node is root node of current cycle,
  // keep popping from stack until we get back to this node.
  // All popped nodes are part of current cycle.
  if (state.fileToLowLinkId[file] === state.fileToId[file]) {
    markCycleComponentsFromRoot(state, file);
  }
}

function markCycleComponentsFromRoot(state: State, rootFile: string) {
  const cycleComponents = [];
  // Keep popping from stack until we get back to the current node.
  // All popped nodes are part of current cycle.
  let top;
  do {
    top = stack.pop();
    cycleComponents.push(top);
  } while (top != rootFile);
  // lowLink could be different for some nodes in this cycle (depends on traversal order),
  // so we establish `fileToCycleRootId` to flag that these nodes belong to the same cycle.
  if (cycleComponents.length > 1) {
    const cycleRootId = state.fileToId[rootFile];
    cycleComponents.forEach(cycleComponent => {
      state.fileToCycleRootId[cycleComponent] = cycleRootId;
      state.fileToIsInCycle[cycleComponent] = true;
    });
  }
}
