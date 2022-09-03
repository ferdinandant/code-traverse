import { SourceLocation } from '@babel/types';

type ItemSpec = {
  name: string;
  dependencies: string[];
  loc: SourceLocation;
};

export function pushToExportMap(exportMap: ExportMap, itemSpec: ItemSpec) {
  const { name, dependencies, loc } = itemSpec;

  if (!exportMap[name]) {
    exportMap[name] = {
      dependencies: new Set(),
      locs: [],
    };
  }

  dependencies.forEach(dep => {
    exportMap[name].dependencies.add(dep);
  });
  exportMap[name].locs.push(loc);
}
