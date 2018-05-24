'use babel';

import store from '../store';
import {
  Bisect as BisectConstants,
  State as StateConstants
} from '../constants';

export default (commitState) => {
  const { state } = store.getState();

  switch (state) {
    case StateConstants.BISECT_COMMIT_CHECKED_OUT:
      store.move(
        StateConstants.BISECT_CHECKOUT_TRIGGERED,
        { isGood: commitState === BisectConstants.commitState.GOOD }
      );
      break;

    default:
      break;
  }
};
