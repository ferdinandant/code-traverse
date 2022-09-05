import { NodePath } from '@babel/traverse';
import {
  VariableDeclarator,
  ExportNamedDeclaration,
  ObjectPattern,
  ArrayPattern,
} from '@babel/types';
import { pushToExportMap } from '../utils/pushToExportMap';
import { getTopLevelDependencies } from '../utils/getTopLevelDependencies';

// ================================================================================
// TYPES/CONST
// ================================================================================

type Opts = {
  path: NodePath<ExportNamedDeclaration>;
  topLevelDeclarations: TopLevelDeclaration;
  exportMap: ExportMap;
  reexportImports: Array<ReexportImportSpec>;
};

type VariableDeclarationHandlerOpts = {
  declaration: VariableDeclarator;
  topLevelDeclarations: TopLevelDeclaration;
  exportMap: ExportMap;
};

// ================================================================================
// MAIN
// ================================================================================

export function exportNamedDeclarationVisitor({
  path,
  topLevelDeclarations,
  exportMap,
  reexportImports,
}: Opts) {
  const { node } = path;

  // Sample cases:
  // - `export const { p, q, ...r } = { p: 1, q: a };`
  // - `export const [ p, q, ...r ] = [1, 2, 3];`
  // - `export const a = 5;`
  if (node.declaration) {
    if (node.declaration.type === 'VariableDeclaration') {
      const declarations = node.declaration.declarations;
      declarations.forEach(declaration => {
        if (declaration.id.type === 'Identifier') {
          handleIdentifierDeclaration({
            declaration,
            topLevelDeclarations,
            exportMap,
          });
        } else if (declaration.id.type === 'ObjectPattern') {
          handleObjectPatternDeclaration({
            declaration,
            topLevelDeclarations,
            exportMap,
          });
        } else if (declaration.id.type === 'ArrayPattern') {
          handleArrayPatternDeclaration({
            declaration,
            topLevelDeclarations,
            exportMap,
          });
        } else {
          throw new Error(
            `Unhandled case of declaration.id.type: ${declaration.id.type}`
          );
        }
      });
    } else if (
      node.declaration.type === 'FunctionDeclaration' ||
      node.declaration.type === 'ClassDeclaration' ||
      node.declaration.type === 'TSDeclareFunction' ||
      node.declaration.type === 'TSInterfaceDeclaration' ||
      node.declaration.type === 'TSEnumDeclaration' ||
      node.declaration.type === 'TSTypeAliasDeclaration'
    ) {
      const exportName = node.declaration.id!.name;
      const loc = node.loc!;
      const dependencies = getTopLevelDependencies({
        topLevelDeclarations,
        valueLoc: loc,
      });
      pushToExportMap(exportMap, {
        name: exportName,
        isReexport: false,
        dependencies,
        loc,
      });
    } else {
      throw new Error(
        `Unhandled case of node.declaration.type: ${node.declaration.type}`
      );
    }
  }

  // Sample cases:
  // - export { default as default1 } from './mdle';
  // - export { g, h, i } from './mdlf';
  else if (node.specifiers && node.source) {
    const importFrom = node.source.value;
    const specifiers = node.specifiers;
    specifiers.forEach(specifierNode => {
      if (specifierNode.type === 'ExportDefaultSpecifier') {
        throw new Error('ExportDefaultSpecifier is not supported');
      }
      if (specifierNode.exported.type === 'StringLiteral') {
        throw new Error('StringLiteral export specifier is not supported');
      }
      const importName =
        specifierNode.type === 'ExportNamespaceSpecifier'
          ? '*'
          : specifierNode.local.name;
      const exportName = specifierNode.exported.name;
      // Register imports
      reexportImports.push({
        importFrom,
        importName,
        exportName,
      });
      // Register exports
      // Cannot have dependencies
      const loc = specifierNode.loc!;
      pushToExportMap(exportMap, {
        name: exportName,
        isReexport: true,
        dependencies: [],
        loc,
      });
    });
  }

  // Sample cases:
  // - export { a, b, c };
  else if (node.specifiers && node.source === null) {
    const specifiers = node.specifiers;
    specifiers.forEach(specifierNode => {
      if (specifierNode.type !== 'ExportSpecifier') {
        throw new Error('Export node specifier type not supported');
      }
      // Register exports
      // Only referring to one localVariable
      const loc = specifierNode.loc!;
      const localName = specifierNode.local.name;
      const exportName =
        specifierNode.exported.type === 'Identifier'
          ? specifierNode.exported.name
          : specifierNode.exported.value;
      pushToExportMap(exportMap, {
        name: exportName,
        isReexport: false,
        dependencies: [localName],
        loc,
      });
    });
  }

  // Shouldn't happen
  else {
    throw new Error('Unhandled ExportAllDeclaration node pattern');
  }
}

// ================================================================================
// DECLARATION HELPERS
// ================================================================================

function handleIdentifierDeclaration({
  declaration,
  topLevelDeclarations,
  exportMap,
}: VariableDeclarationHandlerOpts) {
  // Covers `a = 5` part of `export const a = 5;`
  const exportLoc = declaration.loc!;
  const exportName = (declaration.id as any).name;
  // `valueLoc` may be null in case of `export let <something>;`
  const valueLoc = declaration.init ? (declaration.init as any).loc : null;
  const dependencies = valueLoc
    ? getTopLevelDependencies({
        topLevelDeclarations,
        valueLoc,
      })
    : [];
  pushToExportMap(exportMap, {
    name: exportName,
    isReexport: false,
    dependencies,
    loc: exportLoc,
  });
}

function handleObjectPatternDeclaration({
  declaration,
  topLevelDeclarations,
  exportMap,
}: VariableDeclarationHandlerOpts) {
  const rightHandValueLoc = (declaration.init as any).loc;
  const rightHandValueDeps = getTopLevelDependencies({
    topLevelDeclarations,
    valueLoc: rightHandValueLoc,
  });
  (declaration.id as ObjectPattern).properties.forEach(propertyNode => {
    if (
      propertyNode.type === 'ObjectProperty' &&
      propertyNode.key.type === 'Identifier'
    ) {
      // Normal property destructoring
      const exportName = propertyNode.key.name;
      const initLoc = propertyNode.value.loc!;
      // There could be two points to consider:
      // e.g. `export const { q = init } = { p: 1, q: a }`
      // -> consider `init` and `{ p: 1, q: a }`
      const dependencies = [
        ...rightHandValueDeps,
        ...getTopLevelDependencies({
          topLevelDeclarations,
          valueLoc: initLoc,
        }),
      ];
      pushToExportMap(exportMap, {
        name: exportName,
        isReexport: false,
        dependencies,
        loc: rightHandValueLoc,
      });
      pushToExportMap(exportMap, {
        name: exportName,
        isReexport: false,
        dependencies,
        loc: initLoc,
      });
    } else if (
      propertyNode.type === 'RestElement' &&
      propertyNode.argument.type === 'Identifier'
    ) {
      // Rest property destructoring
      const exportName = propertyNode.argument.name;
      pushToExportMap(exportMap, {
        name: exportName,
        isReexport: false,
        dependencies: rightHandValueDeps,
        loc: rightHandValueLoc,
      });
    } else {
      throw new Error(`Unhandled case of propertyNode: ${propertyNode.type}`);
    }
  });
}

function handleArrayPatternDeclaration({
  declaration,
  topLevelDeclarations,
  exportMap,
}: VariableDeclarationHandlerOpts) {
  const rightHandValueLoc = (declaration.init as any).loc;
  const rightHandValueDeps = getTopLevelDependencies({
    topLevelDeclarations,
    valueLoc: rightHandValueLoc,
  });
  (declaration.id as ArrayPattern).elements.forEach(elementNode => {
    let exportName;
    if (!elementNode) {
      throw new Error('Missing elementNode');
    }
    if (elementNode.type === 'Identifier') {
      exportName = elementNode.name;
    } else if (elementNode.type === 'RestElement') {
      exportName = (elementNode.argument as any).name;
    } else {
      throw new Error(`Unhandled case of elementNode: ${elementNode.type}`);
    }
    pushToExportMap(exportMap, {
      name: exportName,
      isReexport: false,
      dependencies: rightHandValueDeps,
      loc: rightHandValueLoc,
    });
  });
}
