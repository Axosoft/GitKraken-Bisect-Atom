'use babel';

import { loadCommitList } from './loadCommitList';

export default () => {
  // TODO not this:
  const [repo] = atom.project.getRepositories().filter(Boolean);
  loadCommitList(repo);
};
