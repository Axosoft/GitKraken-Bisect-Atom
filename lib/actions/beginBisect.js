'use babel';

import store from '../store';
import { State as StateConstants } from '../constants';

export default () => {
  const { state } = store.getState();

  switch (state) {
    case StateConstants.COMMIT_2_SELECTED:
      store.move(StateConstants.BISECT_CHECKOUT_TRIGGERED);
      break;

    default:
      break;
  }
};
