import { ParseResult as BabelParseResult } from '@babel/parser';
import traverse from '@babel/traverse';
import { File } from '@babel/types';
// --- Visitors ---
import { programVisitor } from './visitors/programVisitor';
import { importDeclarationVisitor } from './visitors/importDeclarationVisitor';
import { callExpressionVisitor } from './visitors/callExpressionVisitor';
import { exportDefaultDeclarationVisitor } from './visitors/exportDefaultDeclarationVisitor';
import { exportNamedDeclarationVisitor } from './visitors/exportNamedDeclarationVisitor';
import { exportAllDeclarationVisitor } from './visitors/exportAllDeclarationVisitor';
import { assignmentExpressionVisitor } from './visitors/assignmentExpressionVisitor';

type Opts = {
  ast: BabelParseResult<File>;
};

export type ParseResult = {
  topLevelDeclarations: TopLevelDeclaration;
  imports: ImportSpec[];
  anonymousImports: AnonymousImportSpec[];
  reexportImports: ReexportImportSpec[];
  exportMap: ExportMap;
};

export function processAst({ ast }: Opts) {
  // Use `Object.create(null)` so keys like 'valueOf' is not defined on the object
  // (prevent naming clashes if the user declared such variable names)
  const topLevelDeclarations: TopLevelDeclaration = Object.create(null);
  const imports: ImportSpec[] = [];
  const anonymousImports: AnonymousImportSpec[] = [];
  const reexportImports: ReexportImportSpec[] = [];
  const exportMap: ExportMap = Object.create(null);

  // Get all imports and top-level identifier usage
  // Can only get `bindings` from `path`
  traverse(ast, {
    Program(path) {
      programVisitor({ path, topLevelDeclarations });
    },
    ImportDeclaration(path) {
      importDeclarationVisitor({ path, imports, anonymousImports });
    },
    CallExpression(path) {
      callExpressionVisitor({
        path,
        imports,
        anonymousImports,
        topLevelDeclarations,
      });
    },
    ExportDefaultDeclaration(path) {
      exportDefaultDeclarationVisitor({
        path,
        topLevelDeclarations,
        exportMap,
      });
    },
    ExportNamedDeclaration(path) {
      exportNamedDeclarationVisitor({
        path,
        topLevelDeclarations,
        exportMap,
        reexportImports,
      });
    },
    ExportAllDeclaration(path) {
      exportAllDeclarationVisitor({
        path,
        reexportImports,
      });
    },
    AssignmentExpression(path) {
      assignmentExpressionVisitor({
        path,
        topLevelDeclarations,
        exportMap,
      });
    },
  });

  return {
    topLevelDeclarations,
    imports,
    anonymousImports,
    reexportImports,
    exportMap,
  };
}
