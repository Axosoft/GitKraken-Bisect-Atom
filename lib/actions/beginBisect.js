'use babel';

import git from '../git';
import store from '../store';
import { State as StateConstants } from '../constants';

export default async () => {
  const {
    bisectShas: {
      begin,
      end
    },
    git,
    state
  } = store.getState();

  if (state !== StateConstants.COMMIT_2_SELECTED) {
    return;
  }

  store.move(StateConstants.BISECT_CHECKOUT_TRIGGERED);
  const { done, sha } = await git.bisect.start(begin, end);

  if (done) {
    store.move(StateConstants.BISECT_COMPLETED, { sha });
  } else {
    store.move(StateConstants.BISECT_COMMIT_CHECKED_OUT, { sha })
  }
};
