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

  const headWatcher = fs.watchFile(
    path.join(repoPath, '.git', 'index'),
    {
      interval: 1007
    },
    async () => {
      let { state } = store.getState();

      const isStateRefreshable = R.contains(__, [
        StateConstants.COMMIT_LIST_SHOWN,
        StateConstants.COMMIT_1_SELECTED,
        StateConstants.COMMIT_2_SELECTED
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

      const isSelectionStillValid = {
        [StateConstants.COMMIT_1_SELECTED]: R.has(bisectShas.temp),
        [StateConstants.COMMIT_2_SELECTED]: R.allPass([
          R.has(bisectShas.begin),
          R.has(bisectShas.end)
        ]),
        [StateConstants.COMMIT_LIST_SHOWN]: R.T
      }[state](nodeBySha);

      if (!isSelectionStillValid) {
        store.move(StateConstants.COMMIT_LIST_SHOWN, { commitList, nodeBySha });
        atom.notifications.addInfo('Your selected commit cannot be found');
      } else {
        store.move(state, { commitList, nodeBySha });
      }
    }
  );

  store.move(StateConstants.GIT_INITIALIZED, {
    git,
    headWatcher,
    repoPath
  });

  store.move(StateConstants.COMMIT_LIST_LOADING);

  store.move(StateConstants.COMMIT_LIST_SHOWN, await actions.unsafe.loadCommitList());
};
