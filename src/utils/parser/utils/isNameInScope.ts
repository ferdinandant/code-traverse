import { NodePath } from '@babel/traverse';

export function isNameInScope(path: NodePath<any>, name: string): boolean {
  const { scope, parentPath } = path;
  if (scope.bindings[name]) {
    return true;
  } else if (parentPath) {
    return isNameInScope(parentPath, name);
  } else {
    return false;
  }
}
