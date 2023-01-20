import { State, StateWithVisitTmp } from '../../types';

export function initStateWithVisitTmp(state: State) {
  const tmp: StateWithVisitTmp['tmp'] = {
    fileToIsVisited: Object.create(null),
  };
  state.tmp = tmp;
}
