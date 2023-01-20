import { SourceLocation } from '@babel/types';
import { TopLevelDeclaration } from '../../../types';
import { isLocIncludesLoc } from './isLocIncludesLoc';

type Opts = {
  topLevelDeclarations: TopLevelDeclaration;
  valueLoc: SourceLocation;
};

/**
 * Get top-level names that was referenced inside `valueLoc`
 */
export function getTopLevelDependencies({
  topLevelDeclarations,
  valueLoc,
}: Opts) {
  return Object.keys(topLevelDeclarations).filter(name => {
    const { referenceLocs } = topLevelDeclarations[name];
    const hasReferencesInRange = referenceLocs.some(refLoc =>
      isLocIncludesLoc(valueLoc, refLoc)
    );
    return hasReferencesInRange;
  });
}
