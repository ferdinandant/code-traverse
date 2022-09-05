import fs from 'fs';
import { parseToAst } from '../../parser/parseToAst';
import { processAst } from '../../parser/processAst';
import { resolveParseResult } from './resolveParseResult';

type Opts = {
  config: StandardizedConfig;
  state: State;
  userState: any;
  targetFile: string;
};

export async function processFile({
  state,
  userState,
  config,
  targetFile,
}: Opts) {
  const codeStr = await fs.promises.readFile(targetFile, 'utf8');
  const ast = await parseToAst({ targetFile, codeStr });
  const parseResult = processAst({ ast });
  const resolvedParseResult = await resolveParseResult({
    state,
    config,
    targetFile,
    parseResult,
  });
  if (config.onAfterParse) {
    await config.onAfterParse({
      config,
      libState: state,
      userState,
      file: targetFile,
      parseResult: resolvedParseResult,
      codeStr,
      ast,
    });
  }
  return resolvedParseResult;
}
