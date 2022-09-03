import { SourceLocation } from '@babel/types';

/**
 * Checks if `outerLoc` includes/contains `innerLoc`
 */
export function isLocIncludesLoc(
  outerLoc: SourceLocation,
  innerLoc: SourceLocation
) {
  const {
    start: { line: osl, column: osc },
    end: { line: oel, column: oec },
  } = outerLoc;
  const {
    start: { line: isl, column: isc },
    end: { line: iel, column: iec },
  } = innerLoc;

  const isStartInRange = isl > osl || (isl === osl && isc >= osc);
  const isEndInRange = iel < oel || (iel === oel && iec <= oec);
  return isStartInRange && isEndInRange;
}
