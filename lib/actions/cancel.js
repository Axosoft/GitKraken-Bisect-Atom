'use babel';

import { State as StateConstants } from '../constants';
import store from '../store';

export default () => {
  const { state } = store.getState();

  switch (state) {
    case StateConstants.COMMIT_1_SELECTED:
    case StateConstants.COMMIT_2_SELECTED:
    case StateConstants.BISECT_COMMIT_CHECKED_OUT:
      store.move(StateConstants.COMMIT_LIST_SHOWN);
      break;

    default:
  }
};
