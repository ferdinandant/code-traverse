import { NodePath, Node } from '@babel/traverse';
import {
  CallExpression,
  isLiteral,
  isTemplateLiteral,
  Literal,
} from '@babel/types';
import { findEnclosingTopLevelNames } from '../utils/findEnclosingTopLevelNames';

type Opts = {
  path: NodePath<CallExpression>;
  imports: Array<ImportSpec>;
  anonymousImports: Array<AnonymousImportSpec>;
  topLevelDeclarations: TopLevelDeclaration;
};

export function callExpressionVisitor({
  path,
  imports,
  anonymousImports,
  topLevelDeclarations,
}: Opts) {
  const { node } = path;
  const { callee, arguments: argNodes } = node;

  // Detect `require(...)` and `import(...)`
  const isRequire = callee.type === 'Identifier' && callee.name === 'require';
  const isDynamicImport = callee.type === 'Import';
  if (isRequire || isDynamicImport) {
    const argNode = argNodes[0];
    // Ignore callee of expression type, e.g. `(my.something)(args)`.
    if (isDynamicExpression(argNode)) {
      console.warn('Warn: a dynamic require/import expression is ignored');
      return;
    }
    // if (Array.isArray(container)) {
    //   throw new Error('Unexpected container array');
    // }
    // Won't deal with stupid subtleties for now. Always consider them imports everything.
    const importFrom = getImportSource(argNode as Literal);
    const enclosingTopLevelNames = findEnclosingTopLevelNames({
      topLevelDeclarations,
      loc: node.loc!,
    });
    if (enclosingTopLevelNames.length === 0) {
      anonymousImports.push({ importFrom });
    } else {
      enclosingTopLevelNames.forEach(enclosingTopLevelName => {
        imports.push({
          importFrom,
          name: '*',
          localTopLevelName: enclosingTopLevelName,
        });
      });
    }
  }
}

function isDynamicExpression(node: Node) {
  return (
    !isLiteral(node) || (isTemplateLiteral(node) && node.expressions.length > 0)
  );
}

function getImportSource(callArgNode: Literal) {
  if (
    callArgNode.type === 'NullLiteral' ||
    callArgNode.type === 'RegExpLiteral'
  ) {
    const ctxStr = callArgNode.type;
    throw new Error(`Unhandled literal node type: ${ctxStr}`);
  }
  return String(
    isTemplateLiteral(callArgNode)
      ? callArgNode.quasis[0].value.cooked
      : callArgNode.value
  );
}
