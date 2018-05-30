'use babel';

import R from 'ramda';

import {
  Bisect as BisectConstants,
  State as StateConstants
} from '../constants';
import store from '../store';

const performBeginBisect = async (git, begin, end) => {
  store.move(StateConstants.BISECT_CHECKOUT_TRIGGERED);

  const {
    status,
    ...bisectResult
  } = await git.bisect.start(begin, end);

  const targetState = {
    [BisectConstants.status.FINISHED_RANGE]: StateConstants.BISECT_COMPLETED_RANGE,
    [BisectConstants.status.FINISHED_SINGLE]: StateConstants.BISECT_COMPLETED_SINGLE,
    [BisectConstants.status.IS_BISECTING]: StateConstants.COMMIT_LIST_SHOWN,
    [BisectConstants.status.REACHED_MERGE_BASE]: StateConstants.BISECT_REACHED_MERGE_BASE,
    [BisectConstants.status.STEP]: StateConstants.BISECT_COMMIT_CHECKED_OUT
  }[status];

  if (!targetState) {
    throw new Error('Bisect start returned an unhandled state');
  }

  if (status === BisectConstants.status.IS_BISECTING) {
    atom.notifications.addError('Bisect already running. Opening a bisect is currently not supported');
  }

  if (R.contains(targetState, [
    StateConstants.BISECT_REACHED_MERGE_BASE,
    StateConstants.BISECT_COMMIT_CHECKED_OUT
  ])) {
    const shas = await git.bisect.visualize();
    store.move(StateConstants.BISECT_SHAS_CALCULATED, { shas });
    store.move(StateConstants.BISECT_CHECKOUT_TRIGGERED);
  }

  store.move(targetState, bisectResult);
};

export default async () => {
  const {
    bisectShas: {
      begin,
      end
    },
    git,
    state
  } = store.getState();

  if (state === StateConstants.COMMIT_2_SELECTED) {
    store.move(StateConstants.BISECT_STARTED);

    const commitsAreDescendant = await git.mergeBase.isAncestor(begin, end)
      || await git.mergeBase.isAncestor(end, begin);

    if (commitsAreDescendant) {
      await performBeginBisect(git, begin, end);
    } else {
      store.move(StateConstants.BISECT_CLARIFY_COMMIT_SELECTION);
    }
  } else if (state === StateConstants.BISECT_COMMIT_SELECTION_CLARIFIED) {
    await performBeginBisect(git, begin, end);
  }
};
