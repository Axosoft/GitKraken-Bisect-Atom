'use babel';

import store from '../store';
import { State as StateConstants } from '../constants';

export default async () => {
  const {
    git,
    state
  } = store.getState();

  if (state === StateConstants.BISECT_COMMIT_CHECKED_OUT) {
    await git.bisect.reset();
  }

  store.move(StateConstants.COMMIT_LIST_SHOWN);
};
