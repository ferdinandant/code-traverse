import { SourceLocation } from '@babel/types';
import { ExportMap } from '../../../types';

type ItemSpec = {
  name: string;
  isReexport: boolean;
  dependencies: string[];
  loc: SourceLocation;
};

export function pushToExportMap(exportMap: ExportMap, itemSpec: ItemSpec) {
  const { name, dependencies, loc, isReexport } = itemSpec;

  if (!exportMap[name]) {
    exportMap[name] = {
      isReexport: false,
      dependencies: new Set(),
      locs: [],
    };
  }
  dependencies.forEach(dep => {
    exportMap[name].dependencies.add(dep);
  });
  exportMap[name].locs.push(loc);
  exportMap[name].isReexport = isReexport;
}
