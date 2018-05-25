'use babel';

import R from 'ramda';

import store from '../store';
import { State as StateConstants } from '../constants';

export default async () => {
  const {
    git,
    state
  } = store.getState();

  if (!R.contains(state, [StateConstants.COMMIT_2_SELECTED, StateConstants.BISECT_COMMIT_CHECKED_OUT])) {
    return;
  }

  if (state === StateConstants.BISECT_COMMIT_CHECKED_OUT) {
    await git.bisect.reset();
  }

  store.move(StateConstants.COMMIT_LIST_SHOWN);
};
