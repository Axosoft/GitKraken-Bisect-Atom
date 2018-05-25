'use babel';

import R from 'ramda';

import store from '../store';
import { State as StateConstants } from '../constants';

export default async () => {
  const {
    git,
    state
  } = store.getState();

  const validStartingStates = [
    StateConstants.COMMIT_1_SELECTED,
    StateConstants.COMMIT_2_SELECTED,
    StateConstants.BISECT_COMMIT_CHECKED_OUT
  ];

  if (state === StateConstants.BISECT_COMMIT_CHECKED_OUT) {
    await git.bisect.reset();
  }

  store.move(StateConstants.COMMIT_LIST_SHOWN);
};
