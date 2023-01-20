import { NodePath } from '@babel/traverse';
import { ExportAllDeclaration } from '@babel/types';
import { ReexportImportSpec } from '../../../types';

type Opts = {
  path: NodePath<ExportAllDeclaration>;
  reexportImports: Array<ReexportImportSpec>;
};

export function exportAllDeclarationVisitor({ path, reexportImports }: Opts) {
  const { node } = path;
  const importFrom = node.source.value;
  reexportImports.push({ importFrom, importName: '*', exportName: '*' });
}
