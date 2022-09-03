import { NodePath } from '@babel/traverse';
import { AssignmentExpression } from '@babel/types';
import { isNameInScope } from '../utils/isNameInScope';
import { pushToExportMap } from '../utils/pushToExportMap';
import { getTopLevelDependencies } from '../utils/getTopLevelDependencies';

type Opts = {
  path: NodePath<AssignmentExpression>;
  topLevelDeclarations: TopLevelDeclaration;
  exportMap: ExportMap;
};

export function assignmentExpressionVisitor({
  path,
  topLevelDeclarations,
  exportMap,
}: Opts) {
  const node = path.node;
  const { left, right } = node;

  // Detects `module.exports = ...`
  const isModuleExports =
    left.type === 'MemberExpression' &&
    left.object.type === 'Identifier' &&
    left.object.name === 'module' &&
    left.property.type === 'Identifier' &&
    left.property.name === 'exports';
  // Detects `exports.<something> = ...`
  const isExportsSomething =
    left.type === 'MemberExpression' &&
    left.object.type === 'Identifier' &&
    left.object.name === 'exports';
  // Exit quickly if this node has nothing to do with the native `module` object
  if (!isModuleExports && !isExportsSomething) {
    return;
  }

  // Don't do anything if variable with the same name has been declared in the scope
  // (this would refer to the user-declared variable instead of the native 'module' object)
  if (isModuleExports) {
    if (isNameInScope(path, 'module')) {
      return;
    }
  } else if (isExportsSomething) {
    if (isNameInScope(path, 'exports')) {
      return;
    }
    if (left.property.type !== 'Identifier') {
      console.warn('Warn: a dynamic exports[...] pattern is ignored');
      return;
    }
  }
  // Detect writes to the 'module' object
  // We ignore reads from the 'module' object for simplicity for now (who does that anyway :s)
  const rhsLoc = right.loc!;
  const topLevelDependencies = getTopLevelDependencies({
    topLevelDeclarations,
    valueLoc: rhsLoc,
  });
  if (isModuleExports) {
    pushToExportMap(exportMap, {
      name: 'default',
      dependencies: topLevelDependencies,
      loc: rhsLoc,
    });
  } else if (isExportsSomething && left.property.type === 'Identifier') {
    const exportName = left.property.name;
    pushToExportMap(exportMap, {
      name: exportName,
      dependencies: topLevelDependencies,
      loc: rhsLoc,
    });
  } else {
    throw new Error('Unexpected module.exports or exports.<something> usage');
  }
}
