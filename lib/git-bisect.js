'use babel';

import { CompositeDisposable } from 'atom';

import GitBisectView from './components/GitBisectView';
import { GIT_BISECT_URI } from './constants/AtomConstants';

let subscriptions = null;

const activate = () => {
  subscriptions = new CompositeDisposable();
  subscriptions.add(atom.workspace.addOpener(uri => {
    if (uri === GIT_BISECT_URI) return new GitBisectView();
  }));

  subscriptions.add(atom.commands.add('atom-workspace', {
    'git-bisect:toggle': () => atom.workspace.open(GIT_BISECT_URI)
  }));
};

const deactivate = () => {
  if (subscriptions) {
    subscriptions.dispose();
  }
  subscriptions = null;
};

export default {
  activate,
  deactivate
};
