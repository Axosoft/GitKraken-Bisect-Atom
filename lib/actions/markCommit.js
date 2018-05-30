'use babel';

import {
  Bisect as BisectConstants,
  State as StateConstants
} from '../constants';
import store from '../store';

export default async (isGood) => {
  const {
    git,
    state
  } = store.getState();

  if (
    state !== StateConstants.BISECT_COMMIT_CHECKED_OUT
    && state !== StateConstants.BISECT_REACHED_MERGE_BASE
  ) {
    return;
  }

  store.move(StateConstants.BISECT_CHECKOUT_TRIGGERED, { isGood });

  const {
    status,
    ...bisectResult
  } = await git.bisect.mark(isGood);

  const targetState = {
    [BisectConstants.status.FINISHED_RANGE]: StateConstants.BISECT_COMPLETED_RANGE,
    [BisectConstants.status.FINISHED_SINGLE]: StateConstants.BISECT_COMPLETED_SINGLE,
    [BisectConstants.status.REACHED_MERGE_BASE]: StateConstants.BISECT_REACHED_MERGE_BASE,
    [BisectConstants.status.STEP]: StateConstants.BISECT_COMMIT_CHECKED_OUT
  }[status];

  if (!targetState) {
    throw new Error('Bisect mark returned an unhandled state');
  }

  store.move(targetState, bisectResult);
};
