import path from 'path';
import globby from 'globby';
import { State, StandardizedConfig } from '../../types';

type Opts = {
  state: State;
  config: StandardizedConfig;
};

export async function parseAllPackageJson({ state, config }: Opts) {
  // Read all package.json
  const configExcludes = config.excludes || [];
  let packageJsonFiles = await globby(['**/package.json'], {
    cwd: config.baseDir,
    ignore: ['**/node_modules/**', ...configExcludes],
  });
  if (config.includeRegexes) {
    packageJsonFiles = packageJsonFiles.filter(packageJsonFile => {
      return config.includeRegexes?.some(regex => packageJsonFile.match(regex));
    });
  }

  // Compute `packageNameToBasePath` and `externals`
  const packageNameToBasePath: Record<string, string> = Object.create(null);
  const allDependencies = new Set<string>();
  packageJsonFiles.forEach(relPath => {
    const absPath = path.join(config.baseDir, relPath);
    const packageJson = require(absPath);
    const {
      name,
      dependencies,
      devDependencies,
      peerDependencies,
    } = packageJson;
    packageNameToBasePath[name] = path.dirname(absPath);
    if (dependencies) {
      Object.keys(dependencies).forEach(depName =>
        allDependencies.add(depName)
      );
    }
    if (devDependencies) {
      Object.keys(devDependencies).forEach(depName =>
        allDependencies.add(depName)
      );
    }
    if (peerDependencies) {
      Object.keys(peerDependencies).forEach(depName =>
        allDependencies.add(depName)
      );
    }
  });
  state.packageNameToBasePath = packageNameToBasePath;

  // Compute externals
  // Exclude elements of `allDependencies` that refer to a parsed package.json's `name`
  // (don't want to deal with quirky case here, override via `OnAfterInitialization` instead)
  const externals = new Set<string>();
  allDependencies.forEach(depName => {
    const hasPackageWithDepName = Boolean(packageNameToBasePath[depName]);
    if (!hasPackageWithDepName) {
      externals.add(depName);
    }
  });
  state.externals = externals;
}
