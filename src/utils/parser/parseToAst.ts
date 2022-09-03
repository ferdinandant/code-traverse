import { parse } from '@babel/parser';

type Opts = {
  targetFile: string;
  codeStr: string;
};

export function parseToAst({ targetFile, codeStr }: Opts) {
  const ast = parse(codeStr, {
    sourceType: 'module',
    plugins: [
      targetFile.match(/[.]tsx?$/) ? 'typescript' : 'flow',
      'jsx',
      'objectRestSpread',
      'asyncGenerators',
      'classProperties',
      'dynamicImport',
      'optionalChaining',
    ],
  });
  return ast;
}
