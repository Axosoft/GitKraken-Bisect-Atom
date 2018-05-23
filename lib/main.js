'use babel';

import { CompositeDisposable } from 'atom';

import { Atom as AtomConstants } from './constants';
import './actions';

import GitBisectView from './components/GitBisectView';

let subscriptions = null;

const activate = () => {
  subscriptions = new CompositeDisposable();
  subscriptions.add(atom.workspace.addOpener(uri => {
    if (uri === AtomConstants.GIT_BISECT_URI) return new GitBisectView();
  }));

  subscriptions.add(atom.commands.add('atom-workspace', {
    'git-bisect:open': () =>
      atom.workspace.open(AtomConstants.GIT_BISECT_URI, {
        location: 'right'
      })
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
