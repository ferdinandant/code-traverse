import { State, StateWithCycleTmp } from '../../types';
import { Stack } from '../../struct/Stack';

export function initStateWithCycleTmp(state: State) {
  const tmp: StateWithCycleTmp['tmp'] = {
    nextFileId: 0,
    stack: new Stack<string>(),
    fileToIsVisited: Object.create(null),
    fileToCycleData: Object.create(null),
  };
  state.tmp = tmp;
}
