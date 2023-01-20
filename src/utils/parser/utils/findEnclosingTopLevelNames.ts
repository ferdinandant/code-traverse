import { SourceLocation } from '@babel/types';
import { TopLevelDeclaration } from '../../../types';

type Opts = {
  topLevelDeclarations: TopLevelDeclaration;
  loc: SourceLocation;
};

/**
 * It can match multiple declarations, e.g.
 * `const { e, f } = require('./e');`
 */
export function findEnclosingTopLevelNames({
  topLevelDeclarations,
  loc: queryLoc,
}: Opts) {
  const {
    start: { line: qsl, column: qsc },
    end: { line: qel, column: qec },
  } = queryLoc;

  return Object.keys(topLevelDeclarations).filter(name => {
    const {
      declarationLoc: {
        start: { line: dsl, column: dsc },
        end: { line: del, column: dec },
      },
    } = topLevelDeclarations[name];
    const isStartInRange = qsl > dsl || (qsl === dsl && qsc >= dsc);
    const isEndInRange = qel < del || (qel === del && qec <= dec);
    return isStartInRange && isEndInRange;
  });
}
