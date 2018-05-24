'use babel';

import path from 'path';

import { State as StateConstants } from '../constants';
import makeGit from '../git';
import store from '../store';

export default async () => {
  // TODO not this:
  const [repo] = atom.project.getRepositories().filter(Boolean);
  const repoPath = path.dirname(repo.path); // drop .git folder
  const git = await makeGit();

  await git.openRepo(repoPath);

  store.move(StateConstants.GIT_INITIALIZED, {
    git,
    repoPath
  });
};
