'use babel';

import store from '../store';
import { State as StateConstants } from '../constants';

export default (sha) => {
  const state = store.getState();

  switch (state.state) {
    case StateConstants.COMMIT_LIST_SHOWN:
    case StateConstants.COMMIT_2_SELECTED:
      store.move(StateConstants.COMMIT_1_SELECTED, { sha });
      break;

    case StateConstants.COMMIT_1_SELECTED:
      if (sha === state.bisectShas.temp) {
        store.move(StateConstants.COMMIT_LIST_SHOWN);
      } else {
        store.move(StateConstants.COMMIT_2_SELECTED, { sha });
      }
      break;

    default:
      break;
  }
};
