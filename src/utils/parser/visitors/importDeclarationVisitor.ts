import { NodePath } from '@babel/traverse';
import { ImportDeclaration } from '@babel/types';
import { AnonymousImportSpec, ImportSpec } from '../../../types';

type Opts = {
  path: NodePath<ImportDeclaration>;
  imports: Array<ImportSpec>;
  anonymousImports: Array<AnonymousImportSpec>;
};

export function importDeclarationVisitor({
  path,
  imports,
  anonymousImports,
}: Opts) {
  const { specifiers, source } = path.node;
  const importFrom = source.value;

  if (specifiers.length === 0) {
    // Importing only for side-effect
    anonymousImports.push({ importFrom });
  } else {
    specifiers.forEach(node => {
      const { type, local } = node;
      const localTopLevelName = local.name;
      if (type === 'ImportDefaultSpecifier') {
        // import Something from './xxx'
        imports.push({ importFrom, name: 'default', localTopLevelName });
      } else if (type === 'ImportNamespaceSpecifier') {
        // import * as Something from './xxx'
        imports.push({ importFrom, name: '*', localTopLevelName });
      } else if (type === 'ImportSpecifier') {
        // import * as Something from './xxx'
        const { imported } = node;
        if (imported.type === 'StringLiteral') {
          throw new Error('Cannot handle StringLiteral in ImportSpecifier');
        }
        const name = imported.name;
        imports.push({ importFrom, name, localTopLevelName });
      }
    });
  }
}
