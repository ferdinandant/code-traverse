import { getFileChildren } from '../utils/getFileChildren';

type Opts = {
  state: State;
};

/**
 * Get combined stat of nodes in cycles ("squash the nodes")
 * (e.g., combine their children)
 */
export function squashCyclicNodes({ state }: Opts) {
  const visitedFiles = new Set<string>();

  // Sort for visit order consistency
  const filesInCycle = Object.keys(state.fileData)
    .filter(file => state.fileData[file].isInCycle)
    .sort();
  filesInCycle.forEach(file => {
    if (visitedFiles.has(file)) {
      return;
    }
    const { cycleRootId } = state.fileData[file];
    const cycleChildren = new Set<string>();
    const cycleMembers = new Set<string>();
    const queue: string[] = [file];

    // BFS to members of the cycles
    while (queue.length !== 0) {
      const currentFile = queue.shift()!;
      const fileChildren = getFileChildren(state, currentFile);
      visitedFiles.add(currentFile);
      cycleMembers.add(currentFile);
      // Only add to `cycleChildren` files that are NOT part of the cycle
      // If it's member of the same cyle, push to queue to visit next
      fileChildren.forEach(childFile => {
        const { cycleRootId: childCycleRootId } = state.fileData[childFile];
        if (childCycleRootId !== cycleRootId) {
          cycleChildren.add(childFile);
        }
        if (!visitedFiles.has(childFile) && childCycleRootId === cycleRootId) {
          queue.push(childFile);
        }
      });
    }

    // Register to state
    state.cycleRootIdToCycleData[cycleRootId] = {
      children: cycleChildren,
      members: cycleMembers,
    };
  });
}
