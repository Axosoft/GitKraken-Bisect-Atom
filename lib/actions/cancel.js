'use babel';

import store from '../store';
import { State as StateConstants } from '../constants';

export default async () => {
  const {
    git,
    state
  } = store.getState();

  if (
    state === StateConstants.BISECT_COMMIT_CHECKED_OUT
    || state === StateConstants.BISECT_REACHED_MERGE_BASE
  ) {
    await git.bisect.reset();
  }

  store.move(StateConstants.COMMIT_LIST_SHOWN);
};
