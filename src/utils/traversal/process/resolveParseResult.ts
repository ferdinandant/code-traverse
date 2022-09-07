import { ParseResult } from '../../parser/processAst';
import { resolveRequest } from './resolveRequest';

type Opts = {
  state: State;
  config: StandardizedConfig;
  parseResult: ParseResult;
  targetFile: string;
};

type AddToModuleImportsOpts = {
  externalImports: ResolvedExternalImports;
  moduleImports: ResolvedModuleImports;
  resolvedRequest: ResolvedRequest;
} & (
  | {
      isAnonymousImport: true;
    }
  | {
      importName: string;
      localName: string;
    }
  | {
      importName: string;
      exportName: string;
    }
);

// ================================================================================
// MAIN
// ================================================================================

export async function resolveParseResult({
  state,
  config,
  parseResult,
  targetFile,
}: Opts): Promise<ResolvedParseResult> {
  const {
    topLevelDeclarations,
    anonymousImports,
    imports,
    reexportImports,
    exportMap,
  } = parseResult;
  const externalImports = Object.create(null);
  const moduleImports: ResolvedModuleImports = Object.create(null);
  const context = targetFile;

  const resolveRequestCache: Record<string, ResolvedRequest> = Object.create(
    null
  );
  const cachedResolveRequest = async (request: string) => {
    if (resolveRequestCache[request]) {
      return resolveRequestCache[request];
    }
    return (resolveRequestCache[request] = await resolveRequest({
      state,
      config,
      request,
      context,
    }));
  };

  // Parse anonymousImports
  for (const spec of anonymousImports) {
    const { importFrom: request } = spec;
    const resolvedRequest = await cachedResolveRequest(request);
    addToImportsData({
      externalImports,
      moduleImports,
      resolvedRequest,
      isAnonymousImport: true,
    });
  }

  // Parse imports
  for (const spec of imports) {
    const {
      importFrom: request,
      name: importName,
      localTopLevelName: localName,
    } = spec;
    const resolvedRequest = await cachedResolveRequest(request);
    addToImportsData({
      externalImports,
      moduleImports,
      resolvedRequest,
      importName,
      localName,
    });
  }

  // Parse reexportImports
  for (const spec of reexportImports) {
    const { importFrom: request, importName, exportName } = spec;
    const resolvedRequest = await cachedResolveRequest(request);
    addToImportsData({
      externalImports,
      moduleImports,
      resolvedRequest,
      importName,
      exportName,
    });
  }

  return { topLevelDeclarations, externalImports, moduleImports, exportMap };
}

// ================================================================================
// HELPERS
// ================================================================================

function addToImportsData(opts: AddToModuleImportsOpts) {
  const { externalImports, moduleImports, resolvedRequest } = opts;
  const { resolvedPath, isExternal } = resolvedRequest;
  if (isExternal) {
    // Handle externals
    if (!externalImports[resolvedPath]) {
      externalImports[resolvedPath] = {
        importedNameMap: Object.create(null),
        hasAnonymousImport: false,
      };
    }
    addToExternalImportsData(opts);
  } else {
    // Handle user module import
    if (!moduleImports[resolvedPath]) {
      moduleImports[resolvedPath] = {
        importedNameMap: Object.create(null),
        hasAnonymousImport: false,
      };
    }
    addToModuleImportsData(opts);
  }
}

function addToExternalImportsData({
  externalImports,
  resolvedRequest,
  ...nameData
}: AddToModuleImportsOpts) {
  const { resolvedPath } = resolvedRequest;
  if ('isAnonymousImport' in nameData) {
    externalImports[resolvedPath].hasAnonymousImport = true;
    return;
  }
  // Initialize name map
  const { importName } = nameData;
  const { importedNameMap } = externalImports[resolvedPath];
  if (!importedNameMap[importName]) {
    importedNameMap[importName] = {
      localNames: [],
      reexportNames: [],
    };
  }
  // Add request data
  if ('importName' in nameData && 'localName' in nameData) {
    const { importName, localName } = nameData;
    importedNameMap[importName].localNames.push(localName);
  } else if ('importName' in nameData && 'exportName' in nameData) {
    const { importName, exportName } = nameData;
    importedNameMap[importName].reexportNames.push(exportName);
  } else {
    throw new Error('Unexpected condition in addToExternalImportsData');
  }
}

function addToModuleImportsData({
  moduleImports,
  resolvedRequest,
  ...nameData
}: AddToModuleImportsOpts) {
  const { resolvedPath } = resolvedRequest;
  if ('isAnonymousImport' in nameData) {
    moduleImports[resolvedPath].hasAnonymousImport = true;
    return;
  }
  // Initialize name map
  const { importName } = nameData;
  const { importedNameMap } = moduleImports[resolvedPath];
  if (!importedNameMap[importName]) {
    importedNameMap[importName] = {
      localNames: [],
      reexportNames: [],
    };
  }
  // Add request data
  if ('importName' in nameData && 'localName' in nameData) {
    const { importName, localName } = nameData;
    importedNameMap[importName].localNames.push(localName);
  } else if ('importName' in nameData && 'exportName' in nameData) {
    const { importName, exportName } = nameData;
    importedNameMap[importName].reexportNames.push(exportName);
  } else {
    throw new Error('Unexpected condition in addToExternalImportsData');
  }
}
