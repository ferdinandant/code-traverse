import { File, SourceLocation } from '@babel/types';
import { ParseResult } from '@babel/parser';
import { Stack } from '../struct/Stack';

export type Overwrite<T, NewT> = Omit<T, keyof NewT> & NewT;

/**
 * Absolute path to a file
 */
export type ResolvedPath = string;

export type ImportedName = string;
export type ExportedName = string;
export type LocalName = string;

// ================================================================================
// STATE
// ================================================================================

export type CycleData = {
  members: Set<string>;
  children: Set<string>;
};

/**
 * Contains exports exported via `export * from <...>`.
 * Note: may want to combine data from `export {...} from <...>` here
 */
export type ReexportMap = Record<ExportedName, { file: string }>;

/**
 * null means the export depends on the current file
 */
export type ResolvedExport = { from: string | null };
export type ResolvedExports = Record<ExportedName, ResolvedExport>;

export type FileParseData = ResolvedParseResult & {
  reexportMap: ReexportMap;
};
export type FileTraversalData = {
  parents: Set<string>;
};
export type FileCycleData = {
  isInCycle: boolean;
  cycleRootId: number;
};
export type FileStateData = FileTraversalData & FileParseData & FileCycleData;

export type State = {
  packageNameToBasePath: Record<string, string>;
  externals: Set<string>;
  fileData: Record<ResolvedPath, FileStateData>;
  cycleRootIdToCycleData: Record<number, CycleData>;
  tmp?: unknown;
};

export type StateWithVisitTmp = State & {
  tmp: {
    fileToIsVisited: Record<ResolvedPath, boolean>;
  };
};

export type StateWithCycleTmp = State & {
  tmp: {
    nextFileId: number;
    stack: Stack<string>;
    fileToIsVisited: Record<ResolvedPath, boolean>;
    fileToCycleData: Record<
      ResolvedPath,
      {
        id: number;
        lowLinkId: number;
      }
    >;
  };
};

// ================================================================================
// PARSING
// ================================================================================

export type TopLevelDeclaration = Record<
  string,
  {
    recursiveDependencies: string[];
    declarationLoc: SourceLocation;
    referenceLocs: SourceLocation[];
  }
>;

export type ImportSpec = {
  importFrom: string;
  name: ImportedName;
  localTopLevelName: LocalName;
};
export type AnonymousImportSpec = {
  importFrom: string;
};
export type ReexportImportSpec = {
  importFrom: string;
  importName: ImportedName;
  exportName: ExportedName;
};

/**
 * Maps exported variable name to export information
 * (could be 'default'). Coincides with a top-level local variable name
 * if it's exported via `export <const|function|class|export type> <something>`),
 * otherwise it will refer to an `exportName` from `ReexportImportSpec`.
 *
 * `locs` is the value and/or name declaration locs, e.g.:
 * - `a + b` of `export default a + b;`
 * - `a = 5` and `b = 7` of `export const a = 5, b = 7;`
 * - `q = init` and `{ q: a }` of `export const { q = init } = { q: a }`
 */
export type ExportMap = Record<
  ExportedName,
  {
    isReexport: boolean;
    dependencies: Set<LocalName>;
    locs: SourceLocation[];
  }
>;

// ================================================================================
// RESOLVE
// ================================================================================

export type ResolveFn = (opts: {
  libState: State;
  config: StandardizedConfig;
  context: string;
  request: string;
  resolveNormally: () => Promise<ResolvedRequest>;
}) => Promise<ResolvedRequest>;

export type ResolvedRequest = {
  resolvedPath: string;
  isExternal: boolean;
};

/**
 * Maps imported paths to its imported names
 */
export type ImportedRequestMap =
  | ResolvedExternalImports
  | ResolvedExternalImports;
/**
 * Maps imported names (from an imported path) to its local usage data
 */
export type ImportedNameMap = Record<
  ImportedName,
  {
    localNames: LocalName[];
    reexportNames: ExportedName[];
  }
>;
export type ResolvedExternalImports = Record<
  string,
  {
    importedNameMap: ImportedNameMap;
    hasAnonymousImport: boolean;
  }
>;
export type ResolvedModuleImports = Record<
  ResolvedPath,
  {
    importedNameMap: ImportedNameMap;
    hasAnonymousImport: boolean;
  }
>;
export type ResolvedParseResult = {
  topLevelDeclarations: TopLevelDeclaration;
  externalImports: ResolvedExternalImports;
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
export type Entries = Record<string, string | string[]>;
export type StdEntries = Record<string, string[]>;

export type ResolveObj = {
  externals?: string[];
  lookupDirs?: string[];
  alias?: Record<string, string>;
  resolveFn?: ResolveFn;
};
export type StdResolveObj = {
  externals: Set<string>;
  lookupDirs: string[];
  alias: Record<string, string>;
  resolveFn?: ResolveFn;
};
/**
 * Dictates how to resolve modules/files
 * (and which file extensions are parsed)
 */
export type Resolve = ResolveObj;
export type StdResolve = StdResolveObj;

/**
 * Globs to include/exclude files
 */
export type Glob = string;

// Default hooks
export type DefaultHookStateArg = {
  config: StandardizedConfig;
  state: State;
};
export type OnAfterInitializationFn = (arg: DefaultHookStateArg) => any;
export type OnDoneFn = (arg: DefaultHookStateArg) => any;

// Parsing hooks
export type OnAfterParseArg = DefaultHookStateArg & {
  parseResult: any;
  file: string;
  codeStr: string;
  ast: ParseResult<File>;
};
export type OnAfterParseFn = (arg: OnAfterParseArg) => any;

export type Config = {
  baseDir: string;
  entries: Entries;
  resolve?: Resolve;
  extensions?: string[];
  includes?: Glob[];
  excludes?: Glob[];
  debug?: boolean;
  onAfterInitialization?: OnAfterInitializationFn;
  onAfterParse?: OnAfterParseFn;
  onDone?: OnDoneFn;
};
export type StandardizedConfig = Overwrite<
  Config,
  {
    entries: StdEntries;
    resolve: StdResolve;
    extensions: string[];
    includeRegexes?: RegExp[];
    excludeRegexes?: RegExp[];
  }
>;
