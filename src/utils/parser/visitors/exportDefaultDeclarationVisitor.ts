import { NodePath } from '@babel/traverse';
import { ExportDefaultDeclaration } from '@babel/types';
import { ExportMap, TopLevelDeclaration } from '../../../types';
import { pushToExportMap } from '../utils/pushToExportMap';
import { getTopLevelDependencies } from '../utils/getTopLevelDependencies';

type Opts = {
  path: NodePath<ExportDefaultDeclaration>;
  topLevelDeclarations: TopLevelDeclaration;
  exportMap: ExportMap;
};

export function exportDefaultDeclarationVisitor({
  path,
  topLevelDeclarations,
  exportMap,
}: Opts) {
  const exportLoc = path.node.declaration.loc!;
  const exportName = 'default';
  const dependencies = getTopLevelDependencies({
    topLevelDeclarations,
    valueLoc: exportLoc,
  });
  pushToExportMap(exportMap, {
    name: exportName,
    isReexport: false,
    dependencies,
    loc: exportLoc,
  });
}
