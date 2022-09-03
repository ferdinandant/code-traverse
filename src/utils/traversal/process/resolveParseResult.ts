import { ParseResult } from '../../parser/processAst';
import { resolveRequest } from './resolveRequest';

type Opts = {
  state: State;
  config: StandardizedConfig;
  parseResult: ParseResult;
  targetFile: string;
};

type AddToModuleImportsOpts = {
  externalImports: Set<string>;
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
  const externalImports = new Set<string>();
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
    addToModuleImports({
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
    addToModuleImports({
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
    addToModuleImports({
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

function addToModuleImports({
  externalImports,
  moduleImports,
  resolvedRequest,
  ...nameData
}: AddToModuleImportsOpts) {
  const { resolvedPath, isExternal } = resolvedRequest;
  // Handle external imports
  if (isExternal) {
    externalImports.add(resolvedPath);
    return;
  }
  // Handle user's module import
  if (!moduleImports[resolvedPath]) {
    moduleImports[resolvedPath] = {
      importedNames: new Set<string>(),
      importedNameToLocalNames: Object.create(null),
      importedNameToReexportNames: Object.create(null),
      hasAnonymousImport: false,
    };
  }
  if ('isAnonymousImport' in nameData) {
    moduleImports[resolvedPath].hasAnonymousImport = true;
  } else if ('importName' in nameData && 'localName' in nameData) {
    const { importName, localName } = nameData;
    const moduleImportObj = moduleImports[resolvedPath];
    moduleImportObj.importedNames.add(importName);
    if (!moduleImportObj.importedNameToLocalNames[importName]) {
      moduleImportObj.importedNameToLocalNames[importName] = [];
    }
    moduleImportObj.importedNameToLocalNames[importName].push(localName);
  } else if ('importName' in nameData && 'exportName' in nameData) {
    const { importName, exportName } = nameData;
    const moduleImportObj = moduleImports[resolvedPath];
    moduleImports[resolvedPath].importedNames.add(importName);
    if (!moduleImportObj.importedNameToReexportNames[importName]) {
      moduleImportObj.importedNameToReexportNames[importName] = [];
    }
    moduleImportObj.importedNameToReexportNames[importName].push(exportName);
  } else {
    throw new Error('Unexpected condition in addToModuleImports');
  }
}
