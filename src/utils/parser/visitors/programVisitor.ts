import { NodePath } from '@babel/traverse';
import { Program } from '@babel/types';
import { findEnclosingTopLevelNames } from '../utils/findEnclosingTopLevelNames';

type ProgramVisitorFnOpts = {
  path: NodePath<Program>;
  topLevelDeclarations: TopLevelDeclaration;
};

export function programVisitor({
  path,
  topLevelDeclarations,
}: ProgramVisitorFnOpts) {
  const bindings = path.scope.bindings;
  const bindingEntries = Object.entries(bindings);
  const topLevelNameToDependencies: Record<string, Set<string>> = Object.create(
    null
  );

  // Construct the range of each top-level declarations
  bindingEntries.forEach(([name, binding]) => {
    const declarationNode = binding.path.node;
    topLevelDeclarations[name] = {
      declarationLoc: declarationNode.loc!,
      recursiveDependencies: [],
      referenceLocs: [],
    };
    topLevelNameToDependencies[name] = new Set<string>();
  });

  // Find references (reads) and constantViolations (writes) to top-level names
  // NOTE: We reverse the dependency for writes (the written depends on the writer)
  bindingEntries.forEach(([name, binding]) => {
    const { referencePaths, constantViolations } = binding;
    referencePaths.forEach(referencePath => {
      const { node } = referencePath;
      const { loc } = node;
      const enclosingTopLevelNames = findEnclosingTopLevelNames({
        topLevelDeclarations,
        loc: node.loc!,
      });
      for (const enclosingTopLevelName of enclosingTopLevelNames) {
        topLevelNameToDependencies[enclosingTopLevelName].add(name);
      }
      topLevelDeclarations[name].referenceLocs.push(loc!);
    });
    constantViolations.forEach(constantViolationPath => {
      const { node } = constantViolationPath;
      const { loc } = node;
      const enclosingTopLevelNames = findEnclosingTopLevelNames({
        topLevelDeclarations,
        loc: node.loc!,
      });
      for (const enclosingTopLevelName of enclosingTopLevelNames) {
        topLevelNameToDependencies[name].add(enclosingTopLevelName);
      }
      topLevelDeclarations[name].referenceLocs.push(loc!);
    });
  });

  // Recursively add `dependsOn` transitive dependencies
  const nameToRecursiveDependencies: Record<string, string[]> = Object.create(
    null
  );
  Object.keys(topLevelNameToDependencies).forEach(name => {
    const visitedNames = new Set<string>();
    const visit = (name: string): string[] => {
      if (nameToRecursiveDependencies[name]) {
        return nameToRecursiveDependencies[name];
      }
      const dependencies = topLevelNameToDependencies[name];
      const recursiveDependencies: string[] = Array.from(dependencies);
      dependencies.forEach(dependency => {
        if (!visitedNames.has(dependency)) {
          visitedNames.add(dependency);
          const ans = visit(dependency);
          recursiveDependencies.push(...ans);
        }
      });
      nameToRecursiveDependencies[name] = recursiveDependencies;
      topLevelDeclarations[name].recursiveDependencies = recursiveDependencies;
      return recursiveDependencies;
    };
    visitedNames.add(name);
    visit(name);
  });
}
