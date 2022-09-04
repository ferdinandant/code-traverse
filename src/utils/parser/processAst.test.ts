import fs from 'fs';
import path from 'path';
import { REPO_ROOT } from '../../constants';
import { processAst } from './processAst';
import { parseToAst } from './parseToAst';

describe('processAst', () => {
  describe('with ESM modules', () => {
    it('detects imports correctly', async () => {
      const targetFile = path.join(
        REPO_ROOT,
        './fixtures/parsing/esm/import-export.ts'
      );
      const codeStr = await fs.promises.readFile(targetFile, 'utf8');
      const ast = parseToAst({ targetFile, codeStr });
      const result = processAst({ ast });
      // TODO
    });

    it('detects exports correctly', async () => {
      const targetFile = path.join(
        REPO_ROOT,
        './fixtures/parsing/esm/export.ts'
      );
      const codeStr = await fs.promises.readFile(targetFile, 'utf8');
      const ast = parseToAst({ targetFile, codeStr });
      const result = processAst({ ast });
      // TODO
    });

    it('detects exports-all correctly', async () => {
      const targetFile = path.join(
        REPO_ROOT,
        './fixtures/parsing/esm/export-all.ts'
      );
      const codeStr = await fs.promises.readFile(targetFile, 'utf8');
      const ast = parseToAst({ targetFile, codeStr });
      const result = processAst({ ast });
      // TODO
    });
  });

  describe('with require', () => {
    it('detects imports correctly', async () => {
      const targetFile = path.join(
        REPO_ROOT,
        './fixtures/parsing/require/require.ts'
      );
      const codeStr = await fs.promises.readFile(targetFile, 'utf8');
      const ast = parseToAst({ targetFile, codeStr });
      const result = processAst({ ast });
      // TODO
    });

    it('detects exports correctly', async () => {
      const targetFile = path.join(
        REPO_ROOT,
        './fixtures/parsing/require/exports.ts'
      );
      const codeStr = await fs.promises.readFile(targetFile, 'utf8');
      const ast = parseToAst({ targetFile, codeStr });
      const result = processAst({ ast });
      // TODO
    });
  });

  describe('with import', () => {
    it('detects imports correctly', async () => {
      const targetFile = path.join(
        REPO_ROOT,
        './fixtures/parsing/import/dynamic-import.ts'
      );
      const codeStr = await fs.promises.readFile(targetFile, 'utf8');
      const ast = parseToAst({ targetFile, codeStr });
      const result = processAst({ ast });
      // TODO
    });
  });
});
