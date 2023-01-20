import { State } from '../../../types';
import { getFileChildren } from '../utils/getFileChildren';

type Opts = {
  state: State;
};

/**
 * Resolve export names because of `exports * from <...>`;
 * add it to `reexportMap`
 */
export function resolveReexportNames({ state }: Opts) {
  const { fileData, cycleRootIdToCycleData } = state;
  const visitedFiles = new Set<string>();
  const files = Object.keys(state.fileData);

  // If the file is part of a cycle,
  // then mark all members of the cycle as visited
  const markFileVisited = (file: string) => {
    if (fileData[file].isInCycle) {
      const cycleRootId = fileData[file].cycleRootId;
      const { members } = cycleRootIdToCycleData[cycleRootId];
      members.forEach(member => {
        visitedFiles.add(member);
      });
    } else {
      visitedFiles.add(file);
    }
  };

  const getAllFileExportNames = (file: string) => {
    // This assumes all of this node's export names have been resolved
    const childFileData = fileData[file];
    const childExportNames = new Set<string>();
    Object.keys(childFileData.exportMap).forEach(k => childExportNames.add(k));
    Object.keys(childFileData.reexportMap).forEach(k =>
      childExportNames.add(k)
    );
    return childExportNames;
  };

  const resolveSingleReexports = (file: string) => {
    const { moduleImports, reexportMap } = fileData[file];
    const reexportChildFiles = Object.keys(moduleImports).filter(childFile => {
      const importAllMap = moduleImports[childFile].importedNameMap['*'];
      return importAllMap && importAllMap.reexportNames.length > 0;
    });
    for (const reexportChildFile of reexportChildFiles) {
      // Read children exports and reexports
      const childExportNames = getAllFileExportNames(reexportChildFile);
      // Add to current file reexport map
      childExportNames.forEach(exportName => {
        reexportMap[exportName] = { file: reexportChildFile };
      });
    }
  };

  const resolveCycleReexports = (cycleRootId: number) => {
    const { members } = state.cycleRootIdToCycleData[cycleRootId];
    // Detect which nodes which we shall loop
    const membersWithReexports = new Set<string>();
    const memberToReexportChildFiles: Record<string, string[]> = Object.create(
      null
    );
    members.forEach(file => {
      const { moduleImports } = state.fileData[file];
      const reexportChildFiles = Object.keys(moduleImports).filter(
        childFile => {
          const importAllMap = moduleImports[childFile].importedNameMap['*'];
          return importAllMap && importAllMap.reexportNames.length > 0;
        }
      );
      if (reexportChildFiles.length > 0) {
        membersWithReexports.add(file);
        memberToReexportChildFiles[file] = reexportChildFiles;
      }
      return;
    });
    // Keep adding reexport until none is added
    let isNewReexportNamesAdded: boolean;
    do {
      isNewReexportNamesAdded = false;
      membersWithReexports.forEach(memberFile => {
        const reexportChildren = memberToReexportChildFiles[memberFile];
        reexportChildren.forEach(reexportChildFile => {
          // Read children exports and reexports
          const childExportNames = getAllFileExportNames(reexportChildFile);
          // Add to current file reexport map
          // Check if we are adding new entry to `reexportMap`
          const { reexportMap } = fileData[memberFile];
          childExportNames.forEach(exportName => {
            if (!reexportMap[exportName]) {
              reexportMap[exportName] = { file: reexportChildFile };
              isNewReexportNamesAdded = true;
            }
          });
        });
      });
    } while (isNewReexportNamesAdded);
  };
  const visit = (file: string) => {
    // Determine children
    const isInCycle = fileData[file].isInCycle;
    let children, cycleRootId;
    if (isInCycle) {
      cycleRootId = fileData[file].cycleRootId;
      children = cycleRootIdToCycleData[cycleRootId].children;
    } else {
      children = getFileChildren(state, file);
    }
    // Visit children
    children.forEach(child => {
      markFileVisited(child);
      visit(child);
    });
    // All children already have `reexportMap`
    if (isInCycle) {
      resolveCycleReexports(cycleRootId as number);
    } else {
      resolveSingleReexports(file);
    }
  };

  for (const file of files) {
    if (visitedFiles.has(file)) {
      continue;
    }
    markFileVisited(file);
    visit(file);
  }
}
