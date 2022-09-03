import path from 'path';
import globToRegExp from 'glob-to-regexp';

const DEFAULT_EXTENSIONS = ['.js', '.ts', '.tsx'];

/**
 * Standardize and validate properties of config
 */
export function parseConfig(config: Config): StandardizedConfig {
  const parsedConfig: any = config;
  if (!config || typeof config !== 'object') {
    throw new Error('Config object is required');
  }
  try {
    processBaseDir(parsedConfig);
    processEntries(parsedConfig);
    processResolve(parsedConfig);
    processIncludeExclude(parsedConfig);
    return parsedConfig as StandardizedConfig;
  } catch (err) {
    const err2 = err as Error;
    throw new Error(`Error parsing config: ${err2.message}`);
  }
}

function processBaseDir(config: Config) {
  const { baseDir } = config;
  if (!baseDir) {
    throw new Error('baseDir is required');
  }
  if (!baseDir.startsWith('/')) {
    throw new Error('baseDir needs to be an absolute path');
  }
  return config;
}

function processEntries(config: Config) {
  const { entries, baseDir } = config;
  let parsedEntries: StdEntries;
  if (!entries) {
    throw new Error('entries is required');
  }
  parsedEntries = Object.entries(entries).reduce((prev, curr) => {
    const [chunkName, rawEntryFiles] = curr;
    const entryFiles = Array.isArray(rawEntryFiles)
      ? rawEntryFiles
      : [rawEntryFiles];
    const absEntryFiles = entryFiles.map(i =>
      i.startsWith('/') ? i : path.join(baseDir, i)
    );
    return Object.assign(prev, { [chunkName]: absEntryFiles });
  }, {});
  config.entries = parsedEntries;
}

function processResolve(config: Config) {
  const { resolve = {} } = config;
  let parsedResolve: StdResolve;
  if (typeof resolve === 'function') {
    parsedResolve = resolve;
  } else {
    if (resolve?.lookupDirs && !Array.isArray(resolve?.lookupDirs)) {
      throw new Error('lookupDirs should be an array');
    }
    parsedResolve = {
      externals: new Set(resolve.externals || []),
      lookupDirs: resolve.lookupDirs || ['./'],
      alias: resolve.alias || Object.create(null),
    };
  }
  (config as any).resolve = parsedResolve;
}

function processIncludeExclude(config: Config) {
  const { includes, excludes, extensions } = config;
  const includeRegexes = includes && includes.map(i => globToRegExp(i));
  const excludeRegexes = excludes && excludes.map(i => globToRegExp(i));
  (config as any).extensions = extensions || DEFAULT_EXTENSIONS;
  (config as any).includeRegexes = includeRegexes;
  (config as any).excludeRegexes = excludeRegexes;
}
