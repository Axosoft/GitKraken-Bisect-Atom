'use babel';

import fs from 'fs';
import path from 'path';
import R, { __ } from 'ramda';

import { State as StateConstants } from '../constants';
import makeGit from '../git';
import store from '../store';
import actions from '.';

export default async () => {
  // TODO not this:
  const [repo] = atom.project.getRepositories().filter(Boolean);
  const repoPath = repo.getWorkingDirectory();
  const git = await makeGit();

  await git.openRepo(repoPath);

  const watchedFile = path.join(repoPath, '.git', 'index');

  fs.watchFile(
    watchedFile,
    {
      interval: 1007
    },
    async () => {
      let { state } = store.getState();

      const isStateRefreshable = R.contains(__, [
        StateConstants.COMMIT_LIST_SHOWN,
        StateConstants.COMMIT_1_SELECTED,
        StateConstants.COMMIT_2_SELECTED,
        StateConstants.BISECT_CLARIFY_COMMIT_SELECTION,
        StateConstants.BISECT_COMMIT_SELECTION_CLARIFIED
      ]);

      if (!isStateRefreshable(state)) {
        return;
      }

      const { commitList, nodeBySha } =  await actions.queued.loadCommitList();

      const { bisectShas, ...restState } = store.getState();
      ({ state } = restState);

      if (!isStateRefreshable(state)) {
        return;
      }

      const hasBeginAndEndSha = R.allPass([
        R.has(bisectShas.begin),
        R.has(bisectShas.end)
      ]);

      const isSelectionStillValid = {
        [StateConstants.COMMIT_LIST_SHOWN]: R.T,
        [StateConstants.COMMIT_1_SELECTED]: R.has(bisectShas.temp),
        [StateConstants.COMMIT_2_SELECTED]: hasBeginAndEndSha,
        [StateConstants.BISECT_CLARIFY_COMMIT_SELECTION]: hasBeginAndEndSha,
        [StateConstants.BISECT_COMMIT_SELECTION_CLARIFIED]: hasBeginAndEndSha
      }[state](nodeBySha);

      if (!isSelectionStillValid) {
        store.move(StateConstants.COMMIT_LIST_SHOWN, { commitList, nodeBySha });
        atom.notifications.addInfo('Your selected commit(s) cannot be found');
      } else {
        store.move(state, { commitList, nodeBySha });
      }
    }
  );

  store.move(StateConstants.GIT_INITIALIZED, {
    git,
    repoPath,
    watchedFile
  });

  store.move(StateConstants.COMMIT_LIST_LOADING);

  store.move(StateConstants.COMMIT_LIST_SHOWN, await actions.unsafe.loadCommitList());
};
