import path from 'path';
import { REPO_ROOT } from './constants';
import main from './index';

const REPO_FIXTURES_DIR = path.join(REPO_ROOT, 'fixtures/repo');

test('using simple-case mock repo', async () => {
  const testCaseDir = path.join(REPO_FIXTURES_DIR, 'simple-case');
  const entryFile = path.join(testCaseDir, 'index.ts');
  const mockConfig = {
    baseDir: testCaseDir,
    entries: { main: entryFile },
    onDone: ({ libState }) => {
      // TODO
    },
  };
  await main(mockConfig);
});
