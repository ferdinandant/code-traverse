type Overwrite<T, NewT> = Omit<T, keyof NewT> & NewT;

// ================================================================================
// STATE
// ================================================================================

type State = {
  // --- resolve config ---
  packageNameToBasePath: Record<string, string>;
  externals: Set<string>;
  // --- file states ---
  entryFiles: Set<>;
  fileToIsVisited: Record<string, boolean>;
  fileToParseResult: Record<string, ResolvedParseResult>;
  fileToRecursiveExternalDependencies: Record<string, Set<string>>;
  fileToRecursiveDependencies: Record<string, Set<string>>;
  fileToParents: Record<string, Set<string>>;
};

// ================================================================================
// PARSING
// ================================================================================

type SourceLocation = import('@babel/types').SourceLocation;

type TopLevelDeclaration = Record<
  string,
  {
    recursiveDependencies: string[];
    declarationLoc: SourceLocation;
    referenceLocs: SourceLocation[];
  }
>;

type ImportedName = string;
type ExportedName = string;
type LocalName = string;
type ImportSpec = {
  importFrom: string;
  name: ImportedName;
  localTopLevelName: LocalName;
};
type AnonymousImportSpec = {
  importFrom: string;
};
type ReexportImportSpec = {
  importFrom: string;
  importName: ImportedName;
  exportName: ExportedName;
};

/**
 * Maps exported variable name to export information
 * (could be 'default'). Coincides with a top-level local variable name
 * if it's exported via `export <const|function|class|type> <something>`),
 * otherwise it will refer to an `exportName` from `ReexportImportSpec`.
 *
 * `locs` is the value and/or name declaration locs, e.g.:
 * - `a + b` of `export default a + b;`
 * - `a = 5` and `b = 7` of `export const a = 5, b = 7;`
 * - `q = init` and `{ q: a }` of `export const { q = init } = { q: a }`
 */
type ExportMap = Record<
  ExportedName,
  {
    dependencies: Set<LocalName>;
    locs: SourceLocation[];
  }
>;

// ================================================================================
// RESOLVE
// ================================================================================

type ResolvedPath = string;

type ResolveFn = (context: string, request: string) => Promise<ResolvedRequest>;

type ResolvedRequest = {
  resolvedPath: string;
  isExternal: boolean;
};

/**
 * Need special handling when `importedNames` includes '*'
 */
type ResolvedModuleImports = Record<
  ResolvedPath,
  {
    importedNames: Set<ImportedName>;
    importedNameToLocalNames: Record<ImportedName, LocalName[]>;
    importedNameToReexportNames: Record<ImportedName, ExportedName[]>;
    hasAnonymousImport: boolean;
  }
>;
type ResolvedParseResult = {
  topLevelDeclarations: TopLevelDeclaration;
  externalImports: Set<string>;
  moduleImports: ResolvedModuleImports;
  exportMap: ExportMap;
};

// ================================================================================
// CONFIG
// ================================================================================

/**
 * Maps a chunk name (e.g. 'main' or 'desktop'
 * to a list of file paths, relative to the config's `baseDir`
 */
type Entries = Record<string, string | string[]>;
type StdEntries = Record<string, string[]>;

type ResolveObj = {
  externals?: string[];
  lookupDirs?: string[];
  alias?: Record<string, string>;
};
type StdResolveObj = {
  externals: Set<string>;
  lookupDirs: string[];
  alias: Record<string, string>;
};
/**
 * Dictates how to resolve modules/files
 * (and which file extensions are parsed)
 */
type Resolve = ResolveObj | ResolveFn;
type StdResolve = StdResolveObj | ResolveFn;

/**
 * Globs to include/exclude files
 */
type Glob = string;

// Default hooks
type DefaultHookStateArg = { userState: any; libState: State };
type OnAfterInitializationFn = (arg: DefaultHookStateArg) => any;
type OnDoneFn = (arg: DefaultHookStateArg) => any;

// Parsing hooks
type OnAfterParseArg = DefaultHookStateArg & {
  parseResult: any;
  file: string;
  ast: import('@babel/parser').ParseResult;
};
type OnAfterParseFn = (arg: OnAfterParseArg) => any;

type Config = {
  baseDir: string;
  entries: Entries;
  resolve?: Resolve;
  extensions?: string[];
  includes?: Glob[];
  excludes?: Glob[];
  debug: boolean;
  onAfterInitialization?: OnAfterInitializationFn;
  onAfterParse?: OnAfterParseFn;
  onDone?: OnDoneFn;
};
type StandardizedConfig = Overwrite<
  Config,
  {
    entries: StdEntries;
    resolve: StdResolve;
    extensions: string[];
    includeRegexes?: RegExp[];
    excludeRegexes?: RegExp[];
  }
>;
