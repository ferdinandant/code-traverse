import path from 'path';
import { REPO_ROOT } from './constants';
import main from './index';
import { getRecursiveUsedNames } from './helpers/traverse/getRecursiveUsedNames';

const REPO_FIXTURES_DIR = path.join(REPO_ROOT, 'fixtures/repo');

test('using simple-case mock repo', async () => {
  const testCaseDir = path.join(REPO_FIXTURES_DIR, 'simple-case');
  const entryFile = path.join(testCaseDir, 'index.ts');
  const mockConfig = {
    baseDir: testCaseDir,
    entries: { main: entryFile },
    onDone: ({ config, state }) => {
      const entries: Record<string, string> = config.entries;
      Object.entries(entries).forEach(([entryName, entryFiles]) => {
        const entryFile = entryFiles[0];
        const usedNames = getRecursiveUsedNames(state, entryFile);
        console.log(usedNames);
      });
    },
  };
  await main(mockConfig);
});
