'use babel';

import git from '../git';
import store from '../store';
import { State as StateConstants } from '../constants';

export default async (isGood) => {
  const {
    git,
    state
  } = store.getState();

  if (state !== StateConstants.BISECT_COMMIT_CHECKED_OUT) {
    return;
  }

  store.move(StateConstants.BISECT_CHECKOUT_TRIGGERED, { isGood });
  const { done, sha } = await git.bisect.mark(isGood);

  if (done) {
    store.move(StateConstants.BISECT_COMPLETED, { sha });
  } else {
    store.move(StateConstants.BISECT_COMMIT_CHECKED_OUT, { sha })
  }
};
