import path from 'path';
import module from 'module';
import { StandardizedConfig, State, ResolvedRequest } from '../../../types';
import { isFileExistsAtAbsolutePath } from '../utils/isFileExistsAtAbsolutePath';

// ================================================================================
// TYPES/CONST
// ================================================================================

type Opts = {
  state: State;
  config: StandardizedConfig;
  /* The file to be resolved */
  request: string;
  /* The requesting file */
  context: string;
};

// List node's of built-in modules (e.g. 'fs', etc.)
const builtinModules = new Set<string>(module.builtinModules);

// Construct regexes from `resolve.alias` once
let aliasRegexPairs: Array<[string, RegExp]>;

// ================================================================================
// MAIN
// ================================================================================

export async function resolveRequest(opts: Opts): Promise<ResolvedRequest> {
  const { state, config, request, context } = opts;
  const {
    resolve: { resolveFn },
  } = config;

  if (resolveFn) {
    const resolveNormally = async () => {
      return await internalResolveRequest(opts);
    };
    return await resolveFn({
      libState: state,
      config,
      request,
      context,
      resolveNormally,
    });
  } else {
    return await internalResolveRequest(opts);
  }
}

async function internalResolveRequest(opts: Opts) {
  const { state, config, request, context } = opts;
  const { baseDir, resolve, extensions } = config;

  // Resolve alias
  const { alias, externals, lookupDirs } = resolve;
  if (!aliasRegexPairs) {
    aliasRegexPairs = Object.keys(alias).map(aliasKey => {
      const regex = new RegExp(`^${aliasKey}($|/)`);
      return [aliasKey, regex];
    });
  }
  const matchedAliasPair = aliasRegexPairs.find(([_, regex]) => {
    return request.match(regex);
  });
  const aliasedRequest = matchedAliasPair
    ? request.replace(matchedAliasPair[0], alias[matchedAliasPair[0]])
    : request;

  // Easy return if it's an external request
  const possiblePackageName = getNormalizedRequest(aliasedRequest);
  if (
    builtinModules.has(possiblePackageName) ||
    externals.has(possiblePackageName) ||
    state.externals.has(possiblePackageName)
  ) {
    return { resolvedPath: aliasedRequest, isExternal: true };
  }

  // Find matching file
  const contextDirname = path.dirname(context);
  const attemptedPaths = [];
  // The extension may be specified by the path itself
  const possibleExtensions = ['', ...extensions];
  // Try '<filePath>' and `<filePath>/index`
  for (const extension of possibleExtensions) {
    const absolutePathsToTest = [];
    if (isDotSlashPath(aliasedRequest)) {
      // In case the path begins with './' or '../',
      // should only consider relative paths from `context`
      absolutePathsToTest.push(
        path.join(contextDirname, `${aliasedRequest}${extension}`),
        path.join(contextDirname, `${aliasedRequest}/index${extension}`)
      );
    } else if (state.packageNameToBasePath[possiblePackageName]) {
      // If the path refers to a known module
      // Use the module's base dir, and remove the module name from the path
      // e.g. resolve '@tvlk/a/b/c to '<baseDir>/b/c'
      const baseDir = state.packageNameToBasePath[possiblePackageName];
      const pathWithoutModuleName = aliasedRequest.replace(
        new RegExp(`^${possiblePackageName}(/)?`),
        ''
      );
      absolutePathsToTest.push(
        path.join(baseDir, `${pathWithoutModuleName}${extension}`),
        path.join(baseDir, `${pathWithoutModuleName}/index${extension}`)
      );
    } else {
      // Use the path relative to `baseDir` and `lookupDirs`
      for (const lookupDir of lookupDirs) {
        absolutePathsToTest.push(
          path.join(baseDir, lookupDir, `${aliasedRequest}${extension}`),
          path.join(baseDir, lookupDir, `${aliasedRequest}/index${extension}`)
        );
      }
    }
    for (const absPathToTest of absolutePathsToTest) {
      attemptedPaths.push(absPathToTest);
      if (await isFileExistsAtAbsolutePath(absPathToTest)) {
        return { resolvedPath: absPathToTest, isExternal: false };
      }
    }
  }

  // Can't find anything
  const ctxStr = JSON.stringify({ context, request, attemptedPaths }, null, 2);
  throw new Error(`Unable to resolve file: ${ctxStr}`);
}

// ================================================================================
// HELPERS
// ================================================================================

/**
 * For scoped filename, take the scope and package name (e.g. '@aaa/bbb/ccc' -> '@aaa/bbb'),
 * otherwise, take the package name only (e.g. 'xxx/yyy/zzz' -> 'xxx')
 */
function getNormalizedRequest(request: string) {
  return request.startsWith('@')
    ? request
        .split('/')
        .slice(0, 2)
        .join('/')
    : request.split('/')[0];
}

/**
 * Checks if a path starts with './' or '../'
 */
function isDotSlashPath(filePath: string) {
  return /^[.][.]?([/]|$)/.test(filePath);
}
